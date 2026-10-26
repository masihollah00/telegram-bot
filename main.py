import asyncio
import logging
import os
import re
import shutil
import time
from collections import defaultdict, deque
from pathlib import Path
from typing import Optional

from aiogram import Bot, Dispatcher, F
from aiogram.filters import Command, CommandStart
from aiogram.types import (
    Message, CallbackQuery, InlineKeyboardMarkup, InlineKeyboardButton,
    FSInputFile
)
from dotenv import load_dotenv
from pyrogram import Client
from pytgcalls import PyTgCalls
from pytgcalls.types import MediaStream
import yt_dlp

load_dotenv()
logging.basicConfig(
    level=os.getenv("LOG_LEVEL", "INFO"),
    format="%(asctime)s %(levelname)s %(name)s: %(message)s",
)
log = logging.getLogger("masih-music-player")

BOT_TOKEN = os.getenv("BOT_TOKEN", "").strip()
API_ID = os.getenv("API_ID", "").strip()
API_HASH = os.getenv("API_HASH", "").strip()
SESSION_STRING = os.getenv("SESSION_STRING", "").strip()
OWNER_IDS = {int(x) for x in os.getenv("OWNER_IDS", "").split(",") if x.strip().isdigit()}
MAX_UPLOAD_MB = int(os.getenv("MAX_UPLOAD_MB", "45"))
DOWNLOAD_DIR = Path(os.getenv("DOWNLOAD_DIR", "data/media"))
DOWNLOAD_DIR.mkdir(parents=True, exist_ok=True)

if not BOT_TOKEN or not API_ID.isdigit() or not API_HASH:
    raise RuntimeError("تنظیم BOT_TOKEN، API_ID و API_HASH در فایل .env الزامی است.")
if not SESSION_STRING:
    raise RuntimeError("SESSION_STRING تنظیم نشده؛ ابتدا session کلاینت تماس را بساز.")

bot = Bot(BOT_TOKEN)
dp = Dispatcher()

# Client MTProto جداگانه برای ورود به تماس گروهی/لایو.
# این حساب باید مجاز به دسترسی به گروه/کانال و تماس باشد.
mtproto = Client(
    "masih_music_session",
    api_id=int(API_ID),
    api_hash=API_HASH,
    session_string=SESSION_STRING,
)
calls = PyTgCalls(mtproto)

# وضعیت‌ها در حافظه‌اند؛ برای پایداری کامل در ری‌استارت، این بخش را به SQLite منتقل کنید.
queues = defaultdict(deque)
current = {}
paused = set()
last_panel_message = {}

def panel_keyboard(chat_id: int) -> InlineKeyboardMarkup:
    return InlineKeyboardMarkup(inline_keyboard=[
        [
            InlineKeyboardButton(text="⏮ قبلی", callback_data=f"prev:{chat_id}"),
            InlineKeyboardButton(text="⏸ مکث", callback_data=f"pause:{chat_id}"),
            InlineKeyboardButton(text="▶️ ادامه", callback_data=f"resume:{chat_id}"),
            InlineKeyboardButton(text="⏭ بعدی", callback_data=f"skip:{chat_id}"),
        ],
        [
            InlineKeyboardButton(text="⏹ توقف", callback_data=f"stop:{chat_id}"),
            InlineKeyboardButton(text="📃 صف پخش", callback_data=f"queue:{chat_id}"),
            InlineKeyboardButton(text="🔄 بروزرسانی", callback_data=f"refresh:{chat_id}"),
        ],
        [
            InlineKeyboardButton(text="➕ راهنمای افزودن", callback_data=f"help:{chat_id}"),
        ],
    ])

def nice_name(item: dict) -> str:
    return str(item.get("title") or item.get("name") or "رسانه بدون نام")[:100]

def panel_text(chat_id: int) -> str:
    item = current.get(chat_id)
    if item:
        status = "⏸ مکث شده" if chat_id in paused else "▶️ در حال پخش"
        title = nice_name(item)
    else:
        status, title = "⏹ متوقف", "چیزی در حال پخش نیست"
    return (
        "🎧 <b>MASIH MUSIC PLAYER</b>\n"
        "━━━━━━━━━━━━━━\n"
        f"📡 وضعیت: {status}\n"
        f"🎵 رسانه: <b>{title}</b>\n"
        f"📚 تعداد در صف: {len(queues[chat_id])}\n\n"
        "از دکمه‌های زیر برای کنترل پخش استفاده کن."
    )

async def send_panel(chat_id: int, target_message: Message | None = None):
    text = panel_text(chat_id)
    if target_message:
        await target_message.answer(text, reply_markup=panel_keyboard(chat_id), parse_mode="HTML")
    else:
        await bot.send_message(chat_id, text, reply_markup=panel_keyboard(chat_id), parse_mode="HTML")

async def is_admin(chat_id: int, user_id: int) -> bool:
    if user_id in OWNER_IDS:
        return True
    try:
        member = await bot.get_chat_member(chat_id, user_id)
        return member.status in ("creator", "administrator")
    except Exception:
        # در کانال خصوصی یا تنظیمات نامناسب، به‌صورت امن اجازه کنترل نمی‌دهیم.
        return False

async def play_item(chat_id: int, item: dict):
    path = item.get("path")
    if not path or not Path(path).exists():
        raise FileNotFoundError("فایل رسانه پیدا نشد.")
    # PyTgCalls می‌تواند فایل صوتی یا ویدیویی سازگار با FFmpeg را پخش کند.
    await calls.play(chat_id, path)
    current[chat_id] = item
    paused.discard(chat_id)

async def start_next(chat_id: int):
    if not queues[chat_id]:
        current.pop(chat_id, None)
        paused.discard(chat_id)
        return False
    item = queues[chat_id].popleft()
    await play_item(chat_id, item)
    return True

async def queue_item(chat_id: int, item: dict):
    if chat_id in current:
        queues[chat_id].append(item)
        return "به صف پخش اضافه شد."
    await play_item(chat_id, item)
    return "پخش شروع شد. اگر تماس فعالی وجود نداشته باشد یا حساب تماس دسترسی نداشته باشد، خطای پخش نمایش داده می‌شود."

def safe_file_name(name: str) -> str:
    name = re.sub(r"[^A-Za-z0-9آ-ی._ -]+", "_", name).strip()
    return name[:100] or f"media_{int(time.time())}"

async def download_search(query: str) -> dict:
    """جست‌وجوی فراداده و دریافت رسانه با yt-dlp؛ فقط برای محتوایی استفاده کنید که مجاز به پخش/دریافت آن هستید."""
    if len(query) > 180:
        raise ValueError("عبارت جست‌وجو خیلی طولانی است.")
    opts = {
        "format": "bestaudio/best",
        "outtmpl": str(DOWNLOAD_DIR / "%(id)s.%(ext)s"),
        "noplaylist": True,
        "quiet": True,
        "no_warnings": True,
        "restrictfilenames": True,
        "max_filesize": MAX_UPLOAD_MB * 1024 * 1024,
        "postprocessors": [{
            "key": "FFmpegExtractAudio",
            "preferredcodec": "mp3",
            "preferredquality": "192",
        }],
    }
    loop = asyncio.get_running_loop()
    def work():
        with yt_dlp.YoutubeDL({**opts, "extract_flat": "in_playlist"}) as ydl:
            info = ydl.extract_info(f"ytsearch1:{query}", download=False)
            entries = info.get("entries") or []
            if not entries:
                raise ValueError("نتیجه‌ای پیدا نشد.")
            first = entries[0]
            # دریافت واقعی همان نتیجه، با رعایت حقوق و شرایط منبع.
            full = ydl.extract_info(first.get("webpage_url") or first.get("url"), download=True)
            filepath = ydl.prepare_filename(full)
            stem = str(Path(filepath).with_suffix(""))
            mp3 = Path(stem + ".mp3")
            if mp3.exists():
                filepath = str(mp3)
            elif not Path(filepath).exists():
                candidates = list(DOWNLOAD_DIR.glob(f"{full.get('id','')}.*"))
                if not candidates:
                    raise FileNotFoundError("فایل دریافت‌شده پیدا نشد.")
                filepath = str(candidates[0])
            return {"title": full.get("title", query), "path": filepath, "source": "search"}
    return await loop.run_in_executor(None, work)

@dp.message(CommandStart())
async def start_cmd(message: Message):
    await message.answer(
        "🎧 <b>به MASIH MUSIC PLAYER خوش آمدی</b>\n\n"
        "برای پنل در گروه یا کانال بنویس «پنل» یا /panel.\n"
        "برای جست‌وجو: /play نام آهنگ\n"
        "برای فایل: فایل صوتی/ویدیویی را در گروه بفرست و به آن پاسخ «پخش» بده.\n\n"
        "⚠️ این نسخه نیازمند حساب MTProto و تماس فعال است. از رسانه‌هایی استفاده کن که اجازه پخش آن‌ها را داری.",
        parse_mode="HTML"
    )

@dp.message(Command("panel"))
@dp.message(F.text.regexp(r"^(پنل|پنل موزیک)$"))
async def panel_cmd(message: Message):
    if message.chat.type not in ("group", "supergroup", "channel"):
        await message.answer("پنل کنترل پخش را از داخل همان گروه یا کانالی باز کن که تماس در آن فعال است.")
        return
    await send_panel(message.chat.id, message)

@dp.message(Command("play"))
async def play_cmd(message: Message):
    if message.chat.type not in ("group", "supergroup", "channel"):
        await message.answer("این دستور را داخل گروه یا کانال مقصد اجرا کن.")
        return
    query = (message.text or "").partition(" ")[2].strip()
    if not query:
        await message.answer("نمونه: /play نام آهنگ")
        return
    if not await is_admin(message.chat.id, message.from_user.id):
        await message.answer("برای جست‌وجو و شروع پخش، دسترسی مدیر لازم است.")
        return
    status = await message.answer("🔎 در حال جست‌وجو و آماده‌سازی رسانه…")
    try:
        item = await download_search(query)
        result = await queue_item(message.chat.id, item)
        await status.edit_text(f"🎵 <b>{nice_name(item)}</b>\n{result}", parse_mode="HTML")
        await send_panel(message.chat.id)
    except Exception as exc:
        log.exception("search/play failed")
        await status.edit_text(f"پخش انجام نشد: {str(exc)[:250]}\nتماس را بررسی کن و لاگ سرور را ببین.")

@dp.message(F.reply_to_message, F.text.regexp(r"^(پخش|به صف|افزودن به صف)$"))
async def play_replied_file(message: Message):
    if message.chat.type not in ("group", "supergroup", "channel"):
        await message.answer("این کار را در گروه یا کانال مقصد انجام بده.")
        return
    if not message.from_user or not await is_admin(message.chat.id, message.from_user.id):
        await message.answer("برای شروع پخش، دسترسی مدیر لازم است.")
        return
    src = message.reply_to_message
    media = src.audio or src.voice or src.video or src.document or src.animation
    if not media:
        await message.answer("به یک فایل صوتی یا ویدیویی پاسخ بده.")
        return
    size = getattr(media, "file_size", None) or 0
    if size > MAX_UPLOAD_MB * 1024 * 1024:
        await message.answer(f"فایل از سقف تنظیم‌شده ({MAX_UPLOAD_MB} مگابایت) بزرگ‌تر است.")
        return
    try:
        tgfile = await bot.get_file(media.file_id)
        suffix = Path(getattr(media, "file_name", "") or "upload.bin").suffix or ".bin"
        dest = DOWNLOAD_DIR / f"upload_{message.chat.id}_{int(time.time())}{suffix}"
        await bot.download_file(tgfile.file_path, destination=dest)
        item = {
            "title": getattr(media, "file_name", None) or "فایل ارسالی",
            "path": str(dest),
            "source": "upload",
        }
        result = await queue_item(message.chat.id, item)
        await message.answer(f"🎵 {result}", reply_markup=panel_keyboard(message.chat.id))
    except Exception as exc:
        log.exception("upload/play failed")
        await message.answer(f"فایل آماده پخش نشد: {str(exc)[:200]}")

@dp.callback_query(F.data)
async def callbacks(call: CallbackQuery):
    try:
        action, raw_chat_id = (call.data or "").split(":", 1)
        chat_id = int(raw_chat_id)
    except Exception:
        await call.answer("دکمه نامعتبر است.", show_alert=True)
        return

    if not call.from_user or not await is_admin(chat_id, call.from_user.id):
        await call.answer("فقط مدیران گروه/کانال می‌توانند پخش را کنترل کنند.", show_alert=True)
        return

    try:
        if action == "pause":
            await calls.pause(chat_id)
            paused.add(chat_id)
            await call.answer("پخش مکث شد.")
        elif action == "resume":
            await calls.resume(chat_id)
            paused.discard(chat_id)
            await call.answer("پخش ادامه یافت.")
        elif action == "stop":
            await calls.leave_call(chat_id)
            current.pop(chat_id, None)
            paused.discard(chat_id)
            queues[chat_id].clear()
            await call.answer("پخش متوقف شد.")
        elif action == "skip":
            await calls.leave_call(chat_id)
            current.pop(chat_id, None)
            paused.discard(chat_id)
            if await start_next(chat_id):
                await call.answer("مورد بعدی شروع شد.")
            else:
                await call.answer("صف خالی است.")
        elif action == "prev":
            await call.answer("برای برگشت به قبلی، در این نسخه باید آن مورد دوباره به صف اضافه شود.", show_alert=True)
        elif action == "queue":
            titles = [nice_name(x) for x in list(queues[chat_id])[:10]]
            text = "📃 <b>صف پخش</b>\n" + ("\n".join(f"{i+1}. {x}" for i, x in enumerate(titles)) if titles else "صف خالی است.")
            await call.message.answer(text, parse_mode="HTML")
            await call.answer()
        elif action == "help":
            await call.message.answer(
                "🎧 راهنما:\n/play نام آهنگ — جست‌وجو\n"
                "به فایل صوتی/ویدیویی پاسخ بده و «پخش» بفرست.\n"
                "کنترل‌های مکث، ادامه، بعدی و توقف در پنل هستند."
            )
            await call.answer()
        else:
            await call.answer()
        if action in {"pause", "resume", "stop", "skip", "prev", "refresh"}:
            await call.message.edit_text(
                panel_text(chat_id),
                reply_markup=panel_keyboard(chat_id),
                parse_mode="HTML",
            )
    except Exception as exc:
        log.exception("callback action failed: %s", action)
        await call.answer("عملیات انجام نشد؛ تماس فعال است و حساب پخش دسترسی دارد؟", show_alert=True)

async def main():
    await mtproto.start()
    calls.start()
    log.info("PyTgCalls started")
    try:
        await dp.start_polling(bot, allowed_updates=dp.resolve_used_update_types())
    finally:
        try:
            await calls.stop()
        except Exception:
            pass
        await mtproto.stop()
        await bot.session.close()

if __name__ == "__main__":
    asyncio.run(main())
