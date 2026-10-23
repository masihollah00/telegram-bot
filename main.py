
# -*- coding: utf-8 -*-
"""MASIH GUARD S1000+ — single-file Telegram group management bot."""
import os, re, json, time, random, threading, io, urllib.request, urllib.error, html, socket
from urllib.parse import urlparse, parse_qs
from datetime import datetime, date
import telebot
from telebot import types

# ---------------- Configuration ----------------
BOT_TOKEN = (os.getenv("BOT_TOKEN") or os.getenv("TELEGRAM_BOT_TOKEN") or "").strip()
OWNER_ID = int(os.getenv("OWNER_ID", "8620924698"))
DATA_FILE = os.getenv("DATA_FILE", "masih_guard_data.json")
AI_API_KEY = os.getenv("AI_API_KEY", "").strip()
AI_BASE_URL = os.getenv("AI_BASE_URL", "https://openrouter.ai/api/v1").rstrip("/")
AI_MODEL = os.getenv("AI_MODEL", "openai/gpt-4o-mini").strip()
CARD_NUMBER = os.getenv("CARD_NUMBER", "").strip()
CARD_HOLDER = os.getenv("CARD_HOLDER", "").strip()
WEBSITE_URL = os.getenv("WEBSITE_URL", "https://neon-portfolio-7vhj.onrender.com").strip()
CHANNEL_URL = os.getenv("CHANNEL_URL", "https://t.me/IRHACK_APP33").strip()
OWNER_CONTACT_URL = os.getenv("OWNER_CONTACT_URL", "https://t.me/Ma3ih01").strip()
BRAND, VERSION = "MASIH GUARD", "S1000+"
if not BOT_TOKEN:
    raise RuntimeError("BOT_TOKEN تنظیم نشده است؛ آن را در Environment هاست قرار بده.")

bot = telebot.TeleBot(BOT_TOKEN, parse_mode="HTML", threaded=True, num_threads=4)
LOCK = threading.RLock()
WAITING, GAMES, PANEL_CURRENT, PANEL_HISTORY = {}, {}, {}, {}
BOT_USERNAME = ""
BOT_ID = 0

DEFAULT_GROUP = {
    "anti_link": True, "anti_ads": True, "anti_spam": True, "anti_repeat": True,
    "anti_forward": False, "media_lock": False, "lock_mentions": False, "lock_hashtags": False, "lock_usernames": False, "welcome_on": True,
    "farewell_on": False, "join_approval": False, "bad_words": [], "whitelist": [],
    "warn_limit": 3, "lock_photos": False, "lock_videos": False, "lock_files": False,
    "lock_stickers": False, "lock_voice": False, "lock_video_notes": False,
    "rules": "احترام به اعضا الزامی است.",
    "welcome_text": "سلام {name}، به گروه خوش آمدی!", "farewell_text": "خداحافظ {name}",
    "auto_replies": {}, "custom_commands": {}, "phone_filter": False,
    "smart_security": True, "quiet_hours_on": False, "quiet_start": "23:00", "quiet_end": "07:00",
    "welcome_image": "", "welcome_delete_seconds": 0
}
DEFAULT_DATA = {
    "groups": {}, "warnings": {}, "logs": [], "proxies": [], "customers": {}, "moderation_lists": {}, "message_history": {},
    "tickets": {}, "points": {}, "seen": {}, "stats": {"messages": 0, "blocked": 0,
    "warns": 0, "joins": 0, "tickets": 0},
    "settings": {"smart_security": True},
    "bot_settings": {
        "public_features": "", "channel_url": "https://t.me/IRHACK_APP33",
        "website_url": "https://neon-portfolio-7vhj.onrender.com",
        "referral_reward_toman": 5000,
        "subscription_packages": [[30, 40000], [60, 80000], [90, 120000]]
    },
    "users": {}, "referrals": {}, "subscriptions": {}, "transactions": {},
    "subscription_requests": {}, "payout_requests": {},
    "last_daily": {}, "group_licenses": {}, "join_requests": {}, "group_requests": {},
    "group_stats": {}, "active_members": {}, "manager_roles": {}
}

def clone(obj): return json.loads(json.dumps(obj, ensure_ascii=False))
def esc(value): return html.escape(str(value or ""), quote=False)
def now_text(): return datetime.now().strftime("%Y-%m-%d %H:%M:%S")
def today(): return date.today().isoformat()

def load_data():
    try:
        with open(DATA_FILE, "r", encoding="utf-8") as f:
            data = json.load(f)
        if not isinstance(data, dict): raise ValueError("Invalid data")
    except (OSError, ValueError, TypeError):
        data = clone(DEFAULT_DATA)
    for k, v in DEFAULT_DATA.items():
        if k not in data: data[k] = clone(v)
    for k, v in DEFAULT_DATA["stats"].items(): data["stats"].setdefault(k, v)
    for k, v in DEFAULT_DATA["settings"].items(): data["settings"].setdefault(k, v)
    data.setdefault("group_licenses", {})
    data.setdefault("join_requests", {})
    data.setdefault("group_requests", {})
    data.setdefault("moderation_lists", {})
    data.setdefault("message_history", {})
    data.setdefault("group_requests", {})
    data.setdefault("group_stats", {})
    data.setdefault("active_members", {})
    data.setdefault("manager_roles", {})
    data.setdefault("subscription_requests", {})
    data.setdefault("payout_requests", {})
    # Migration away from the retired diamond economy. Old diamond balances and
    # histories are deliberately discarded instead of being misrepresented as Toman.
    if isinstance(data.get("users"), dict):
        for _user in data["users"].values():
            if isinstance(_user, dict):
                _user.pop("diamonds", None)
                _user.setdefault("wallet_toman", 0)
                _user.pop("last_daily", None)
                _user.pop("last_luck", None)
    if isinstance(data.get("transactions"), dict):
        # Clear only legacy diamond rows once; preserve new Toman transaction history.
        for _key, _rows in list(data["transactions"].items()):
            if isinstance(_rows, list) and any(isinstance(_row, dict) and "amount_toman" not in _row for _row in _rows):
                data["transactions"][_key] = []
    for k, v in DEFAULT_DATA.items():
        if isinstance(v, dict) and not isinstance(data.get(k), dict): data[k] = clone(v)
        if isinstance(v, list) and not isinstance(data.get(k), list): data[k] = clone(v)
    return data

DATA = load_data()

def save_data():
    with LOCK:
        tmp = DATA_FILE + ".tmp"
        with open(tmp, "w", encoding="utf-8") as f:
            json.dump(DATA, f, ensure_ascii=False, indent=2)
            f.flush()
            os.fsync(f.fileno())
        os.replace(tmp, DATA_FILE)

def add_log(action, chat_id="", user_id="", detail=""):
    with LOCK:
        DATA["logs"].append({"time": now_text(), "action": str(action), "chat_id": str(chat_id),
                             "user_id": str(user_id), "detail": str(detail)[:250]})
        DATA["logs"] = DATA["logs"][-800:]
        save_data()

def is_owner(uid): return int(uid or 0) == OWNER_ID

def ensure_user(uid, username="", first_name=""):
    key = str(int(uid))
    with LOCK:
        user = DATA["users"].setdefault(key, {"wallet_toman": 0, "username": "", "first_name": "", "joined": now_text()})
        # Remove legacy currency fields on every access as a final migration guard.
        user.pop("diamonds", None)
        user.setdefault("wallet_toman", 0)
        if username: user["username"] = username
        if first_name: user["first_name"] = first_name
        DATA["transactions"].setdefault(key, [])
    return user

def wallet(uid):
    return max(0, int(ensure_user(uid).get("wallet_toman", 0)))

def transaction(uid, amount_toman, reason):
    key = str(int(uid))
    amount_toman = int(amount_toman)
    with LOCK:
        user = ensure_user(uid)
        new_balance = int(user.get("wallet_toman", 0)) + amount_toman
        if new_balance < 0: return False
        user["wallet_toman"] = new_balance
        history = DATA["transactions"].setdefault(key, [])
        history.append({"time": now_text(), "amount_toman": amount_toman,
                        "reason": str(reason)[:120], "balance_toman": new_balance})
        DATA["transactions"][key] = history[-100:]
        save_data()
    return True

def get_group_settings(chat_id):
    key = str(chat_id)
    if key not in DATA["groups"]: DATA["groups"][key] = clone(DEFAULT_GROUP)
    settings = DATA["groups"][key]
    for k, v in DEFAULT_GROUP.items(): settings.setdefault(k, clone(v))
    return settings

def group_license_status(chat_id):
    """Return (active, license_record); a license can be permanent or time-limited."""
    record = DATA.setdefault("group_licenses", {}).get(str(chat_id), {})
    if not record or not record.get("approved", False):
        return False, record
    expires = str(record.get("expires", "") or "").strip()
    if not expires:
        return True, record
    try:
        active = datetime.strptime(expires, "%Y-%m-%d %H:%M:%S") > datetime.now()
    except ValueError:
        active = False
    return active, record

def is_group_licensed(chat_id):
    return group_license_status(chat_id)[0]

def support_contact_markup():
    kb = types.InlineKeyboardMarkup()
    kb.add(types.InlineKeyboardButton("📩 ارتباط با پشتیبان نصب", url=f"tg://user?id={OWNER_ID}"))
    return kb

def group_install_message(chat_id, title="این گروه"):
    return ("🛡️ <b>فعال‌سازی MASIH GUARD</b>\n━━━━━━━━━━━━━━━━━━\n"
            f"برای استفاده از امکانات مدیریتی در «{esc(title)}»، باید مجوز نصب از پشتیبانی دریافت شود.\n\n"
            "📩 برای بررسی و فعال‌سازی، با پشتیبان ربات ارتباط بگیرید.")

def bot_settings():
    """Return current Toman settings; legacy diamond settings are removed."""
    settings = DATA.setdefault("bot_settings", clone(DEFAULT_DATA["bot_settings"]))
    settings.pop("daily_reward", None); settings.pop("luck_max", None)
    settings.pop("referral_reward", None); settings.pop("shop_packages", None)
    settings.setdefault("referral_reward_toman", 5000)
    settings["subscription_packages"] = [[30, 40000], [60, 80000], [90, 120000]]
    for key, value in DEFAULT_DATA["bot_settings"].items(): settings.setdefault(key, clone(value))
    return settings

def start_welcome_text(user):
    """Persian /start greeting with a clickable Telegram user mention."""
    raw_name = " ".join(x for x in [getattr(user, "first_name", ""), getattr(user, "last_name", "")] if x).strip() or "دوست عزیز"
    mention = f'<a href="tg://user?id={int(user.id)}">{esc(raw_name)}</a>'
    default_text = (
        f"🛡️ سلام {mention} 🌹\n\n"
        "به <b>MASIH GUARD S1000+</b> خوش اومدی.\n"
        "ربات برای مدیریت و ایمن‌سازی گروه‌های تلگرام طراحی شده است.\n\n"
        "🔐 امکانات موجود شامل کنترل لینک و تبلیغات، ضداسپم، مدیریت اعضا، "
        "قوانین، خوشامدگویی، گزارش‌ها و ابزارهای کمکی است؛ عملکرد هر قابلیت "
        "به مجوزهای ربات و تنظیمات گروه بستگی دارد.\n\n"
        "🧠 دستیار هوش مصنوعی از بخش مربوطه در دسترس است؛ برای پاسخ‌گویی باید "
        "کلید سرویس هوش مصنوعی روی هاست تنظیم شده باشد.\n\n"
        "👇 از دکمه‌های زیر برای شروع استفاده کن.\n"
        "📌 تنظیمات مدیریتی فقط برای مالک مجاز است."
    )
    custom = str(bot_settings().get("public_features", "") or "").strip()
    if custom:
        marker = "__MASIH_CLICKABLE_USER_MENTION__"
        safe_custom = esc(custom.replace("{name}", marker)).replace(marker, mention)
        return safe_custom
    return default_text




def group_start_guide(chat_title="گروه"):
    return (
        f"🛡️ <b>راهنمای MASIH GUARD S1000+ برای {esc(chat_title or 'گروه')}</b>\n"
        "━━━━━━━━━━━━━━━━━━\n"
        "👋 سلام! برای مدیریت گروه، ربات باید مدیر گروه باشد و مجوزهای لازم را داشته باشد.\n\n"
        "🔐 تنظیمات پنل و مدیریت مالک در گفت‌وگوی خصوصی ربات انجام می‌شود؛ پیام‌های پنل در گروه منتشر نمی‌شوند.\n"
        "🧰 مدیران گروه می‌توانند از فرمان‌های فارسی پشتیبانی‌شده استفاده کنند؛ برای اقدام روی یک عضو، روی پیام همان عضو ریپلای کنید.\n"
        "📜 برای دیدن قوانین بنویسید «قوانین»، برای آمار «آمار»، و برای راهنمای فرمان‌ها «راهنما».\n"
        "⚠️ بعضی امکانات فقط با مجوز فعال گروه و دسترسی ادمین ربات کار می‌کنند."
    )


def public_features_text():
    custom = str(bot_settings().get("public_features", "") or "").strip()
    return esc(custom) if custom else PUBLIC_FEATURES

def configured_url(key, fallback):
    value = str(bot_settings().get(key, "") or fallback).strip()
    return value if value.startswith(("https://", "http://")) else fallback

def is_group_admin(chat_id, user_id):
    if is_owner(user_id): return True
    try: return bot.get_chat_member(chat_id, user_id).status in ("administrator", "creator")
    except Exception: return False

# ---------------- Menus ----------------
SECTIONS = {
    "security":"🛡 امنیت گروه", "members":"👥 مدیریت اعضا", "settings":"⚙️ تنظیمات گروه",
    "welcome":"👋 خوشامد و خداحافظی", "rules":"📜 قوانین و پاسخ خودکار",
    "referrals":"👥 کیف پول تومانی و اشتراک",
    "stats":"📊 آمار و گزارش", "customers":"💼 مشتریان و اشتراک",
    "tickets":"🎫 تیکت پشتیبانی", "ai":"🧠 هوش مصنوعی",
    "backup":"💾 پشتیبان‌گیری", "daily":"📅 گزارش روزانه",
    "smart":"🧩 امنیت هوشمند", "status":"🚀 وضعیت ربات",
    "bot_settings":"🎛️ تنظیمات عمومی ربات", "licenses":"🛡️ مجوز نصب گروه‌ها", "full_control":"🎛️ کنترل کامل ربات"
}

PUBLIC_FEATURES = (
    "🌈 <b>MASIH GUARD S1000+</b>\n"
    "━━━━━━━━━━━━━━━━━━━━\n"
    "🛡 <b>امنیت گروه</b>\n"
    "├ ضد لینک و تبلیغات\n├ ضد اسپم و پیام تکراری\n├ کنترل فوروارد و رسانه\n"
    "├ کلمات ممنوع و اخطار خودکار\n\n"
    "👥 <b>مدیریت اعضا</b>\n"
    "├ اخطار، سکوت، رفع سکوت\n├ مسدودسازی، آزادسازی و اخراج\n"
    "├ خوشامد و خداحافظی سایبری\n├ تأیید درخواست عضویت\n├ سنجاق پیام و پاک‌سازی پیام‌ها با فرمان مدیر\n\n"
    "⚙️ <b>ابزارهای کاربردی</b>\n"
    "├ قوانین و پاسخ خودکار\n├ تبدیل رایگان متن به ۱۰۰ سبک فونت در گفت‌وگوی خصوصی\n"
    "├ دریافت پروکسی‌های ذخیره‌شده\n├ هوش مصنوعی و تیکت پشتیبانی\n"
    "├ بازی، امتیاز و گزارش فعالیت\n\n"
    "💳 <b>کیف پول تومانی و اشتراک</b>\n"
    "├ پاداش ۵٬۰۰۰ تومانی برای دعوت معتبر\n├ تاریخچهٔ تراکنش‌های تومانی\n"
    "├ اشتراک‌های ۳۰، ۶۰ و ۹۰ روزه\n├ فعال‌سازی پس از تأیید مالک\n\n"
    "━━━━━━━━━━━━━━━━━━━━\n"
    "👇 از دکمه‌های زیر برای شروع استفاده کن."
)

def public_keyboard():
    kb = types.InlineKeyboardMarkup(row_width=2)
    kb.row(types.InlineKeyboardButton("💳 کیف پول تومانی", callback_data="user:wallet"),
           types.InlineKeyboardButton("🛒 خرید اشتراک", callback_data="user:shop"))
    kb.row(types.InlineKeyboardButton("👥 زیرمجموعه‌گیری", callback_data="user:referrals"),
           types.InlineKeyboardButton("🧾 تراکنش‌ها", callback_data="user:transactions"))
    kb.row(types.InlineKeyboardButton("💸 درخواست برداشت از کیف پول", callback_data="user:payout"))
    kb.row(types.InlineKeyboardButton("🎫 پشتیبانی", callback_data="user:ticket"),
           types.InlineKeyboardButton("🧠 هوش مصنوعی", callback_data="user:ai"))
    kb.row(types.InlineKeyboardButton("👨‍💻 پیام به سازنده", url=OWNER_CONTACT_URL),
           types.InlineKeyboardButton("🌐 وب‌سایت", url=configured_url("website_url", WEBSITE_URL)))
    return kb

def owner_start_keyboard():
    """Private start menu with a direct, owner-only management entry."""
    kb = public_keyboard()
    if kb.keyboard and kb.keyboard[-1]:
        kb.keyboard.append([types.InlineKeyboardButton("👑 پنل مدیریت مالک", callback_data="panel:home")])
    return kb

def main_keyboard():
    kb = types.InlineKeyboardMarkup(row_width=2)
    palette = ["🔴", "🟠", "🟡", "🟢", "🔵", "🟣", "🌈"]
    items = list(SECTIONS.items())
    for i in range(0, len(items), 2):
        row = []
        for j, (key, title) in enumerate(items[i:i+2]):
            row.append(types.InlineKeyboardButton(f'{palette[(i+j) % len(palette)]} {title}',
                                                   callback_data='panel:'+key))
        kb.row(*row)
    kb.row(types.InlineKeyboardButton("🌐 وب‌سایت رسمی", url=configured_url("website_url", WEBSITE_URL)))
    kb.row(types.InlineKeyboardButton("👨‍💻 پیام به سازنده", url=OWNER_CONTACT_URL))
    return kb

def section_keyboard(section):
    kb = types.InlineKeyboardMarkup(row_width=1)
    choices = {
      "security":[("🔗 ضد لینک","toggle:anti_link"),("📢 ضد تبلیغ","toggle:anti_ads"),("🚫 ضد اسپم","toggle:anti_spam"),("🔁 ضد پیام تکراری","toggle:anti_repeat"),("↪️ ضد فوروارد","toggle:anti_forward"),("🖼 قفل رسانه","toggle:media_lock"),("🔗 قفل لینک و نام کاربری","toggle:anti_link"),("📵 فیلتر شماره تماس","toggle:phone_filter"),("🖼 قفل عکس","toggle:lock_photos"),("🎞 قفل فیلم","toggle:lock_videos"),("📁 قفل فایل","toggle:lock_files"),("🎭 قفل استیکر و گیف","toggle:lock_stickers"),("🎙 قفل پیام صوتی","toggle:lock_voice"),("⭕ قفل ویدئوی گرد","toggle:lock_video_notes"),("📂 فهرست کاربران مجاز","show:whitelist"),("➕ افزودن کاربر مجاز","ask:add_whitelist"),("➖ حذف کاربر مجاز","ask:remove_whitelist"),
      ("🧠 امنیت هوشمند این گروه","toggle:group_smart_security"),("🌙 ساعت سکوت شبانه","ask:quiet_hours"),("🆔 شناسه و تنظیمات گروه","ask:group_settings")],
      "welcome":[("👋 خوشامدگویی","toggle:welcome_on"),("👋 پیام خداحافظی","toggle:farewell_on"),("🛂 تأیید خودکار ورود","toggle:join_approval"),("✏️ تنظیم متن خوشامد","ask:welcome_text"),("✏️ تنظیم متن خداحافظی","ask:farewell_text"),
      ("🖼 تنظیم تصویر خوشامد","ask:welcome_image"),("🗑 زمان حذف خوشامد","ask:welcome_delete_seconds")],
      "rules":[("📜 مشاهده قوانین","show:rules"),("✏️ تنظیم قوانین","ask:rules"),("💬 افزودن پاسخ خودکار","ask:auto_reply"),("🗑 حذف پاسخ خودکار","ask:delete_reply"),("🚫 افزودن کلمه ممنوع","ask:bad_word"),("🧩 افزودن فرمان اختصاصی","ask:add_custom_command"),("🗑 حذف فرمان اختصاصی","ask:delete_custom_command"),("📣 ارسال اطلاعیه","ask:announcement")],
      "members":[(x, "ask:"+a) for x,a in [("⚠️ اخطار عضو","warn"),("🔇 سکوت عضو","mute"),("🔊 رفع سکوت","unmute"),("⛔ مسدودسازی","ban"),("✅ رفع مسدودی","unban"),("👢 اخراج عضو","kick"), ("🧹 پاک‌کردن اخطارها","clear_warnings"), ("📋 فهرست مسدودها","show:ban_list"), ("🔇 فهرست ساکت‌ها","show:mute_list"), ("🔎 اطلاعات عضو","ask:member_info")]],
      "settings":[("⚙️ تنظیم سقف اخطار","ask:warn_limit"),("📜 تنظیم قوانین","ask:rules")],
      "referrals":[("💳 آمار کیف پول تومانی","show:wallet_stats"),("👥 آمار دعوت‌ها","show:referral_stats"),("🛒 درخواست‌های اشتراک","show:subscription_requests"),("💸 درخواست‌های برداشت","show:payout_requests"),("➕ تنظیم موجودی کیف پول","ask:wallet_adjust"),("📦 بسته‌های اشتراک","show:shop")],
      "stats":[("📊 آمار ربات","show:stats"),("🧾 گزارش فعالیت","show:logs"),("📈 آمار یک گروه","ask:group_stats"),("📅 گزارش روزانه","show:daily"),("📅 گزارش هفتگی","show:weekly_report"),("🛡 وضعیت امنیت","show:security_status"),("💳 فروش و تمدید اشتراک","show:subscription_sales"),("🔎 جست‌وجوی گزارش‌ها","ask:search_logs")],
      "customers":[("➕ افزودن مشتری","ask:add_customer"),("📋 فهرست مشتریان","show:customers"),("🔎 جست‌وجوی مشتری","ask:find_customer")],
      "tickets":[("🎫 ثبت تیکت","ask:ticket"),("📋 تیکت‌ها","show:tickets")],
      "ai":[("🧠 پرسش از هوش مصنوعی","ask:ai")],
      "backup":[("💾 دریافت نسخه پشتیبان","show:backup")],
      "daily":[("📅 گزارش روزانه","show:daily")],
      "smart":[("🧩 روشن/خاموش امنیت هوشمند","toggle:smart_security")],
      "status":[("🚀 وضعیت ربات","show:status")],
      "licenses":[("➕ فعال‌سازی مجوز گروه","ask:activate_group"),("🗓 تمدید مجوز گروه","ask:extend_group"),("⛔ لغو مجوز گروه","ask:revoke_group"),("📋 فهرست گروه‌های مجاز","show:group_licenses"),("📨 درخواست‌های نصب","show:group_requests")],
      "full_control":[
        ("🔗 قفل لینک","toggle:anti_link"),("📢 قفل تبلیغات","toggle:anti_ads"),
        ("🚫 قفل اسپم","toggle:anti_spam"),("🔁 قفل پیام تکراری","toggle:anti_repeat"),
        ("↪️ قفل فوروارد","toggle:anti_forward"),("🖼 قفل همه رسانه‌ها","toggle:media_lock"),
        ("🏷 قفل تگ/منشن","toggle:lock_mentions"),("#️⃣ قفل هشتگ","toggle:lock_hashtags"),
        ("👤 قفل نام‌کاربری (@)","toggle:lock_usernames"),
        ("🖼 قفل عکس","toggle:lock_photos"),("🎞 قفل فیلم","toggle:lock_videos"),
        ("📁 قفل فایل","toggle:lock_files"),("🎭 قفل استیکر/گیف","toggle:lock_stickers"),
        ("🎙 قفل ویس","toggle:lock_voice"),("⭕ قفل ویدئوی گرد","toggle:lock_video_notes"),
        ("📵 فیلتر شماره تماس","toggle:phone_filter"),("🧠 امنیت هوشمند گروه","toggle:group_smart_security"),
        ("👋 خوشامدگویی","toggle:welcome_on"),("🌙 خداحافظی","toggle:farewell_on"),
        ("🛂 تأیید ورود","toggle:join_approval"),("🌙 تنظیم ساعت سکوت","ask:quiet_hours"),
        ("⚙️ سقف اخطار","ask:warn_limit"),("📜 تنظیم قوانین","ask:rules"),
        ("🆔 نمایش تنظیمات یک گروه","ask:group_settings")
      ],
      "bot_settings":[
        ("🎛️ کنترل کامل ربات (همه تنظیمات)","panel:full_control"),
        ("📝 متن معرفی /start","ask:public_features"),
        ("📢 تغییر لینک کانال","ask:channel_url"),
        ("🌐 تغییر لینک وب‌سایت","ask:website_url"),
        ("👥 تنظیم پاداش دعوت (تومان)","ask:referral_reward_toman"),
        ("📋 مشاهده تنظیمات فعلی","show:bot_settings")
      ]
    }
    for label, data in choices.get(section, []):
        kb.add(types.InlineKeyboardButton(label, callback_data=data))
    kb.row(types.InlineKeyboardButton("🏠 صفحهٔ اصلی پنل", callback_data="panel:home"),
           types.InlineKeyboardButton("⬅️ بازگشت", callback_data="panel:back"))
    return kb

def send_panel(chat_id, section="home", message_id=None, user_id=None):
    # The menu can be viewed by anyone in private chat; every privileged callback is owner-gated.
    if user_id is not None and int(chat_id) != int(user_id):
        try: bot.send_message(user_id, "🔐 این پنل فقط در گفت‌وگوی خصوصی ربات نمایش داده می‌شود.")
        except Exception: pass
        return
    if user_id is not None: PANEL_CURRENT[user_id] = section
    if section == "home":
        text = f"🌈 <b>{BRAND} {VERSION}</b>\n━━━━━━━━━━━━━━━━━━\n👑 پنل مدیریت اختصاصی مالک\n\nیکی از بخش‌ها را انتخاب کن."
        kb = main_keyboard()
    else:
        text = f"🌈 <b>{BRAND} {VERSION}</b>\n━━━━━━━━━━━━━━━━━━\n<b>{esc(SECTIONS.get(section, 'پنل مدیریت'))}</b>\n\nتنظیمات را انتخاب کن."
        kb = section_keyboard(section)
    if message_id is not None:
        try:
            bot.edit_message_text(text, chat_id, message_id, reply_markup=kb)
            return
        except Exception as e:
            if "message is not modified" in str(e).lower(): return
            print("Panel edit error:", repr(e))
    bot.send_message(chat_id, text, reply_markup=kb)

# ---------------- Font/proxy/referrals/rewards ----------------
# 50 free font styles. Latin letters use Unicode variants where available;
# decorative wrappers keep Persian/Arabic text readable too.
_LATIN = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz"
def _range_map(upper_start, lower_start=None, upper_count=26, lower_count=26):
    src, dst = _LATIN, []
    if upper_start is not None:
        dst.extend(chr(upper_start+i) for i in range(26))
    else:
        dst.extend("ABCDEFGHIJKLMNOPQRSTUVWXYZ")
    if lower_start is not None:
        dst.extend(chr(lower_start+i) for i in range(26))
    else:
        dst.extend("abcdefghijklmnopqrstuvwxyz")
    return str.maketrans(src, "".join(dst))

FONT_MAPS = [
 str.maketrans(_LATIN, "𝔸𝔹ℂ𝔻𝔼𝔽𝔾ℍ𝕀𝕁𝕂𝕃𝕄ℕ𝕆ℙℚℝ𝕊𝕋𝕌𝕍𝕎𝕏𝕐ℤ𝕒𝕓𝕔𝕕𝕖𝕗𝕘𝕙𝕚𝕛𝕜𝕝𝕞𝕟𝕠𝕡𝕢𝕣𝕤𝕥𝕦𝕧𝕨𝕩𝕪𝕫"),
 str.maketrans(_LATIN, "𝘈𝘉𝘊𝘋𝘌𝘍𝘎𝘏𝘐𝘑𝘒𝘓𝘔𝘕𝘖𝘗𝘘𝘙𝘚𝘛𝘜𝘝𝘞𝘟𝘠𝘡𝘢𝘣𝘤𝘥𝘦𝘧𝘨𝘩𝘪𝘫𝘬𝘭𝘮𝘯𝘰𝘱𝘲𝘳𝘴𝘵𝘶𝘷𝘸𝘹𝘺𝘻"),
 str.maketrans(_LATIN, "ＡＢＣＤＥＦＧＨＩＪＫＬＭＮＯＰＱＲＳＴＵＶＷＸＹＺａｂｃｄｅｆｇｈｉｊｋｌｍｎｏｐｑｒｓｔｕｖｗｘｙｚ"),
 _range_map(0x1D400,0x1D41A), # bold
 _range_map(0x1D434,0x1D44E), # italic
 _range_map(0x1D468,0x1D482), # bold italic
 _range_map(0x1D49C,0x1D4B6), # script
 _range_map(0x1D4D0,0x1D4EA), # bold script
 _range_map(0x1D504,0x1D51E), # fraktur
 _range_map(0x1D56C,0x1D586), # bold fraktur
 _range_map(0x1D538,0x1D552), # double-struck
 _range_map(0x1D5A0,0x1D5BA), # sans
 _range_map(0x1D5D4,0x1D5EE), # sans bold
 _range_map(0x1D608,0x1D622), # sans italic
 _range_map(0x1D63C,0x1D656), # sans bold italic
 _range_map(0x1D670,0x1D68A), # monospace
 str.maketrans(_LATIN, "ⒶⒷⒸⒹⒺⒻⒼⒽⒾⒿⓀⓁⓂⓃⓄⓅⓆⓇⓈⓉⓊⓋⓌⓍⓎⓏⓐⓑⓒⓓⓔⓕⓖⓗⓘⓙⓚⓛⓜⓝⓞⓟⓠⓡⓢⓣⓤⓥⓦⓧⓨⓩ"),
 str.maketrans(_LATIN, "🄰🄱🄲🄳🄴🄵🄶🄷🄸🄹🄺🄻🄼🄽🄾🄿🅀🅁🅂🅃🅄🅅🅆🅇🅈🅉abcdefghijklmnopqrstuvwxyz"),
]
FONT_NAMES = [
 "دوبل‌استراک", "ایتالیک", "فول‌ویدث", "بولد", "ایتالیک کلاسیک", "بولد ایتالیک", "اسکریپت", "اسکریپت بولد", "فرکتور", "فرکتور بولد", "دوبل‌لاین", "سن‌سریف", "سن‌سریف بولد", "سن‌سریف ایتالیک", "سن‌سریف بولد ایتالیک", "مونو‌اسپیس", "دایره‌ای", "کادر مربع"
]
FONT_WRAPPERS = [
 ("✨ ستاره‌ای", "✦ {} ✦"), ("🌟 درخشان", "🌟 {} 🌟"), ("💜 قلبی", "💜 {} 💜"), ("🖤 تیره", "🖤 {} 🖤"),
 ("⚡ برقی", "⚡ {} ⚡"), ("🔥 آتشی", "🔥 {} 🔥"), ("🌈 رنگین‌کمانی", "🌈 {} 🌈"), ("👑 سلطنتی", "♛ {} ♛"),
 ("༺ سلطنتی ۲", "༺ {} ༻"), ("꧁ فانتزی", "꧁ {} ꧂"), ("『 کادری ۱ 』", "『 {} 』"), ("【 کادری ۲ 】", "【 {} 】"),
 ("《 کادری ۳ 》", "《 {} 》"), ("〈 کادری ۴ 〉", "〈 {} 〉"), ("• نقطه‌ای", "• {} •"), ("⋆ ستاره‌ای ۲", "⋆｡ {} ｡⋆"),
 ("♡ قلب توخالی", "♡ {} ♡"), ("ღ قلبی ۲", "ღ {} ღ"), ("ツ ژاپنی", "ツ {} ツ"), ("メ ژاپنی ۲", "メ {} メ"),
 ("〆 ژاپنی ۳", "〆 {} 〆"), ("彡 سایه‌ای", "彡 {} 彡"), ("乂 ضربدری", "乂 {} 乂"), ("× ضربدری ۲", "× {} ×"),
 ("➳ پیکانی", "➳ {} ➳"), ("➤ پیکانی ۲", "➤ {} ➤"), ("☯ نمادین", "☯ {} ☯"), ("☾ ماه", "☾ {} ☽"),
 ("༄ تزئینی", "༄ {} ༄"), ("𓆩 قاب ۱", "𓆩 {} 𓆪"), ("⫷ قاب ۲", "⫷ {} ⫸"), ("༒ تاریک", "༒ {} ༒")
]


EXTRA_FONT_WRAPPERS = [
    ("نئونی", "✧ {} ✧"),
    ("الماسی", "◇ {} ◇"),
    ("شاهانه", "♛ {} ♛"),
    ("ستارهٔ دنباله‌دار", "☄ {} ☄"),
    ("خورشیدی", "☀ {} ☀"),
    ("ماه‌تاب", "☾ {} ☽"),
    ("برگی", "❧ {} ❧"),
    ("گل‌دار", "❀ {} ❀"),
    ("گل رز", "🌹 {} 🌹"),
    ("شعله", "♨ {} ♨"),
    ("موجی", "≈ {} ≈"),
    ("کریستالی", "◈ {} ◈"),
    ("هندسی", "◆ {} ◆"),
    ("کمانی", "⌁ {} ⌁"),
    ("خطی", "═ {} ═"),
    ("دوخطی", "╬ {} ╬"),
    ("کلاسیک", "❖ {} ❖"),
    ("نقش‌دار", "۞ {} ۞"),
    ("ستارهٔ هشت‌پر", "✵ {} ✵"),
    ("ستارهٔ چهارپر", "✣ {} ✣"),
    ("قاب پررنگ", "【 {} 】"),
    ("قاب زاویه‌ای", "⟪ {} ⟫"),
    ("قاب دوبل", "《 {} 》"),
    ("قاب مثلثی", "⟬ {} ⟭"),
    ("قاب موج", "≋ {} ≋"),
    ("خط‌چین", "┄ {} ┄"),
    ("خط‌بلند", "━━ {} ━━"),
    ("کادر گوشه‌دار", "┏ {} ┓"),
    ("کادر پایین", "┗ {} ┛"),
    ("شطرنجی", "▣ {} ▣"),
    ("چهارگوش", "▪ {} ▪"),
    ("لوزی", "♦ {} ♦"),
    ("دایرهٔ توپر", "● {} ●"),
    ("دایرهٔ توخالی", "○ {} ○"),
    ("مثلثی", "▲ {} ▲"),
    ("پیکان‌دار", "➳ {} ➳"),
    ("بال‌دار", "༺ {} ༻"),
    ("افسانه‌ای", "𓆩 {} 𓆪"),
    ("تاریک ۲", "☠ {} ☠"),
    ("جادویی", "⋆｡ {} ｡⋆"),
    ("قلب قرمز", "❤️ {} ❤️"),
    ("قلب آبی", "💙 {} 💙"),
    ("قلب سبز", "💚 {} 💚"),
    ("قلب زرد", "💛 {} 💛"),
    ("قلب بنفش", "💜 {} 💜"),
    ("درخشش", "💫 {} 💫"),
    ("ستاره رنگی", "🌟 {} 🌟"),
    ("تاج و تخت", "♕ {} ♕"),
    ("شمشیر", "⚔ {} ⚔"),
    ("شیر و خورشید", "🦁 {} 🦁"),
]


def font_variants(text):
    variants=[]
    has_persian = bool(re.search(r"[\u0600-\u06ff]", text))
    # Persian/Arabic letters have no broadly supported Unicode mathematical font alphabets.
    # For Persian words, the first 18 styles therefore add distinct frames while Latin is mapped.
    for i, mapping in enumerate(FONT_MAPS):
        name = FONT_NAMES[i] if i < len(FONT_NAMES) else f"سبک {i+1}"
        converted = text.translate(mapping)
        if has_persian and i < len(FONT_WRAPPERS):
            wrapper_name, wrapper = FONT_WRAPPERS[i]
            converted = wrapper.format(converted)
            name = f"{name} + {wrapper_name}"
        variants.append((name, converted))
    for name, wrapper in FONT_WRAPPERS:
        variants.append((name, wrapper.format(text)))
    for name, wrapper in EXTRA_FONT_WRAPPERS:
        variants.append((name, wrapper.format(text)))
    # Exactly 100 outputs: Unicode Latin mappings plus decorative wrappers for Persian.
    return variants[:100]
def convert_font(text, style=0):
    variants = font_variants(text)
    return variants[style % len(variants)][1]

def apply_referral(uid, payload):
    """Credit one referral from Telegram's private /start=ref_ID deep link.
    Telegram does not expose a reliable inviter ID on ordinary group join events;
    therefore the invite is credited when the new user starts the bot with the link.
    """
    if not str(payload).startswith("ref_"): return False
    try: referrer = int(str(payload)[4:])
    except (TypeError, ValueError): return False
    uid, referrer = int(uid), int(referrer)
    if referrer == uid: return False
    key = str(uid)
    with LOCK:
        if key in DATA.setdefault("referrals", {}): return False
        ensure_user(uid)
        ensure_user(referrer)
        DATA["referrals"][key] = {"referrer": referrer, "time": now_text(), "rewarded": True}
        reward = max(0, min(1000000, int(bot_settings().get("referral_reward_toman", 5000))))
        if reward:
            transaction(referrer, reward, f"پاداش دعوت کاربر {uid}")
        add_log("referral", "", uid, f"referrer={referrer}; reward_toman={reward}")
        save_data()
    try:
        bot.send_message(referrer, f"🎉 دعوت معتبر ثبت شد!\n💳 مبلغ واریزی: {reward:,} تومان\nموجودی کیف پول: {wallet(referrer):,} تومان")
    except Exception: pass
    return True

def referral_text(uid):
    global BOT_USERNAME
    if not BOT_USERNAME:
        try: BOT_USERNAME = bot.get_me().username or ""
        except Exception: pass
    link = f"https://t.me/{BOT_USERNAME}?start=ref_{uid}" if BOT_USERNAME else "نام کاربری ربات هنوز در دسترس نیست."
    count = sum(1 for x in DATA.get("referrals", {}).values() if int(x.get("referrer", 0)) == int(uid))
    reward = max(0, int(bot_settings().get("referral_reward_toman", 5000)))
    return (f"👥 <b>دعوت دوستان</b>\n━━━━━━━━━━━━━━\n🔗 لینک دعوت اختصاصی شما:\n<code>{esc(link)}</code>\n\n"
            f"👥 دعوت‌های ثبت‌شده: {count}\n💳 پاداش هر دعوت معتبر: {reward:,} تومان\n"
            "⚠️ برای ثبت و واریز پاداش، کاربر جدید باید از لینک شما وارد گفت‌وگوی خصوصی ربات شود و Start را بزند. هر کاربر فقط یک‌بار حساب می‌شود.")

SUBSCRIPTION_PACKAGES = ((30, 40000), (60, 80000), (90, 120000))

def subscription_support_keyboard():
    """Official purchase support links; bank details are never invented by the bot."""
    kb = types.InlineKeyboardMarkup(row_width=1)
    kb.add(types.InlineKeyboardButton("👨‍💻 دریافت اطلاعات پرداخت از سازنده", url=OWNER_CONTACT_URL))
    kb.add(types.InlineKeyboardButton("🛒 برگشت به بسته‌های اشتراک", callback_data="user:shop"))
    return kb

def shop_keyboard():
    """Compact subscription menu using real Telegram inline buttons."""
    kb = types.InlineKeyboardMarkup(row_width=1)
    labels = {
        30: "🥉 ۳۰ روزه  ·  ۴۰٬۰۰۰ تومان",
        60: "🥈 ۶۰ روزه  ·  ۸۰٬۰۰۰ تومان",
        90: "🥇 ۹۰ روزه  ·  ۱۲۰٬۰۰۰ تومان",
    }
    for days, price in SUBSCRIPTION_PACKAGES:
        kb.add(types.InlineKeyboardButton(
            labels.get(days, f"⭐ {days} روز  ·  {price:,} تومان"),
            callback_data=f"shop:request:{days}:{price}"
        ))
    kb.row(types.InlineKeyboardButton("💳 کیف پول", callback_data="user:wallet"),
           types.InlineKeyboardButton("🧾 تراکنش‌ها", callback_data="user:transactions"))
    kb.add(types.InlineKeyboardButton("👨‍💻 پشتیبانی و اطلاعات پرداخت", url=OWNER_CONTACT_URL))
    kb.add(types.InlineKeyboardButton("⬅️ بازگشت به منو", callback_data="user:home"))
    return kb


def shop_text(uid):
    sub = DATA.setdefault("subscriptions", {}).get(str(uid), {})
    expiry = sub.get("expires") or "اشتراک فعال نیست"
    package_text = "\n".join(
        f"  ├ {days} روز  ·  <b>{price:,} تومان</b>"
        for days, price in SUBSCRIPTION_PACKAGES
    )
    status_icon = "🟢" if sub.get("expires") else "⚪"
    lines = [
        "💠 <b>مرکز اشتراک</b>",
        "<b>MASIH GUARD S1000+</b>",
        "━━━━━━━━━━━━━━━━━━",
        f"{status_icon} وضعیت: <b>{'فعال' if sub.get('expires') else 'غیرفعال'}</b>",
        f"💳 موجودی کیف پول: <b>{wallet(uid):,} تومان</b>",
        f"📅 پایان اشتراک: <b>{esc(expiry)}</b>",
        "━━━━━━━━━━━━━━━━━━",
        "💎 <b>بسته‌ات رو انتخاب کن</b>",
        package_text,
        "",
        "🧾 <b>مراحل خرید</b>",
        "۱. یکی از بسته‌های بالا را انتخاب کن.",
        "۲. درخواست خرید برای مالک ثبت می‌شود.",
        "۳. مبلغ دقیق را پرداخت کن و از دکمهٔ «ارسال رسید پرداخت» عکس رسید را بفرست.",
        "۴. اشتراک پس از بررسی و تأیید مالک فعال می‌شود.",
        "",
    ]
    if CARD_NUMBER and CARD_HOLDER:
        lines.extend([
            "💳 <b>اطلاعات پرداخت</b>",
            f"شماره کارت: <code>{esc(CARD_NUMBER)}</code>",
            f"به نام: <b>{esc(CARD_HOLDER)}</b>",
        ])
    else:
        lines.append("💬 برای دریافت اطلاعات پرداخت معتبر، دکمهٔ «پشتیبانی و اطلاعات پرداخت» را بزن.")
    lines.extend([
        "",
        "🔒 رمز کارت، رمز پویا یا اطلاعات ورود بانکی را برای هیچ‌کس نفرست.",
        "<i>MASIH GUARD • Subscription Center</i>",
    ])
    return "\n".join(lines)


def public_wallet(uid):
    ensure_user(uid)
    sub = DATA.setdefault("subscriptions", {}).get(str(uid), {})
    return (f"💳 <b>کیف پول تومانی</b>\n━━━━━━━━━━━━━━\n"
            f"💰 موجودی: <b>{wallet(uid):,} تومان</b>\n"
            f"🎮 امتیاز بازی: {DATA.get('points', {}).get(str(uid),0)}\n"
            f"⭐ اشتراک ویژه تا: {esc(sub.get('expires','نداری'))}")

def transactions_text(uid):
    rows = DATA.setdefault("transactions", {}).get(str(uid), [])[-12:]
    if not rows: return "🧾 هنوز تراکنش تومانی ثبت نشده است."
    return "🧾 <b>آخرین تراکنش‌های تومانی</b>\n" + "\n".join(
        f"{'➕' if int(x.get('amount_toman',0)) >= 0 else '➖'} {abs(int(x.get('amount_toman',0))):,} تومان — {esc(x.get('reason'))}\n<code>{esc(x.get('time'))}</code>"
        for x in reversed(rows))

def request_subscription(uid, days, price):
    days, price, uid = int(days), int(price), int(uid)
    if (days, price) not in SUBSCRIPTION_PACKAGES:
        return "❌ بستهٔ اشتراک معتبر نیست."
    ensure_user(uid)
    reqs = DATA.setdefault("subscription_requests", {})
    # Avoid duplicate pending requests for the same user/package.
    for rid, req in reqs.items():
        if int(req.get("user_id", 0)) == uid and req.get("status") == "pending":
            if int(req.get("days", 0)) == days:
                return f"⏳ درخواست این بسته قبلاً ثبت شده است. شناسه درخواست: {esc(rid)}\nمنتظر بررسی مالک بمان."
    rid = str(int(time.time() * 1000)) + str(uid)[-4:]
    req = {"user_id": uid, "days": days, "price_toman": price, "status": "pending", "created": now_text()}
    reqs[rid] = req
    save_data()
    kb = types.InlineKeyboardMarkup(row_width=2)
    kb.row(types.InlineKeyboardButton("✅ تأیید و فعال‌سازی", callback_data=f"subreq:approve:{rid}"),
           types.InlineKeyboardButton("❌ رد درخواست", callback_data=f"subreq:reject:{rid}"))
    try:
        bot.send_message(OWNER_ID, f"💳 <b>درخواست خرید اشتراک</b>\nشناسه: <code>{esc(rid)}</code>\nکاربر: <code>{uid}</code>\nبسته: {days} روز\nمبلغ: {price:,} تومان\nوضعیت پرداخت را خارج از ربات بررسی کن و فقط پس از دریافت وجه تأیید بزن.", reply_markup=kb)
    except Exception as e:
        # Keep it pending so the owner can still review it from the panel later.
        reqs[rid]["owner_notice_failed"] = True
        reqs[rid]["notice_error"] = str(e)[:160]
        save_data()
        return "⚠️ درخواست ذخیره شد، اما پیام مستقیم به مالک نرسید. از بخش «درخواست‌های اشتراک» پنل مالک هم قابل بررسی است."
    add_log("subscription_requested", "", uid, f"request={rid}; days={days}; price_toman={price}")
    return (f"🧾 <b>درخواست خرید ثبت شد</b>\n━━━━━━━━━━━━━━━━━━━━\n"
            f"📦 بسته: {days} روز\n💳 مبلغ قابل پرداخت: <b>{price:,} تومان</b>\n"
            f"🆔 شناسه درخواست: <code>{esc(rid)}</code>\n\n"
            "👨‍💻 برای دریافت اطلاعات بانکی معتبر، به پیوی سازنده پیام بده؛ شماره کارت را حدس نمی‌زنیم و داخل ربات نمایش نمی‌دهیم.\n"
            "پس از انتقال وجه، رسید یا شماره پیگیری را به سازنده ارسال کن. مالک بعد از بررسی پرداخت درخواست را تأیید می‌کند و سپس اشتراک فعال می‌شود.\n"
            "⚠️ تا قبل از تأیید مالک، اشتراک فعال نیست.")

def decide_subscription_request(rid, approve, owner_uid):
    if not is_owner(owner_uid): return "⛔ فقط مالک ربات مجاز است."
    req = DATA.setdefault("subscription_requests", {}).get(str(rid))
    if not req: return "❌ درخواست پیدا نشد."
    if req.get("status") != "pending": return f"ℹ️ این درخواست قبلاً بررسی شده است: {esc(req.get('status'))}"
    uid, days = int(req["user_id"]), int(req["days"])
    if not approve:
        req["status"] = "rejected"; req["reviewed"] = now_text(); req["reviewed_by"] = int(owner_uid)
        save_data(); add_log("subscription_rejected", "", uid, f"request={rid}")
        try: bot.send_message(uid, f"❌ درخواست اشتراک شما رد شد. شناسه: {esc(rid)}\nاگر فکر می‌کنی اشتباهی شده، با پشتیبانی تماس بگیر.")
        except Exception: pass
        return "❌ درخواست رد شد."
    from datetime import timedelta
    now = datetime.now()
    current = DATA.setdefault("subscriptions", {}).get(str(uid), {}).get("expires", "")
    try: base = datetime.strptime(current, "%Y-%m-%d %H:%M:%S")
    except Exception: base = now
    if base < now: base = now
    expires = (base + timedelta(days=days)).strftime("%Y-%m-%d %H:%M:%S")
    DATA["subscriptions"][str(uid)] = {"expires": expires, "updated": now_text(), "approved_request": str(rid)}
    req["status"] = "approved"; req["reviewed"] = now_text(); req["reviewed_by"] = int(owner_uid); req["expires"] = expires
    save_data(); add_log("subscription_approved", "", uid, f"request={rid}; days={days}; expires={expires}")
    try: bot.send_message(uid, f"🎉 <b>اشتراک MASIH GUARD فعال شد!</b>\n━━━━━━━━━━━━━━━━━━━━\n✅ پرداخت بررسی و تأیید شد.\n⭐ مدت اشتراک: {days} روز\n📅 پایان اشتراک: <b>{esc(expires)}</b>\n👨‍💻 برای پشتیبانی یا تمدید، از دکمهٔ ارتباط با سازنده استفاده کن.", reply_markup=subscription_support_keyboard())
    except Exception: pass
    return f"✅ درخواست تأیید شد؛ اشتراک کاربر {uid} تا {esc(expires)} فعال شد."



def request_payout(uid, amount_toman):
    uid, amount_toman = int(uid), int(amount_toman)
    if amount_toman <= 0: return "❌ مبلغ برداشت باید بیشتر از صفر باشد."
    if amount_toman > wallet(uid): return f"❌ موجودی کافی نیست. موجودی فعلی: {wallet(uid):,} تومان"
    requests = DATA.setdefault("payout_requests", {})
    for rid, req in requests.items():
        if int(req.get("user_id", 0)) == uid and req.get("status") == "pending":
            return f"⏳ یک درخواست برداشت در انتظار بررسی داری. شناسه: <code>{esc(rid)}</code>"
    rid = str(int(time.time() * 1000)) + str(uid)[-4:]
    requests[rid] = {"user_id": uid, "amount_toman": amount_toman, "status": "pending", "created": now_text()}
    save_data()
    kb = types.InlineKeyboardMarkup(row_width=2)
    kb.row(types.InlineKeyboardButton("✅ ثبت پرداخت انجام‌شده", callback_data=f"payout:paid:{rid}"),
           types.InlineKeyboardButton("❌ رد درخواست", callback_data=f"payout:reject:{rid}"))
    try:
        bot.send_message(OWNER_ID, f"💸 <b>درخواست برداشت کیف پول</b>\nشناسه: <code>{esc(rid)}</code>\nکاربر: <code>{uid}</code>\nمبلغ: {amount_toman:,} تومان\nروش پرداخت را با کاربر هماهنگ کن و فقط پس از واریز واقعی، «ثبت پرداخت انجام‌شده» را بزن.", reply_markup=kb)
    except Exception as e:
        requests[rid]["owner_notice_failed"] = True
        requests[rid]["notice_error"] = str(e)[:160]
        save_data()
    add_log("payout_requested", "", uid, f"request={rid}; amount_toman={amount_toman}")
    return f"📨 درخواست برداشت {amount_toman:,} تومان ثبت شد. مالک پس از بررسی و هماهنگی پرداخت آن را بررسی می‌کند.\nشناسه: <code>{esc(rid)}</code>\nتا تأیید نهایی، موجودی از کیف پول کم نمی‌شود."

def decide_payout_request(rid, paid, owner_uid):
    if not is_owner(owner_uid): return "⛔ فقط مالک ربات مجاز است."
    req = DATA.setdefault("payout_requests", {}).get(str(rid))
    if not req: return "❌ درخواست برداشت پیدا نشد."
    if req.get("status") != "pending": return f"ℹ️ این درخواست قبلاً بررسی شده است: {esc(req.get('status'))}"
    uid, amount = int(req["user_id"]), int(req["amount_toman"])
    if not paid:
        req["status"] = "rejected"; req["reviewed"] = now_text(); req["reviewed_by"] = int(owner_uid)
        save_data(); add_log("payout_rejected", "", uid, f"request={rid}")
        try: bot.send_message(uid, f"❌ درخواست برداشت شما رد شد. مبلغ از کیف پول کم نشده است. شناسه: <code>{esc(rid)}</code>")
        except Exception: pass
        return "❌ درخواست برداشت رد شد؛ موجودی تغییری نکرد."
    if wallet(uid) < amount:
        req["status"] = "balance_insufficient"; req["reviewed"] = now_text(); req["reviewed_by"] = int(owner_uid)
        save_data()
        return "❌ موجودی کاربر از زمان ثبت درخواست کمتر شده؛ پرداخت ثبت نشد."
    if not transaction(uid, -amount, f"برداشت تأییدشده {rid}"):
        return "❌ کسر موجودی انجام نشد؛ درخواست در انتظار بررسی باقی ماند."
    req["status"] = "paid"; req["reviewed"] = now_text(); req["reviewed_by"] = int(owner_uid)
    save_data(); add_log("payout_paid", "", uid, f"request={rid}; amount_toman={amount}")
    try: bot.send_message(uid, f"✅ درخواست برداشت ثبت و پرداخت‌شده علامت‌گذاری شد.\n💸 مبلغ: {amount:,} تومان\n💳 موجودی باقی‌مانده: {wallet(uid):,} تومان")
    except Exception: pass
    return f"✅ پرداخت درخواست {esc(rid)} ثبت شد؛ موجودی کیف پول کاربر به‌روزرسانی شد."


# ---------------- Security and moderation ----------------
def get_text(message): return getattr(message, "text", None) or getattr(message, "caption", None) or ""
def has_link(text): return bool(re.search(r"(https?://|www\.|t\.me/|telegram\.me/|@[A-Za-z0-9_]{5,})", text or "", re.I))
def has_ad(text): return any(x in (text or "").casefold() for x in ["تبلیغ", "تبلیغات", "خرید ممبر", "فروش ممبر", "عضوگیری", "کسب درآمد تضمینی"])
def is_forwarded(m): return any(getattr(m, x, None) for x in ("forward_origin","forward_from","forward_from_chat","forward_date"))
def has_media(m): return any(getattr(m,x,None) for x in ("photo","video","audio","voice","document","animation","sticker","video_note","contact","location"))
def safe_delete(message):
    try: bot.delete_message(message.chat.id, message.message_id); return True
    except Exception as e: print("Delete error:", repr(e)); return False

def normalize_security_text(value):
    """Normalize whitespace, invisible marks and punctuation to catch simple filter evasion."""
    value = str(value or "").casefold()
    value = re.sub(r"[\u200b-\u200f\u202a-\u202e\ufeff]", "", value)
    value = re.sub(r"[\W_]+", "", value, flags=re.UNICODE)
    return value

def is_quiet_hours(settings, moment=None):
    if not settings.get("quiet_hours_on"):
        return False
    moment = moment or datetime.now()
    try:
        start = datetime.strptime(str(settings.get("quiet_start", "23:00")), "%H:%M").time()
        end = datetime.strptime(str(settings.get("quiet_end", "07:00")), "%H:%M").time()
    except ValueError:
        return False
    current = moment.time()
    if start == end:
        return True
    return (start <= current < end) if start < end else (current >= start or current < end)

def track_group_activity(chat_id, user_id, message_id=None):
    key = str(chat_id)
    stats = DATA.setdefault("group_stats", {}).setdefault(key, {"messages": 0, "blocked": 0, "joins": 0, "leaves": 0})
    stats["messages"] = int(stats.get("messages", 0)) + 1
    if user_id:
        members = DATA.setdefault("active_members", {}).setdefault(key, {})
        members[str(user_id)] = time.time()
    if message_id is not None:
        history = DATA.setdefault("message_history", {}).setdefault(key, [])
        history.append({"message_id": int(message_id), "user_id": int(user_id or 0), "time": time.time()})
        DATA["message_history"][key] = history[-300:]

def warn_member(chat_id, user_id, reason="تخلف از قوانین"):
    key=f"{chat_id}:{user_id}"
    DATA["warnings"][key]=int(DATA["warnings"].get(key,0))+1
    count=DATA["warnings"][key]; limit=max(1,int(get_group_settings(chat_id).get("warn_limit",3) or 3))
    DATA["stats"]["warns"]+=1
    try: bot.send_message(chat_id,f"⚠️ اخطار برای <code>{user_id}</code>\nدلیل: {esc(reason)}\nتعداد: {count}/{limit}")
    except Exception: pass
    add_log("warning",chat_id,user_id,reason)
    if count >= limit:
        try:
            bot.ban_chat_member(chat_id,user_id)
            bot.send_message(chat_id,f"⛔ کاربر <code>{user_id}</code> به سقف اخطار رسید و مسدود شد.")
            DATA["warnings"][key]=0
        except Exception as e: print("Auto-ban error:",repr(e))
    save_data()

def process_group_security(message):
    chat,user=message.chat,message.from_user
    if not user or chat.type not in ("group","supergroup") or is_group_admin(chat.id,user.id): return False
    s=get_group_settings(chat.id)
    if not DATA.get("settings", {}).get("smart_security", True) or not s.get("smart_security", True): return False
    if str(user.id) in {str(x) for x in s.get("whitelist", [])}: return False
    text=get_text(message); key=f"{chat.id}:{user.id}"
    prev=DATA["seen"].get(key,{}); now=time.time(); reason=None
    if is_quiet_hours(s): reason="ارسال پیام در ساعت سکوت شبانه"
    elif s.get("media_lock") and has_media(message): reason="ارسال رسانه در حالت قفل رسانه"
    elif s.get("anti_forward") and is_forwarded(message): reason="ارسال پیام فورواردشده"
    elif s.get("lock_photos") and getattr(message,"photo",None): reason="ارسال عکس در حالت قفل عکس"
    elif s.get("lock_videos") and getattr(message,"video",None): reason="ارسال فیلم در حالت قفل فیلم"
    elif s.get("lock_files") and getattr(message,"document",None): reason="ارسال فایل در حالت قفل فایل"
    elif s.get("lock_stickers") and (getattr(message,"sticker",None) or getattr(message,"animation",None)): reason="ارسال استیکر یا گیف در حالت قفل"
    elif s.get("lock_voice") and (getattr(message,"voice",None) or getattr(message,"audio",None)): reason="ارسال پیام صوتی در حالت قفل"
    elif s.get("lock_video_notes") and getattr(message,"video_note",None): reason="ارسال ویدئوی گرد در حالت قفل"
    elif s.get("lock_mentions") and (re.search(r"(?<!\w)@[A-Za-z0-9_]{3,}", text or "") or any(getattr(e, "type", "") in ("mention", "text_mention") for e in (getattr(message, "entities", None) or []))): reason="ارسال تگ یا منشن در حالت قفل"
    elif s.get("lock_hashtags") and (re.search(r"(?<!\w)#[\w\u0600-\u06ff]+", text or "") or any(getattr(e, "type", "") == "hashtag" for e in (getattr(message, "entities", None) or []))): reason="ارسال هشتگ در حالت قفل"
    elif s.get("lock_usernames") and re.search(r"(?<!\w)@[A-Za-z0-9_]{5,}", text or ""): reason="ارسال نام کاربری در حالت قفل"
    elif s.get("anti_link") and has_link(text) and str(user.id) not in [str(x) for x in s.get("whitelist",[])]: reason="ارسال لینک"
    elif s.get("anti_ads") and has_ad(text): reason="ارسال تبلیغ"
    elif s.get("phone_filter") and re.search(r"(?<!\d)(?:\+?\d[\d\s().-]{7,}\d)(?!\d)", text): reason="ارسال شماره تماس در حالت فیلتر شماره"
    elif text and any(w and str(w).casefold() in text.casefold() for w in s.get("bad_words",[])): reason="استفاده از کلمه ممنوع"
    if not reason and text and s.get("anti_repeat") and normalize_security_text(prev.get("normalized", prev.get("text", ""))) == normalize_security_text(text) and normalize_security_text(text) and now-prev.get("time",0)<30: reason="پیام تکراری یا با تغییرات جزئی"
    times=[t for t in prev.get("times",[]) if now-t<8]; times.append(now)
    if not reason and s.get("anti_spam") and len(times)>=7: reason="ارسال پیام‌های پرتعداد"
    DATA["seen"][key]={"text":text,"normalized":normalize_security_text(text),"time":now,"times":[] if reason=="ارسال پیام‌های پرتعداد" else times}
    if reason:
        if safe_delete(message):
            DATA["stats"]["blocked"]+=1
            group_stats=DATA.setdefault("group_stats",{}).setdefault(str(chat.id),{"messages":0,"blocked":0,"joins":0,"leaves":0})
            group_stats["blocked"]=int(group_stats.get("blocked",0))+1
            add_log("blocked",chat.id,user.id,reason); warn_member(chat.id,user.id,reason)
        return True
    save_data(); return False

# Persian aliases and slash commands accepted by the group router.
_GROUP_ALIASES = {
    "help": "help", "راهنما": "help", "دستورات": "help", "کمک": "help", "راهنمای ربات": "help",
    "id": "id", "آیدی": "id", "ایدی": "id", "شناسه": "id",
    "ping": "ping", "پینگ": "ping", "تست": "ping",
    "rules": "rules", "قوانین": "rules", "قانون": "rules",
    "stats": "gstats", "آمار": "gstats", "آمارگروه": "gstats",
    "هوش": "ai", "هوش مصنوعی": "ai",
    "ban": "ban", "بن": "ban", "بن کن": "ban", "بنکن": "ban", "مسدود کن": "ban", "مسدودکن": "ban", "بلاک": "ban", "بلاک کن": "ban", "بلاکن": "ban",
    "unban": "unban", "رفع بن": "unban", "رفع‌بن": "unban", "رفع_بن": "unban", "آزاد کن": "unban", "آزادکن": "unban", "رفع مسدودی": "unban", "رفع‌مسدودی": "unban",
    "mute": "mute", "سیک": "mute", "سکوت": "mute", "سکوت کن": "mute", "سایلنت": "mute", "بی‌صدا": "mute", "بیصدا": "mute",
    "unmute": "unmute", "رفع سکوت": "unmute", "رفع‌سکوت": "unmute", "رفع_سکوت": "unmute", "آزاد سکوت": "unmute", "آزادسکوت": "unmute",
    "kick": "kick", "اخراج": "kick", "اخراج کن": "kick", "اخراج‌کن": "kick", "بنداز بیرون": "kick", "بندازبیرون": "kick",
    "warn": "warn", "اخطار": "warn", "اخطار بده": "warn", "هشدار": "warn",
    "pin": "pin", "سنجاق": "pin", "پین": "pin",
    "unpin": "unpin", "لغوسنجاق": "unpin", "برداشتن‌سنجاق": "unpin",
    "delete": "delete", "حذف": "delete", "پاک‌کن": "delete", "پاککن": "delete",
    "clean": "clean", "پاکسازی": "clean", "پاک سازی": "clean", "پاکسازی پیام": "clean", "پاکسازیپیام": "clean",
    "report": "report", "گزارش": "report", "گزارش‌تخلف": "report",
    "قفل لینک": "set_anti_link_on", "ضدلینک روشن": "set_anti_link_on", "بازکردن لینک": "set_anti_link_off", "ضدلینک خاموش": "set_anti_link_off",
    "قفل تبلیغ": "set_anti_ads_on", "ضدتبلیغ روشن": "set_anti_ads_on", "بازکردن تبلیغ": "set_anti_ads_off", "ضدتبلیغ خاموش": "set_anti_ads_off",
    "ضد اسپم روشن": "set_anti_spam_on", "ضد اسپم خاموش": "set_anti_spam_off", "ضدتکرار روشن": "set_anti_repeat_on", "ضدتکرار خاموش": "set_anti_repeat_off",
    "قفل فوروارد": "set_anti_forward_on", "بازکردن فوروارد": "set_anti_forward_off",
    "قفل رسانه": "set_media_lock_on", "بازکردن رسانه": "set_media_lock_off",
    "خوشامد روشن": "set_welcome_on_on", "خوشامد خاموش": "set_welcome_on_off",
    "خداحافظی روشن": "set_farewell_on_on", "خداحافظی خاموش": "set_farewell_on_off",
    "تأیید ورود روشن": "set_join_approval_on", "تایید ورود روشن": "set_join_approval_on", "تأیید ورود خاموش": "set_join_approval_off", "تایید ورود خاموش": "set_join_approval_off",
    "قفل عکس": "set_lock_photos_on", "بازکردن عکس": "set_lock_photos_off",
    "قفل فیلم": "set_lock_videos_on", "بازکردن فیلم": "set_lock_videos_off",
    "قفل فایل": "set_lock_files_on", "بازکردن فایل": "set_lock_files_off",
    "قفل استیکر": "set_lock_stickers_on", "بازکردن استیکر": "set_lock_stickers_off",
    "قفل ویس": "set_lock_voice_on", "بازکردن ویس": "set_lock_voice_off",
    "قفل ویدئوی گرد": "set_lock_video_notes_on", "بازکردن ویدئوی گرد": "set_lock_video_notes_off",
}

def _normalize_group_command(text):
    value = (text or "").strip().casefold()
    value = value.replace("ي", "ی").replace("ك", "ک")
    value = re.sub(r"[\u200c\s]+", "", value)
    value = value.lstrip("/")
    if "@" in value:
        value = value.split("@", 1)[0]
    return value

_GROUP_ALIASES_NORMALIZED = {_normalize_group_command(key): value for key, value in _GROUP_ALIASES.items()}


def _reply_target(message):
    replied = getattr(message, "reply_to_message", None)
    return getattr(getattr(replied, "from_user", None), "id", None) if replied else None

def _handle_group_shortcut(message, text):
    """Return True when a recognized group shortcut was handled."""
    if not text:
        return False
    words = text.strip().split()
    command = None
    used_words = 0
    # Longest phrase first supports commands such as «مسدود کن» and «رفع سکوت».
    for n in range(min(3, len(words)), 0, -1):
        candidate = " ".join(words[:n])
        command = _GROUP_ALIASES_NORMALIZED.get(_normalize_group_command(candidate))
        if command:
            used_words = n
            break
    if not command:
        return False
    chat_id = message.chat.id
    user = getattr(message, "from_user", None)
    uid = getattr(user, "id", 0)
    args = " ".join(words[used_words:]).strip()
    if command == "ai":
        # AI is intentionally activated by the word «هوش» or a reply to the bot.
        question = args
        if not question and getattr(message, "reply_to_message", None):
            question = get_text(message.reply_to_message).strip()
        if not question:
            bot.reply_to(message, "جانم، بگو ببینم؟")
            return True
        status = bot.reply_to(message, "🧠 دارم بررسی می‌کنم…")
        answer = ask_ai(question)
        try: bot.edit_message_text(esc(answer[:3900]), status.chat.id, status.message_id)
        except Exception: bot.send_message(chat_id, esc(answer[:3900]), reply_to_message_id=message.message_id)
        return True
    if command == "help":
        bot.reply_to(message, "📚 <b>دستورات عمومی:</b> پینگ، آیدی، قوانین، آمار، هوش، راهنما\n<b>مدیریت (با ریپلای روی پیام عضو):</b> بن، رفع بن، سیک/سکوت، رفع سکوت، اخراج، اخطار، سنجاق، لغو سنجاق، حذف، پاکسازی، گزارش\nفرمان‌های مدیریتی فقط برای مدیران گروه فعال‌اند.")
        return True
    if command == "id":
        target = _reply_target(message) or uid
        bot.reply_to(message, f"🆔 شناسهٔ کاربر: <code>{target}</code>\nشناسهٔ گروه: <code>{chat_id}</code>")
        return True
    if command == "ping":
        bot.reply_to(message, "🏓 MASIH GUARD فعاله و پیام رو دریافت کرد.")
        return True
    if command == "rules":
        bot.reply_to(message, "📜 <b>قوانین گروه</b>\n" + esc(get_group_settings(chat_id).get("rules", "قوانینی تنظیم نشده است.")))
        return True
    if command == "gstats":
        gs = DATA.setdefault("group_stats", {}).get(str(chat_id), {})
        active = len(DATA.setdefault("active_members", {}).get(str(chat_id), {}))
        bot.reply_to(message, f"📊 <b>آمار این گروه</b>\nپیام‌ها: {int(gs.get('messages',0))}\nپیام‌های مسدودشده: {int(gs.get('blocked',0))}\nورودها: {int(gs.get('joins',0))}\nخروج‌ها: {int(gs.get('leaves',0))}\nکاربران دیده‌شده: {active}")
        return True
    if command.startswith("set_"):
        setting_action = command[4:]
        enabled = setting_action.endswith("_on")
        setting = setting_action[:-3] if enabled else setting_action[:-4]
        allowed_settings = {"anti_link", "anti_ads", "anti_spam", "anti_repeat", "anti_forward", "media_lock", "welcome_on", "farewell_on", "join_approval", "lock_photos", "lock_videos", "lock_files", "lock_stickers", "lock_voice", "lock_video_notes", "lock_mentions", "lock_hashtags", "lock_usernames", "phone_filter"}
        if setting not in allowed_settings:
            bot.reply_to(message, "⚠️ این تنظیم شناخته نشد.")
            return True
        if not user or not is_group_admin(chat_id, uid):
            bot.reply_to(message, "⛔ فقط مدیران گروه می‌توانند تنظیمات امنیتی را تغییر دهند.")
            return True
        get_group_settings(chat_id)[setting] = enabled
        save_data()
        add_log("group_setting_changed", chat_id, uid, f"{setting}={enabled}")
        bot.reply_to(message, f"✅ {esc(setting)}: {'روشن' if enabled else 'خاموش'}")
        return True
    if command == "report":
        if not getattr(message, "reply_to_message", None):
            bot.reply_to(message, "برای گزارش تخلف، روی پیام موردنظر ریپلای کن و «گزارش» را بفرست.")
            return True
        reported = message.reply_to_message
        add_log("user_report", chat_id, uid, f"reported_message={reported.message_id}; text={get_text(reported)[:180]}")
        try: bot.send_message(OWNER_ID, f"🚨 <b>گزارش تخلف</b>\nگروه: <code>{chat_id}</code>\nگزارش‌دهنده: <code>{uid}</code>\nپیام: <code>{reported.message_id}</code>\n{esc(get_text(reported)[:800])}")
        except Exception as e: print("Report owner notice error:", repr(e))
        bot.reply_to(message, "🚨 گزارش برای مالک ربات ارسال شد.")
        return True
    # Remaining actions change group state and therefore require a group admin.
    if not user or not is_group_admin(chat_id, uid):
        bot.reply_to(message, "⛔ این دستور فقط برای مدیران گروه است.")
        return True
    target = _reply_target(message)
    if command in {"ban", "mute", "unmute", "kick", "warn", "pin", "unpin", "delete"} and not target and command not in {"unban"}:
        if command in {"pin", "unpin", "delete"}:
            if not getattr(message, "reply_to_message", None):
                bot.reply_to(message, "برای این دستور روی پیام موردنظر ریپلای کن.")
                return True
        else:
            bot.reply_to(message, "برای هدف‌گرفتن کاربر، روی یکی از پیام‌های او ریپلای کن.")
            return True
    try:
        if command == "ban":
            bot.ban_chat_member(chat_id, int(target)); bot.reply_to(message, f"⛔ کاربر <code>{target}</code> مسدود شد.")
        elif command == "unban":
            target_id = int(target or args)
            bot.unban_chat_member(chat_id, target_id, only_if_banned=True); bot.reply_to(message, f"✅ مسدودیت <code>{target_id}</code> برداشته شد.")
        elif command == "mute":
            bot.restrict_chat_member(chat_id, int(target), permissions=types.ChatPermissions(can_send_messages=False))
            bot.reply_to(message, f"🔇 کاربر <code>{target}</code> سکوت شد.")
        elif command == "unmute":
            bot.restrict_chat_member(chat_id, int(target), permissions=types.ChatPermissions(can_send_messages=True, can_send_audios=True, can_send_documents=True, can_send_photos=True, can_send_videos=True, can_send_video_notes=True, can_send_voice_notes=True, can_send_polls=True, can_send_other_messages=True, can_add_web_page_previews=True))
            bot.reply_to(message, f"🔊 سکوت کاربر <code>{target}</code> برداشته شد.")
        elif command == "kick":
            bot.ban_chat_member(chat_id, int(target)); bot.unban_chat_member(chat_id, int(target), only_if_banned=True); bot.reply_to(message, f"👢 کاربر <code>{target}</code> از گروه اخراج شد.")
        elif command == "warn":
            warn_member(chat_id, int(target), args or "اخطار مدیر")
        elif command == "pin":
            bot.pin_chat_message(chat_id, message.reply_to_message.message_id); bot.reply_to(message, "📌 پیام سنجاق شد.")
        elif command == "unpin":
            if message.reply_to_message: bot.unpin_chat_message(chat_id, message.reply_to_message.message_id)
            else: bot.unpin_all_chat_messages(chat_id)
            bot.reply_to(message, "📌 سنجاق برداشته شد.")
        elif command == "delete":
            bot.delete_message(chat_id, message.reply_to_message.message_id); bot.reply_to(message, "🧹 پیام حذف شد.")
        elif command == "clean":
            amount = int(args) if args else 10
            if not 1 <= amount <= 100:
                bot.reply_to(message, "تعداد باید بین ۱ تا ۱۰۰ باشد."); return True
            rows = DATA.setdefault("message_history", {}).get(str(chat_id), [])[-amount:]
            deleted = 0
            for row in reversed(rows):
                try: bot.delete_message(chat_id, int(row["message_id"])); deleted += 1
                except Exception: pass
            bot.reply_to(message, f"🧹 {deleted} پیام حذف شد.")
        add_log("group_command", chat_id, uid, command)
        save_data()
    except (ValueError, TypeError):
        bot.reply_to(message, "⚠️ شناسه یا تعداد واردشده معتبر نیست.")
    except Exception as e:
        print("Group command error:", repr(e))
        bot.reply_to(message, "⚠️ انجام دستور ناموفق بود؛ دسترسی ادمین ربات و مجوزهای گروه را بررسی کن.")
    return True

def handle_ai_group_management(message, text=None):
    """Execute a small, explicit set of safe group-setting requests from AI replies."""
    normalized = (text or "").casefold().replace("ي", "ی").replace("ك", "ک")
    normalized = re.sub(r"[\u200c\s]+", "", normalized)
    patterns = [
        (("قفللینک", "ضدلینک"), "anti_link"),
        (("قفلتبلیغ", "ضدتبلیغ"), "anti_ads"),
        (("ضداسپم", "قفلاسپم"), "anti_spam"),
        (("ضدتکرار", "قفلپیامتکراری"), "anti_repeat"),
        (("قفلرسانه", "قفرسانه"), "media_lock"),
        (("خوشامدگویی", "خوشامد"), "welcome_on"),
        (("خداحافظی",), "farewell_on"),
    ]
    target_setting = None
    for phrases, setting in patterns:
        if any(phrase in normalized for phrase in phrases):
            target_setting = setting
            break
    if not target_setting:
        return False
    off_words = ("خاموش", "غیرفعال", "بازکن", "بردار", "غیرفعالشکن", "خاموششکن")
    on_words = ("روشن", "فعال", "ببند", "قفلکن", "فعال‌شکن")
    is_off = any(word in normalized for word in off_words)
    is_on = any(word in normalized for word in on_words)
    if not is_off and not is_on:
        bot.reply_to(message, "می‌خوای این تنظیم روشن بشه یا خاموش؟ لطفاً «روشن کن» یا «خاموش کن» رو مشخص کن.")
        return True
    user_id = getattr(getattr(message, "from_user", None), "id", 0)
    chat_id = message.chat.id
    if not is_group_admin(chat_id, user_id):
        bot.reply_to(message, "⛔ برای تغییر تنظیمات امنیتی باید مدیر همین گروه باشی.")
        return True
    enabled = bool(is_on and not is_off)
    if enabled and target_setting in {"anti_link", "anti_ads", "anti_spam", "anti_repeat", "media_lock"}:
        try:
            me = bot.get_me()
            member = bot.get_chat_member(chat_id, me.id)
            member_status = getattr(member, "status", "")
            if member_status not in ("administrator", "creator") or (member_status != "creator" and not getattr(member, "can_delete_messages", False)):
                bot.reply_to(message, "⚠️ برای فعال‌کردن این فیلتر، ربات باید مدیر گروه با مجوز حذف پیام باشد.")
                return True
        except Exception:
            bot.reply_to(message, "⚠️ نتونستم مجوزهای ربات رو بررسی کنم؛ فعلاً تنظیم رو تغییر ندادم.")
            return True
    get_group_settings(chat_id)[target_setting] = enabled
    save_data()
    add_log("ai_group_setting_changed", chat_id, user_id, f"{target_setting}={enabled}")
    label = {
        "anti_link": "ضدلینک", "anti_ads": "ضدتبلیغ", "anti_spam": "ضداسپم",
        "anti_repeat": "ضدتکرار", "media_lock": "قفل رسانه",
        "welcome_on": "خوشامدگویی", "farewell_on": "خداحافظی"
    }.get(target_setting, target_setting)
    bot.reply_to(message, f"✅ {label} {'روشن' if enabled else 'خاموش'} شد.")
    return True


def group_message_handler(message):
    try:
        text = get_text(message)
        normalized_text = (text or "").strip().casefold().replace("ي", "ی").replace("ك", "ک")
        first_token = normalized_text.split(maxsplit=1)[0] if normalized_text else ""
        if first_token.split("@", 1)[0] == "/start":
            bot.reply_to(message, group_start_guide(getattr(message.chat, "title", "گروه")))
            return
        if normalized_text == "پنل":
            uid = getattr(getattr(message, "from_user", None), "id", 0)
            if is_owner(uid):
                try:
                    bot.send_message(uid, "🔐 پنل خصوصی باز شد؛ تعاملات پنل در گروه ارسال نمی‌شوند.")
                    send_panel(uid, user_id=uid)
                except Exception:
                    bot.reply_to(message, "برای بازکردن پنل، ابتدا گفت‌وگوی خصوصی ربات را باز کن و /start را بزن.")
            else:
                bot.reply_to(message, "⛔ فقط مالک ربات می‌تواند پنل مدیریت را باز کند.")
            return
        # Owner activates the current group directly; no group ID needs to be copied.
        normalized_activation = normalized_text.translate(str.maketrans("۰۱۲۳۴۵۶۷۸۹٠١٢٣٤٥٦٧٨٩", "01234567890123456789"))
        activation_match = re.fullmatch(r"فعال(?:\s|\u200c)*سازی\s+(\d+)\s*(?:روز(?:ه)?|روزِ)?", normalized_activation)
        if activation_match:
            uid = getattr(getattr(message, "from_user", None), "id", 0)
            if not is_owner(uid):
                bot.reply_to(message, "⛔ فقط مالک ربات می‌تواند اشتراک گروه را فعال کند.")
                return
            days = int(activation_match.group(1))
            if not 0 <= days <= 3650:
                bot.reply_to(message, "⚠️ تعداد روز باید بین ۰ تا ۳۶۵۰ باشد؛ عدد ۰ یعنی دائمی.")
                return
            try:
                me = bot.get_me()
                member = bot.get_chat_member(message.chat.id, me.id)
                if getattr(member, "status", "") not in ("administrator", "creator"):
                    bot.reply_to(message, "⚠️ برای فعال‌سازی، ابتدا ربات را مدیر همین گروه کن.")
                    return
            except Exception as check_error:
                print("Group activation permission check error:", repr(check_error))
                bot.reply_to(message, "⚠️ نتونستم حضور و مجوز ربات رو بررسی کنم؛ تنظیمات مدیر ربات رو بررسی کن.")
                return
            from datetime import timedelta
            now = datetime.now()
            expires = "" if days == 0 else (now + timedelta(days=days)).strftime("%Y-%m-%d %H:%M:%S")
            DATA.setdefault("group_licenses", {})[str(message.chat.id)] = {
                "approved": True, "expires": expires, "activated_by": uid, "updated": now_text()
            }
            DATA.setdefault("group_requests", {}).pop(str(message.chat.id), None)
            add_log("group_license_activated_in_group", message.chat.id, uid, f"days={days}")
            save_data()
            bot.reply_to(message, "🛡️ <b>فعال‌سازی MASIH GUARD موفق بود</b>\n"
                         f"✅ اشتراک این گروه فعال شد.\n⭐ مدت: {'دائمی' if days == 0 else str(days) + ' روز'}\n"
                         f"📅 پایان اعتبار: {esc(expires or 'دائمی')}\n"
                         "🌈 تنظیمات این گروه از این پس جداگانه ذخیره می‌شوند.")
            return
        if not is_group_licensed(message.chat.id):
            # Keep the bot inert in unlicensed groups and notify once per group.
            req = DATA.setdefault("group_requests", {})
            key = str(message.chat.id)
            last = req.get(key, 0)
            if time.time() - float(last or 0) > 86400:
                req[key] = time.time(); save_data()
                try: bot.send_message(message.chat.id, group_install_message(message.chat.id, getattr(message.chat,"title", "این گروه")), reply_markup=support_contact_markup())
                except Exception: pass
            return
        # AI in groups is activated only by replying to a message sent by this bot.
        global BOT_USERNAME, BOT_ID
        try:
            if not BOT_ID or not BOT_USERNAME:
                me = bot.get_me()
                BOT_ID = getattr(me, "id", 0) or BOT_ID
                BOT_USERNAME = (getattr(me, "username", "") or "").casefold() or BOT_USERNAME
        except Exception:
            pass
        bot_id = BOT_ID or None
        replied = getattr(message, "reply_to_message", None)
        reply_to_bot = bool(replied and getattr(getattr(replied, "from_user", None), "is_bot", False)
                            and (getattr(getattr(replied, "from_user", None), "id", None) == bot_id
                                 or (BOT_USERNAME and (getattr(getattr(replied, "from_user", None), "username", "") or "").casefold() == BOT_USERNAME)))
        if reply_to_bot and text and text.strip() and not text.strip().startswith("/"):
            if handle_ai_group_management(message, text.strip()):
                return
            status = bot.reply_to(message, "🧠 دارم بررسی می‌کنم…")
            answer = ask_ai(text.strip())
            try: bot.edit_message_text(esc(answer[:3900]), status.chat.id, status.message_id)
            except Exception: bot.send_message(message.chat.id, esc(answer[:3900]), reply_to_message_id=message.message_id)
            return
        # Track group activity and bounded message history for selected statistics/cleanup features.
        track_group_activity(message.chat.id, getattr(message.from_user,"id",0), message.message_id)
        if text and _handle_group_shortcut(message, text):
            save_data()
            return
        # Group management shortcuts work only for admins and licensed groups.
        if text and text.split()[0].split("@",1)[0] in {"/pin","/unpin","/clean","/cleanuser","/gstats","/report"}:
            cmd=text.split()[0].split("@",1)[0]
            if not is_group_admin(message.chat.id, message.from_user.id):
                bot.reply_to(message,"⛔ این فرمان فقط برای مدیران گروه است."); return
            if cmd=="/gstats":
                gs=DATA.setdefault("group_stats",{}).get(str(message.chat.id),{})
                active=len(DATA.setdefault("active_members",{}).get(str(message.chat.id),{}))
                bot.reply_to(message, f"📊 <b>آمار این گروه</b>\nپیام‌های ثبت‌شده: {int(gs.get('messages',0))}\nپیام‌های مسدودشده: {int(gs.get('blocked',0))}\nورودها: {int(gs.get('joins',0))}\nخروج‌ها: {int(gs.get('leaves',0))}\nکاربران دیده‌شده: {active}")
                return
            if cmd=="/report":
                if not message.reply_to_message:
                    bot.reply_to(message,"برای گزارش تخلف، به پیام موردنظر پاسخ بده و /report را بفرست."); return
                reported=message.reply_to_message
                detail=f"گزارش توسط {message.from_user.id}; پیام {reported.message_id}; متن={get_text(reported)[:180]}"
                add_log("user_report",message.chat.id,message.from_user.id,detail)
                try: bot.send_message(OWNER_ID,"🚨 <b>گزارش تخلف از گروه</b>\nگروه: <code>"+str(message.chat.id)+"</code>\nگزارش‌دهنده: <code>"+str(message.from_user.id)+"</code>\nپیام: <code>"+str(reported.message_id)+"</code>\n"+esc(get_text(reported)[:800]))
                except Exception as report_error: print("Report owner notice error:",repr(report_error))
                bot.reply_to(message,"🚨 گزارش برای مالک ربات ارسال شد."); return
            if cmd=="/pin":
                if not message.reply_to_message: bot.reply_to(message,"برای سنجاق، به پیام موردنظر پاسخ بده و /pin را بفرست."); return
                bot.pin_chat_message(message.chat.id,message.reply_to_message.message_id)
                add_log("message_pinned",message.chat.id,message.from_user.id,str(message.reply_to_message.message_id))
                bot.reply_to(message,"📌 پیام سنجاق شد."); return
            if cmd=="/unpin":
                if message.reply_to_message: bot.unpin_chat_message(message.chat.id,message.reply_to_message.message_id)
                else: bot.unpin_all_chat_messages(message.chat.id)
                add_log("message_unpinned",message.chat.id,message.from_user.id,"برداشتن سنجاق")
                bot.reply_to(message,"📌 سنجاق پیام برداشته شد."); return
            if cmd=="/clean":
                try: amount=int(text.split(maxsplit=1)[1])
                except Exception: amount=10
                if not 1<=amount<=100: bot.reply_to(message,"تعداد باید بین ۱ تا ۱۰۰ باشد."); return
                ids=[x["message_id"] for x in DATA["message_history"][str(message.chat.id)][-amount:]]
                deleted=0
                for mid in reversed(ids):
                    try: bot.delete_message(message.chat.id,mid); deleted+=1
                    except Exception: pass
                bot.reply_to(message,f"🧹 {deleted} پیام حذف شد."); add_log("messages_cleaned",message.chat.id,message.from_user.id,str(deleted)); return
            if cmd=="/cleanuser":
                parts=text.split()
                if len(parts)<2: bot.reply_to(message,"قالب: /cleanuser شناسه_کاربر [تعداد]"); return
                try: target_user=int(parts[1]); amount=int(parts[2]) if len(parts)>2 else 20
                except ValueError: bot.reply_to(message,"شناسه و تعداد باید عدد باشند."); return
                if not 1<=amount<=100: bot.reply_to(message,"تعداد باید بین ۱ تا ۱۰۰ باشد."); return
                rows=[x for x in DATA["message_history"][str(message.chat.id)] if int(x.get("user_id",0))==target_user][-amount:]
                deleted=0
                for row in reversed(rows):
                    try: bot.delete_message(message.chat.id,int(row["message_id"])); deleted+=1
                    except Exception: pass
                bot.reply_to(message,f"🧹 {deleted} پیام قابل‌حذف از عضو موردنظر پاک شد."); add_log("member_messages_cleaned",message.chat.id,message.from_user.id,f"target={target_user}, deleted={deleted}"); return
        DATA["stats"]["messages"]+=1
        if process_group_security(message): return
        if text:
            settings=get_group_settings(message.chat.id)
            handled=False
            for keyword,reply in settings.get("auto_replies",{}).items():
                if keyword and keyword.casefold() in text.casefold():
                    bot.reply_to(message,str(reply)[:4000]); handled=True; break
            if not handled and text.startswith("!"):
                command=text[1:].split(maxsplit=1)[0].casefold()
                response=settings.get("custom_commands",{}).get(command)
                if response: bot.reply_to(message,str(response)[:4000])
        save_data()
    except Exception as e: print("Group handler error:",repr(e))

def welcome_card(chat_id, member):
    try:
        count = bot.get_chat_member_count(chat_id)
    except Exception: count = "نامشخص"
    stamp = datetime.now()
    raw_name = member.first_name or "دوست عزیز"
    name = f'<a href="tg://user?id={int(member.id)}">{esc(raw_name)}</a>'
    uname = ("@" + esc(member.username)) if getattr(member,"username",None) else "ندارد"
    return ("⚡ <b>MASIH GUARD</b> ⚡\n"
            "━━━━━━━━━━━━━━━━━━\n"
            "🚀 <b>عضو جدید وارد شد!</b>\n\n"
            f"👤 <b>نام کاربر:</b> {name}\n"
            f"🆔 <b>آیدی:</b> <code>{member.id}</code>\n"
            f"🔖 <b>شناسه:</b> {uname}\n"
            f"📅 <b>تاریخ ورود:</b> {stamp.strftime('%Y-%m-%d')}\n"
            f"🕒 <b>ساعت ورود:</b> {stamp.strftime('%H:%M:%S')}\n"
            f"👥 <b>تعداد اعضا:</b> {count}\n\n"
            "🛡️ <b>امنیت گروه فعال است</b>\n"
            "━━━━━━━━━━━━━━━━━━\n"
            "<i>ساخته‌شده با MASIH GUARD S1000+</i>")


@bot.my_chat_member_handler()
def bot_added_or_removed(update):
    """Unapproved group additions are notified and the bot leaves instead of running for free."""
    try:
        chat = update.chat
        if not chat or chat.type not in ("group", "supergroup"):
            return
        new_status = getattr(getattr(update, "new_chat_member", None), "status", "")
        old_status = getattr(getattr(update, "old_chat_member", None), "status", "")
        if new_status in ("member", "administrator") and old_status in ("left", "kicked") and not is_group_licensed(chat.id):
            DATA.setdefault("group_requests", {})[str(chat.id)] = {"title":getattr(chat,"title", ""),"requested":now_text(),"status":"pending"}; save_data()
            try:
                bot.send_message(OWNER_ID, "📨 <b>درخواست نصب گروه</b>\nنام: " + esc(getattr(chat,"title", "بدون نام")) + f"\nشناسه: <code>{chat.id}</code>\nبرای فعال‌سازی از پنل بخش «مجوز نصب گروه‌ها» استفاده کن.")
            except Exception as owner_error:
                print("Owner group request notice error:", repr(owner_error))
            try:
                bot.send_message(chat.id, group_install_message(chat.id, getattr(chat,"title", "این گروه")), reply_markup=support_contact_markup())
            except Exception as group_notice_error:
                print("Unlicensed group notice error:", repr(group_notice_error))
            # Stay in the group but remain inert until the owner approves its license.
            # This allows the group to receive the one activation confirmation later.
    except Exception as e:
        print("Group license handler error:", repr(e))

@bot.message_handler(content_types=["new_chat_members"], func=lambda m: m.chat.type in ("group","supergroup"))
def welcome_new_members(message):
    if not is_group_licensed(message.chat.id): return
    s=get_group_settings(message.chat.id)
    for member in message.new_chat_members:
        DATA["stats"]["joins"]+=1
        gs=DATA.setdefault("group_stats",{}).setdefault(str(message.chat.id),{"messages":0,"blocked":0,"joins":0,"leaves":0})
        gs["joins"]=int(gs.get("joins",0))+1
        DATA.setdefault("active_members",{}).setdefault(str(message.chat.id),{})[str(member.id)]=time.time()
        add_log("new_member",message.chat.id,member.id,"ورود به گروه")
        if s.get("welcome_on"):
            try:
                # Use the approved cyber-style card while preserving a custom welcome message if configured.
                custom=s.get("welcome_text","سلام {name}، به گروه خوش آمدی!")
                if custom and custom != DEFAULT_GROUP["welcome_text"]:
                    text=esc(custom).replace("{name}",f'<a href="tg://user?id={int(member.id)}">{esc(member.first_name or "دوست عزیز")}</a>')
                    kb=types.InlineKeyboardMarkup(); kb.add(types.InlineKeyboardButton("📜 مشاهده قوانین گروه", callback_data=f"group_rules:{message.chat.id}"))
                    final_text=welcome_card(message.chat.id,member)+"\n\n"+text
                    image_url=s.get("welcome_image","")
                    if image_url:
                        sent=bot.send_photo(message.chat.id,image_url,caption=welcome_card(message.chat.id,member)[:1000],reply_markup=kb)
                        bot.send_message(message.chat.id,text[:3500])
                    else:
                        sent=bot.send_message(message.chat.id,final_text,reply_markup=kb)
                else:
                    kb=types.InlineKeyboardMarkup()
                    kb.add(types.InlineKeyboardButton("📜 مشاهده قوانین گروه", callback_data=f"group_rules:{message.chat.id}"))
                    image_url=s.get("welcome_image","")
                    sent=bot.send_photo(message.chat.id,image_url,caption=welcome_card(message.chat.id,member)[:1024],reply_markup=kb) if image_url else bot.send_message(message.chat.id,welcome_card(message.chat.id,member),reply_markup=kb)
                delete_after=int(s.get("welcome_delete_seconds",0) or 0)
                if delete_after>0:
                    def _delete_welcome(cid=message.chat.id, mid=sent.message_id):
                        try: bot.delete_message(cid,mid)
                        except Exception as delete_error: print("Welcome auto-delete error:",repr(delete_error))
                    timer=threading.Timer(delete_after,_delete_welcome); timer.daemon=True; timer.start()
            except Exception as e: print("Welcome error:",repr(e))
    save_data()

@bot.message_handler(content_types=["left_chat_member"], func=lambda m: m.chat.type in ("group","supergroup"))
def farewell_member(message):
    if not is_group_licensed(message.chat.id): return
    s=get_group_settings(message.chat.id); member=message.left_chat_member
    if member and s.get("farewell_on"):
        try:
            custom = s.get("farewell_text", DEFAULT_GROUP["farewell_text"])
            body = esc(custom).replace("{name}", f'<a href="tg://user?id={int(member.id)}">{esc(member.first_name or "دوست ما")}</a>')
            bot.send_message(message.chat.id, "🌙 <b>MASIH GUARD S1000+</b>\n━━━━━━━━━━━━━━\n👋 " + body)
        except Exception as e: print("Farewell error:",repr(e))
    if member:
        gs=DATA.setdefault("group_stats",{}).setdefault(str(message.chat.id),{"messages":0,"blocked":0,"joins":0,"leaves":0})
        gs["leaves"]=int(gs.get("leaves",0))+1
        DATA.setdefault("active_members",{}).setdefault(str(message.chat.id),{}).pop(str(member.id),None)
        add_log("member_left",message.chat.id,member.id,"خروج از گروه")
        save_data()

@bot.chat_join_request_handler()
def handle_join_request(request):
    try:
        if not is_group_licensed(request.chat.id): return
        if get_group_settings(request.chat.id).get("join_approval"):
            bot.approve_chat_join_request(request.chat.id,request.from_user.id)
            DATA["stats"]["joins"]+=1; add_log("join_request_approved",request.chat.id,request.from_user.id,"تأیید خودکار ورود"); save_data()
    except Exception as e: print("Join request approval error:",repr(e))

def ask_ai(question):
    if not AI_API_KEY: return "⚠️ کلید هوش مصنوعی تنظیم نشده است. متغیر AI_API_KEY را در هاست وارد کن."
    system_prompt = (
        "تو دستیار هوش مصنوعی کاملاً فارسیِ MASIH GUARD هستی. همیشه فقط به زبان فارسی پاسخ بده؛ "
        "همهٔ توضیح‌ها، راهنماها، عنوان‌ها و پیام‌های خطا باید فارسی و روان باشند. "
        "حتی اگر کاربر انگلیسی نوشت، پاسخ را فارسی بده مگر اینکه صریحاً ترجمهٔ متن بخواهد؛ "
        "در آن حالت فقط متن ترجمه‌شده می‌تواند زبان دیگری داشته باشد. "
        "اگر دربارهٔ قابلیت یا تنظیمی مطمئن نیستی، ادعای انجام‌شدن نکن و شفاف بگو. "
        "برای اقدامات مدیریتی فقط راهنمایی کن و ادعا نکن کاری را در تلگرام انجام داده‌ای "
        "مگر اینکه ابزار واقعاً آن را تأیید کرده باشد. پاسخ‌ها دوستانه، دقیق و ایمن باشند."
    )
    payload={"model":AI_MODEL,"messages":[{"role":"system","content":system_prompt},{"role":"user","content":str(question)[:5000]}],"temperature":0.5,"max_tokens":1200}
    req=urllib.request.Request(AI_BASE_URL+"/chat/completions",data=json.dumps(payload,ensure_ascii=False).encode("utf-8"),
       headers={"Authorization":"Bearer "+AI_API_KEY,"Content-Type":"application/json","Accept":"application/json"},method="POST")
    try:
        with urllib.request.urlopen(req,timeout=40) as response: result=json.loads(response.read().decode("utf-8"))
        answer=result["choices"][0]["message"]["content"]
        return answer.strip() if isinstance(answer,str) and answer.strip() else "⚠️ پاسخ خالی از سرویس دریافت شد."
    except urllib.error.HTTPError as e:
        print("AI HTTP error:",e.code)
        if e.code==401: return "❌ کلید هوش مصنوعی معتبر نیست."
        if e.code==429: return "⏳ محدودیت درخواست یا اعتبار سرویس را بررسی کن."
        return f"❌ سرویس هوش مصنوعی خطای HTTP {e.code} داد."
    except Exception as e: print("AI request error:",repr(e)); return "❌ ارتباط با هوش مصنوعی برقرار نشد."

def stats_text():
    s=DATA["stats"]
    return (f"📊 <b>آمار {BRAND}</b>\n━━━━━━━━━━━━━━━━━━\n💬 پیام‌ها: {s['messages']}\n"
            f"🚫 حذف‌شده‌ها: {s['blocked']}\n⚠️ اخطارها: {s['warns']}\n👥 ورود اعضا: {s['joins']}\n"
            f"🎫 تیکت‌ها: {s['tickets']}\n💼 مشتریان: {len(DATA['customers'])}")

def create_ticket(uid, username, text):
    tid=str(int(time.time()*1000))
    DATA["tickets"][tid]={"user_id":int(uid),"username":username or "","text":text[:3500],"status":"open","created":now_text()}
    DATA["stats"]["tickets"]+=1; save_data()
    try: bot.send_message(OWNER_ID,f"🎫 <b>تیکت جدید</b>\nشناسه: <code>{tid}</code>\nکاربر: <code>{uid}</code>\n\n{esc(text[:3500])}")
    except Exception as e: print("Ticket forwarding error:",repr(e))
    return tid

def proxy_endpoint(proxy_url):
    """Extract the server and port from Telegram proxy links without exposing secrets."""
    try:
        parsed = urlparse(str(proxy_url).strip())
        query = parse_qs(parsed.query)
        host = (query.get("server") or [""])[0].strip()
        port = int((query.get("port") or ["0"])[0])
        if not host or not (1 <= port <= 65535):
            return None
        return host, port
    except (TypeError, ValueError):
        return None

def proxy_ping_ms(proxy_url, timeout=1.5):
    """Measure TCP reachability/latency to a Telegram proxy endpoint (not a full Telegram handshake)."""
    endpoint = proxy_endpoint(proxy_url)
    if not endpoint:
        return None
    start = time.perf_counter()
    try:
        with socket.create_connection(endpoint, timeout=timeout):
            return round((time.perf_counter() - start) * 1000)
    except OSError:
        return None

def proxy_list_text(limit=20, with_ping=False):
    items = DATA.get("proxies", [])[:limit]
    if not items:
        return "🌐 هنوز پروکسی‌ای توسط مالک ذخیره نشده است."
    rows = []
    for i, item in enumerate(items, 1):
        if with_ping:
            ping = proxy_ping_ms(item)
            status = f"🟢 {ping} ms" if ping is not None else "🔴 در دسترس نیست/قالب نامعتبر"
            rows.append(f"{i}. {status}\n<code>{esc(item)}</code>")
        else:
            rows.append(f"{i}. <code>{esc(item)}</code>")
    return "🌐 <b>فهرست پروکسی‌ها</b>\n━━━━━━━━━━━━━━\n" + "\n\n".join(rows)

def send_backup(chat_id):
    if not is_owner(chat_id): bot.send_message(chat_id,"⛔ نسخه پشتیبان فقط برای مالک است."); return
    f=io.BytesIO(json.dumps(DATA,ensure_ascii=False,indent=2).encode("utf-8")); f.name="masih_guard_backup.json"
    bot.send_document(chat_id,f,caption="💾 نسخه پشتیبان MASIH GUARD")

def moderate_member(action,chat_id,user_id):
    group_key=str(chat_id); member_key=str(user_id)
    listing=DATA.setdefault("moderation_lists",{}).setdefault(group_key,{"banned":[],"muted":[]})
    if action=="warn": warn_member(chat_id,user_id,"اخطار مدیر"); return "⚠️ اخطار ثبت شد."
    if action=="ban":
        bot.ban_chat_member(chat_id,user_id)
        if member_key not in listing["banned"]: listing["banned"].append(member_key)
        add_log("manual_ban",chat_id,user_id,"مسدودسازی مدیر"); save_data(); return "⛔ عضو مسدود شد."
    if action=="unban":
        bot.unban_chat_member(chat_id,user_id,only_if_banned=True)
        listing["banned"]=[x for x in listing["banned"] if x!=member_key]; save_data(); return "✅ مسدودی برداشته شد."
    if action=="kick":
        bot.ban_chat_member(chat_id,user_id); bot.unban_chat_member(chat_id,user_id,only_if_banned=True)
        add_log("manual_kick",chat_id,user_id,"اخراج مدیر"); save_data(); return "👢 عضو اخراج شد."
    if action in ("mute","unmute"):
        allowed=action=="unmute"
        perms=types.ChatPermissions(can_send_messages=allowed,can_send_audios=allowed,can_send_documents=allowed,
            can_send_photos=allowed,can_send_videos=allowed,can_send_video_notes=allowed,can_send_voice_notes=allowed,
            can_send_polls=allowed,can_send_other_messages=allowed,can_add_web_page_previews=allowed)
        bot.restrict_chat_member(chat_id,user_id,permissions=perms)
        if allowed: listing["muted"]=[x for x in listing["muted"] if x!=member_key]
        elif member_key not in listing["muted"]: listing["muted"].append(member_key)
        save_data()
        return "🔊 محدودیت برداشته شد." if allowed else "🔇 عضو محدود شد."
    raise ValueError("عملیات ناشناخته است.")

LOG_ACTION_LABELS = {
    "referral": "ثبت زیرمجموعه", "subscription_bought": "خرید اشتراک",
    "group_license_activated": "فعال‌سازی مجوز گروه", "group_license_extended": "تمدید مجوز گروه",
    "group_license_revoked": "لغو مجوز گروه", "warning": "ثبت اخطار", "blocked": "مسدودسازی پیام",
    "new_member": "ورود عضو", "member_left": "خروج عضو", "proxy_added": "افزودن پروکسی",
    "proxy_deleted": "حذف پروکسی", "announcement": "ارسال اطلاعیه", "manual_ban": "مسدودسازی عضو",
    "manual_kick": "اخراج عضو", "messages_cleaned": "پاک‌سازی پیام‌ها", "member_messages_cleaned": "پاک‌سازی پیام‌های عضو",
    "message_pinned": "سنجاق پیام", "message_unpinned": "برداشتن سنجاق", "user_report": "گزارش تخلف",
    "join_request_approved": "تأیید درخواست عضویت", "quiet_hours_set": "تنظیم ساعت سکوت",
    "bot_setting_updated": "به‌روزرسانی تنظیمات ربات", "setting_toggled": "تغییر تنظیم گروه",
}
def log_action_label(value):
    value = str(value or "")
    return LOG_ACTION_LABELS.get(value, value.replace("_", " "))

def _parse_log_time(value):
    try: return datetime.strptime(str(value), "%Y-%m-%d %H:%M:%S").timestamp()
    except (ValueError, TypeError): return 0

def handle_show(uid, action):
    if action=="stats": bot.send_message(uid,stats_text())
    elif action=="weekly_report":
        cutoff=time.time()-7*86400
        recent=[x for x in DATA.get("logs",[]) if _parse_log_time(x.get("time", "")) >= cutoff]
        joins=sum(1 for x in recent if x.get("action")=="new_member")
        leaves=sum(1 for x in recent if x.get("action")=="member_left")
        warns=sum(1 for x in recent if x.get("action")=="warning")
        blocked=sum(1 for x in recent if x.get("action")=="blocked")
        bot.send_message(uid,f"📅 <b>گزارش هفتگی</b>\n━━━━━━━━━━━━━━\nرویدادهای ثبت‌شده: {len(recent)}\nورود اعضا: {joins}\nخروج اعضا: {leaves}\nاخطارها: {warns}\nپیام‌های مسدودشده: {blocked}")
    elif action=="security_status":
        bot.send_message(uid, "🛡 <b>وضعیت امنیت</b>\nامنیت هوشمند سراسری: " + ("روشن" if DATA.get("settings",{}).get("smart_security",True) else "خاموش") + f"\nگروه‌های دارای مجوز: {sum(1 for gid in DATA.get('group_licenses',{}) if is_group_licensed(gid))}\nگزارش‌های ذخیره‌شده: {len(DATA.get('logs',[]))}")
    elif action=="subscription_sales":
        rows=[x for x in DATA.get("logs",[]) if x.get("action") in {"subscription_bought","group_license_activated","group_license_extended","group_license_revoked"}][-30:]
        text="\n".join(f"{esc(x.get('time'))} — {esc(log_action_label(x.get('action')))} — {esc(x.get('chat_id'))} — {esc(x.get('detail'))}" for x in reversed(rows))
        bot.send_message(uid,"💳 <b>فروش و تمدید اشتراک / مجوز</b>\n"+(text or "هنوز تراکنش یا تمدیدی ثبت نشده است."))
    elif action=="status": bot.send_message(uid,f"🚀 <b>{BRAND} {VERSION}</b>\nربات در حال اجراست.\nهوش مصنوعی: {'تنظیم شده' if AI_API_KEY else 'تنظیم نشده'}")
    elif action=="rules":
        p=WAITING.get(uid,{}); bot.send_message(uid,esc(get_group_settings(p.get("chat_id",uid))["rules"]))
    elif action=="proxies":
        bot.send_message(uid,proxy_list_text(limit=20, with_ping=True))
    elif action=="group_licenses":
        rows=[]
        for gid,rec in list(DATA.setdefault("group_licenses",{}).items())[-50:]:
            active,_=group_license_status(gid)
            rows.append(f"{'🟢' if active else '🔴'} <code>{esc(gid)}</code> — {esc(rec.get('expires') or 'دائمی')}")
        bot.send_message(uid,"🛡️ <b>مجوزهای گروه</b>\n"+("\n".join(rows) if rows else "هنوز گروهی فعال نشده است."))
    elif action=="group_requests":
        req=DATA.setdefault("group_requests",{})
        rows=[f"• <code>{esc(gid)}</code>" for gid in req]
        bot.send_message(uid,"📨 <b>گروه‌هایی که درخواست نصب داشته‌اند</b>\n"+("\n".join(rows[-50:]) if rows else "درخواستی ثبت نشده است."))
    elif action in {"ban_list","mute_list","whitelist"}:
        target=WAITING.get(uid,{}).get("chat_id")
        kind="banned" if action=="ban_list" else "muted"
        values=DATA.setdefault("moderation_lists",{}).get(str(target),{}).get(kind,[])
        bot.send_message(uid,("📋 <b>فهرست اعضا</b>\n"+"\n".join(f"• <code>{esc(x)}</code>" for x in values)) if values else "فهرست ثبت‌شده توسط ربات خالی است.")
    elif action=="customers":
        rows=[f"• {esc(v.get('name'))} — <code>{esc(k)}</code>" for k,v in list(DATA["customers"].items())[:50]]
        bot.send_message(uid,"💼 <b>مشتریان</b>\n"+"\n".join(rows) if rows else "مشتری ثبت نشده است.")
    elif action=="logs":
        rows=[f"{esc(x.get('time'))} — {esc(log_action_label(x.get('action')))} — {esc(x.get('detail'))}" for x in DATA["logs"][-20:]]
        bot.send_message(uid,"🧾 <b>آخرین گزارش‌ها</b>\n"+"\n".join(rows) if rows else "گزارشی ثبت نشده است.")
    elif action=="backup": send_backup(uid)
    elif action=="daily":
        day=today(); recent=[x for x in DATA.get("logs",[]) if str(x.get("time","" )).startswith(day)]
        joins=sum(1 for x in recent if x.get("action")=="new_member")
        leaves=sum(1 for x in recent if x.get("action")=="member_left")
        warns=sum(1 for x in recent if x.get("action")=="warning")
        blocked=sum(1 for x in recent if x.get("action")=="blocked")
        bot.send_message(uid,f"📅 <b>گزارش روزانه — {day}</b>\n━━━━━━━━━━━━━━\nورودها: {joins}\nخروج‌ها: {leaves}\nاخطارها: {warns}\nپیام‌های مسدودشده: {blocked}\nکل پیام‌های ثبت‌شده: {DATA['stats'].get('messages',0)}")
    elif action=="points": bot.send_message(uid,f"🏆 امتیاز شما: {DATA['points'].get(str(uid),0)}")
    elif action=="tickets":
        rows=[(k,v) for k,v in DATA["tickets"].items() if v.get("user_id")==uid or is_owner(uid)]
        bot.send_message(uid,"\n\n".join(f"🎫 <code>{esc(k)}</code> — {'باز' if v.get('status') == 'open' else 'بسته'}\n{esc(v.get('text','')[:200])}" for k,v in rows[-15:]) if rows else "تیکتی ثبت نشده است.")
    elif action in {"diamond_stats", "wallet_stats"}:
        total = sum(max(0, int(u.get("wallet_toman", 0))) for u in DATA.get("users", {}).values() if isinstance(u, dict))
        bot.send_message(uid, f"💳 <b>آمار کیف پول تومانی</b>\nکاربران: {len(DATA.get('users', {}))}\nموجودی کل: {total:,} تومان\nدعوت‌ها: {len(DATA.get('referrals', {}))}\nاشتراک‌ها: {len(DATA.get('subscriptions', {}))}")
    elif action=="referral_stats":
        reward = int(bot_settings().get("referral_reward_toman", 5000))
        bot.send_message(uid,f"👥 کل دعوت‌های ثبت‌شده: {len(DATA['referrals'])}\n💳 پاداش هر دعوت معتبر: {reward:,} تومان")
    elif action=="payout_requests":
        rows = [(rid, req) for rid, req in DATA.get("payout_requests", {}).items() if req.get("status") == "pending"]
        if not rows:
            bot.send_message(uid, "📨 درخواست برداشتِ در انتظار بررسی وجود ندارد.")
        else:
            for rid, req in rows[-20:]:
                kb = types.InlineKeyboardMarkup(row_width=2)
                kb.row(types.InlineKeyboardButton("✅ ثبت پرداخت‌شده", callback_data=f"payout:paid:{rid}"), types.InlineKeyboardButton("❌ رد", callback_data=f"payout:reject:{rid}"))
                bot.send_message(uid, f"💸 درخواست برداشت <code>{esc(rid)}</code>\nکاربر: <code>{req.get('user_id')}</code>\nمبلغ: {int(req.get('amount_toman',0)):,} تومان", reply_markup=kb)
    elif action=="subscription_requests":
        rows = [(rid, req) for rid, req in DATA.get("subscription_requests", {}).items() if req.get("status") == "pending"]
        if not rows:
            bot.send_message(uid, "📨 درخواست اشتراکِ در انتظار بررسی وجود ندارد.")
        else:
            for rid, req in rows[-20:]:
                kb = types.InlineKeyboardMarkup(row_width=2)
                kb.row(types.InlineKeyboardButton("✅ تأیید", callback_data=f"subreq:approve:{rid}"), types.InlineKeyboardButton("❌ رد", callback_data=f"subreq:reject:{rid}"))
                bot.send_message(uid, f"💳 درخواست <code>{esc(rid)}</code>\nکاربر: <code>{req.get('user_id')}</code>\nمدت: {req.get('days')} روز\nمبلغ: {int(req.get('price_toman',0)):,} تومان", reply_markup=kb)
    elif action=="shop": bot.send_message(uid,shop_text(uid),reply_markup=shop_keyboard())
    elif action=="bot_settings":
        cfg = bot_settings()
        packages = "، ".join(f"{days} روز/{price:,} تومان" for days, price in SUBSCRIPTION_PACKAGES)
        custom_intro = "سفارشی" if str(cfg.get("public_features", "")).strip() else "پیش‌فرض"
        bot.send_message(uid,
            "🎛️ <b>تنظیمات عمومی ذخیره‌شده</b>\n━━━━━━━━━━━━━━\n"
            f"📝 متن معرفی /start: {custom_intro}\n"
            f"👥 پاداش دعوت: {int(cfg.get('referral_reward_toman', 5000)):,} تومان\n"
            f"🛒 بسته‌ها: {esc(packages)}\n"
            f"📢 کانال: {esc(cfg.get('channel_url', CHANNEL_URL))}\n"
            f"🌐 وب‌سایت: {esc(cfg.get('website_url', WEBSITE_URL))}")

# ---------------- Commands and callbacks ----------------
@bot.message_handler(commands=["start"])
def start_command(message):
    uid=message.from_user.id if message.from_user else 0
    if message.chat.type=="private":
        ensure_user(uid,message.from_user.username,message.from_user.first_name)
        args=(message.text or "").split(maxsplit=1)
        if len(args)>1: apply_referral(uid,args[1].strip())
        markup = owner_start_keyboard() if is_owner(uid) else public_keyboard()
        bot.send_message(message.chat.id,start_welcome_text(message.from_user),
                         reply_markup=markup,disable_web_page_preview=True)
        return
    bot.reply_to(message, group_start_guide(getattr(message.chat,"title","گروه")))

@bot.message_handler(commands=["ping"])
def ping_command(message):
    bot.reply_to(message, "🏓 MASIH GUARD فعاله و پیام رو دریافت کرد.")

@bot.message_handler(commands=["id"])
def id_command(message):
    bot.reply_to(message,f"🆔 شناسه کاربر: <code>{message.from_user.id}</code>\nشناسه چت: <code>{message.chat.id}</code>")

@bot.message_handler(commands=["ai","ask"])
def ai_command(message):
    parts=(message.text or "").split(maxsplit=1)
    if len(parts)<2:
        bot.reply_to(message,"🤖 سؤال را بعد از دستور بنویس:\n/ai سلام، خودت را معرفی کن"); return
    status=bot.reply_to(message,"🤖 در حال بررسی سؤال...")
    answer=ask_ai(parts[1].strip())
    try: bot.edit_message_text(esc(answer[:3900]),status.chat.id,status.message_id)
    except Exception: bot.send_message(message.chat.id,esc(answer[:3900]))

@bot.callback_query_handler(func=lambda call: True)
def callback_handler(call):
    try:
        data=call.data or ""; uid=call.from_user.id; chat_id=call.message.chat.id if call.message else uid
        management_action = data.startswith(("panel:", "toggle:", "ask:", "show:"))
        if management_action:
            if not call.message or call.message.chat.type != "private" or call.message.chat.id != uid:
                bot.answer_callback_query(call.id, "پنل فقط در گفت‌وگوی خصوصی ربات نمایش داده می‌شود.", show_alert=True); return
            if not is_owner(uid):
                bot.answer_callback_query(call.id, "⛔ این پنل مخصوص مالک رباته!", show_alert=True); return
        if data.startswith("payout:"):
            if not is_owner(uid):
                bot.answer_callback_query(call.id, "⛔ این پنل مخصوص مالک رباته!", show_alert=True); return
            parts = data.split(":", 2)
            if len(parts) != 3 or parts[1] not in {"paid", "reject"}:
                bot.answer_callback_query(call.id, "درخواست برداشت نامعتبر است.", show_alert=True); return
            result = decide_payout_request(parts[2], parts[1] == "paid", uid)
            bot.answer_callback_query(call.id, result[:180], show_alert=True)
            try: bot.edit_message_reply_markup(chat_id, call.message.message_id, reply_markup=None)
            except Exception: pass
            bot.send_message(uid, result)
            return
        if data.startswith("subreq:"):
            if not is_owner(uid):
                bot.answer_callback_query(call.id, "⛔ این پنل مخصوص مالک رباته!", show_alert=True); return
            parts = data.split(":", 2)
            if len(parts) != 3 or parts[1] not in {"approve", "reject"}:
                bot.answer_callback_query(call.id, "درخواست نامعتبر است.", show_alert=True); return
            result = decide_subscription_request(parts[2], parts[1] == "approve", uid)
            bot.answer_callback_query(call.id, result[:180], show_alert=True)
            try: bot.edit_message_reply_markup(chat_id, call.message.message_id, reply_markup=None)
            except Exception: pass
            bot.send_message(uid, result)
            return
        if data.startswith("user:") or data.startswith("shop:"):
            if not call.message or call.message.chat.type!="private":
                bot.answer_callback_query(call.id,"این گزینه را در گفت‌وگوی خصوصی ربات استفاده کن.",show_alert=True); return
            ensure_user(uid,call.from_user.username,call.from_user.first_name)
            if data.startswith("user:receipt:"):
                rid = data.split(":", 2)[2]
                req = DATA.get("subscription_requests", {}).get(rid)
                if not req or int(req.get("user_id", 0)) != int(uid) or req.get("status") != "pending":
                    bot.answer_callback_query(call.id, "درخواست معتبر یا در انتظار پرداخت پیدا نشد.", show_alert=True)
                    return
                WAITING[uid] = {"action": "payment_receipt", "request_id": rid}
                bot.answer_callback_query(call.id)
                bot.send_message(uid, f"📤 لطفاً عکس رسید پرداخت را همین‌جا ارسال کن.\\nشناسه درخواست: <code>{esc(rid)}</code>\\nشناسه عددی تلگرام تو: <code>{uid}</code>\\nتا بررسی مالک، اشتراک فعال نمی‌شود.")
                return
            if data=="user:home":
                bot.answer_callback_query(call.id); bot.send_message(uid,public_features_text(),reply_markup=public_keyboard()); return
            if data=="user:wallet": bot.answer_callback_query(call.id); bot.send_message(uid,public_wallet(uid)); return
            if data=="user:shop": bot.answer_callback_query(call.id); bot.send_message(uid,shop_text(uid),reply_markup=shop_keyboard()); return
            if data=="user:referrals": bot.answer_callback_query(call.id); bot.send_message(uid,referral_text(uid)); return
            if data=="user:transactions": bot.answer_callback_query(call.id); bot.send_message(uid,transactions_text(uid)); return
            if data=="user:payout":
                WAITING[uid]={"action":"payout_amount"}
                bot.answer_callback_query(call.id); bot.send_message(uid, f"💸 مبلغ برداشت را به تومان وارد کن. موجودی فعلی: {wallet(uid):,} تومان\nروش پرداخت را بعداً با مالک هماهنگ می‌کنی؛ اطلاعات بانکی را اینجا نفرست."); return
            if data=="user:font":
                WAITING[uid]={"action":"public_font_text"}; bot.answer_callback_query(call.id); bot.send_message(uid,"🔤 ۱۰۰ سبک فونت کاملاً رایگان است. متن را بفرست؛ خروجی در ۱۰ پیام ۱۰تایی نمایش داده می‌شود."); return
            if data=="user:proxies":
                bot.answer_callback_query(call.id)
                bot.send_message(uid,proxy_list_text(limit=10, with_ping=False)); return
            if data=="user:ticket":
                WAITING[uid]={"action":"ticket"}; bot.answer_callback_query(call.id); bot.send_message(uid,"متن تیکت پشتیبانی را بفرست."); return
            if data=="user:ai":
                WAITING[uid]={"action":"ai"}; bot.answer_callback_query(call.id); bot.send_message(uid,"سؤال خود را برای هوش مصنوعی بفرست."); return
            if data.startswith("shop:request:"):
                _,_,days,price=data.split(":")
                result=request_subscription(uid,int(days),int(price))
                pending_rows = [(rid, req) for rid, req in DATA.get("subscription_requests", {}).items()
                                if int(req.get("user_id", 0)) == int(uid) and req.get("status") == "pending"]
                receipt_markup = types.InlineKeyboardMarkup(row_width=1)
                if pending_rows:
                    rid, _req = pending_rows[-1]
                    receipt_markup.add(types.InlineKeyboardButton("📤 ارسال رسید پرداخت", callback_data=f"user:receipt:{rid}"))
                receipt_markup.add(types.InlineKeyboardButton("👨‍💻 ارتباط با سازنده", url=OWNER_CONTACT_URL))
                bot.answer_callback_query(call.id)
                bot.send_message(uid,result,reply_markup=receipt_markup)
                return

        if data.startswith("group_rules:"):
            try: target=int(data.split(":",1)[1])
            except ValueError: target=0
            if target and is_group_licensed(target):
                bot.answer_callback_query(call.id)
                bot.send_message(uid,"📜 <b>قوانین گروه</b>\n"+esc(get_group_settings(target).get("rules","قوانینی ثبت نشده است.")))
            else: bot.answer_callback_query(call.id,"این گروه مجوز فعال ندارد.",show_alert=True)
            return
        if data=="panel:open":
            PANEL_HISTORY[uid]=[]
            send_panel(uid,"home",user_id=uid)
            bot.answer_callback_query(call.id)
            return
        if data=="panel:back":
            if not is_owner(uid):
                bot.answer_callback_query(call.id,"⛔ این پنل مخصوص مالک رباته!",show_alert=True); return
            history=PANEL_HISTORY.setdefault(uid,[]); section=history.pop() if history else "home"
            send_panel(chat_id,section,call.message.message_id if call.message else None,user_id=uid)
            bot.answer_callback_query(call.id); return
        if data=="panel:home":
            if not is_owner(uid):
                bot.answer_callback_query(call.id,"⛔ این پنل مخصوص مالک رباته!",show_alert=True); return
            PANEL_HISTORY[uid]=[]; send_panel(chat_id,"home",call.message.message_id if call.message else None,user_id=uid)
            bot.answer_callback_query(call.id); return
        if data.startswith("panel:"):
            if not is_owner(uid):
                bot.answer_callback_query(call.id,"⛔ این پنل مخصوص مالک رباته!",show_alert=True); return
            section=data.split(":",1)[1]
            if section not in SECTIONS: bot.answer_callback_query(call.id,"بخش شناخته نشد."); return
            previous=PANEL_CURRENT.get(uid,"home")
            if previous!=section: PANEL_HISTORY.setdefault(uid,[]).append(previous)
            send_panel(chat_id,section,call.message.message_id if call.message else None,user_id=uid)
            bot.answer_callback_query(call.id); return
        if data.startswith("toggle:"):
            setting=data.split(":",1)[1]
            if not is_owner(uid):
                bot.answer_callback_query(call.id,"⛔ این پنل مخصوص مالک رباته!",show_alert=True); return
            if setting=="smart_security":
                DATA["settings"]["smart_security"]=not DATA["settings"].get("smart_security",True); save_data()
                bot.answer_callback_query(call.id,"امنیت هوشمند سراسری: "+("روشن" if DATA["settings"]["smart_security"] else "خاموش")); send_panel(chat_id,"smart",call.message.message_id if call.message else None,user_id=uid); return
            WAITING[uid]={"action":"toggle_group_setting","setting":"smart_security" if setting=="group_smart_security" else setting}
            bot.answer_callback_query(call.id)
            bot.send_message(uid,"🆔 شناسه گروه را بفرست (معمولاً با ‎-100‎ شروع می‌شود).")
            return
        if data.startswith("ask:"):
            if not is_owner(uid):
                bot.answer_callback_query(call.id,"⛔ این پنل مخصوص مالک رباته!",show_alert=True); return
            action=data.split(":",1)[1]
            global_actions={"public_features","channel_url","website_url","referral_reward_toman","wallet_adjust","add_whitelist","remove_whitelist","member_info","clear_warnings","activate_group","extend_group","revoke_group","announcement","group_stats","group_settings","search_logs"}
            if action in global_actions:
                WAITING[uid]={"action":action}
                prompts={
                    "public_features":"متن معرفی کاربران در /start را بفرست. برای رفتن به خط بعدی از خط جدید استفاده کن؛ این متن به‌صورت ساده نمایش داده می‌شود.",
                    "channel_url":"لینک کامل کانال با https:// را بفرست.",
                    "website_url":"لینک کامل وب‌سایت با https:// را بفرست.",
                    "referral_reward_toman":"مبلغ پاداش هر دعوت معتبر را به تومان وارد کن (پیش‌فرض ۵۰۰۰).",
                    "wallet_adjust":"قالب: شناسه کاربر | مبلغ (+برای افزایش و -برای کاهش) | دلیل تغییر",
                    "add_whitelist":"شناسه گروه | شناسه کاربر را بفرست.",
                    "remove_whitelist":"شناسه گروه | شناسه کاربر را بفرست.",
                    "member_info":"شناسه گروه | شناسه کاربر را بفرست.",
                    "clear_warnings":"شناسه گروه | شناسه کاربر را بفرست.",
                    "activate_group":"ربات را مدیر گروه کن؛ سپس داخل همان گروه بنویس: فعال سازی ۳۰ روز (عدد ۰ یعنی دائمی).",
                    "extend_group":"شناسه گروه | تعداد روز را بفرست.",
                    "revoke_group":"شناسه گروه را بفرست.",
                    "announcement":"شناسه گروه | متن اطلاعیه را بفرست.",
                    "group_stats":"شناسه گروه را بفرست (مثلاً -1001234567890).",
                    "group_settings":"شناسه گروه را بفرست (مثلاً -1001234567890).",
                    "search_logs":"عبارت یا شناسه‌ای برای جست‌وجو در گزارش‌ها بفرست."
                }
                bot.answer_callback_query(call.id); bot.send_message(uid,prompts[action]); return
            group_actions={"welcome_text","farewell_text","rules","auto_reply","delete_reply","bad_word","warn_limit","whitelist","add_custom_command","delete_custom_command","quiet_hours","welcome_image","welcome_delete_seconds"}
            if action in group_actions:
                WAITING[uid]={"action":"select_group_for_action","next_action":action}
                bot.answer_callback_query(call.id); bot.send_message(uid,"🆔 شناسه گروه را بفرست (معمولاً با -100 شروع می‌شود). سپس مقدار تنظیم را می‌پرسم."); return
            WAITING[uid]={"action":action,"chat_id":chat_id}
            prompts={"welcome_text":"متن خوشامد را بفرست؛ {name} نام کاربر را جایگزین می‌کند.","farewell_text":"متن خداحافظی را بفرست؛ {name} نام کاربر را جایگزین می‌کند.","rules":"قوانین جدید را بفرست.","auto_reply":"قالب: کلمه کلیدی | متن پاسخ","delete_reply":"کلمه کلیدی پاسخ خودکار را بفرست.","bad_word":"کلمه ممنوع را بفرست.","warn":"شناسه کاربر یا گروه | شناسه کاربر را بفرست.","mute":"شناسه کاربر یا گروه | شناسه کاربر را بفرست.","unmute":"شناسه کاربر یا گروه | شناسه کاربر را بفرست.","ban":"شناسه کاربر یا گروه | شناسه کاربر را بفرست.","unban":"شناسه کاربر یا گروه | شناسه کاربر را بفرست.","kick":"شناسه کاربر یا گروه | شناسه کاربر را بفرست.","font":"متن را بفرست.","add_proxy":"لینک t.me/proxy یا tg://proxy را بفرست.","delete_proxy":"شماره پروکسی را بفرست.","add_customer":"قالب: شناسه | نام | توضیحات","find_customer":"شناسه مشتری را بفرست.","ticket":"متن تیکت را بفرست.","ai":"سؤال خود را بفرست.","warn_limit":"سقف اخطار بین ۱ تا ۲۰ را بفرست.", "add_whitelist":"شناسه گروه | شناسه کاربر را بفرست.", "remove_whitelist":"شناسه گروه | شناسه کاربر را بفرست.", "member_info":"شناسه گروه | شناسه کاربر را بفرست.", "clear_warnings":"شناسه گروه | شناسه کاربر را بفرست.", "activate_group":"ربات را مدیر گروه کن؛ سپس داخل همان گروه بنویس: فعال سازی ۳۰ روز (عدد ۰ یعنی دائمی).", "extend_group":"شناسه گروه | تعداد روز را بفرست.", "revoke_group":"شناسه گروه را بفرست.", "add_custom_command":"قالب: نام فرمان بدون ! | متن پاسخ","delete_custom_command":"نام فرمان را بفرست.", "announcement":"شناسه گروه | متن اطلاعیه را بفرست.", "group_stats":"شناسه گروه را بفرست (مثلاً -1001234567890).", "group_settings":"شناسه گروه را بفرست (مثلاً -1001234567890).", "search_logs":"عبارت یا شناسه‌ای برای جست‌وجو در گزارش‌ها بفرست.", "quiet_hours":"بازهٔ سکوت را به شکل 23:00-07:00 بفرست؛ برای خاموش‌کردن بنویس خاموش.", "welcome_image":"لینک مستقیم تصویر (https://...) را بفرست؛ برای حذف تصویر بنویس حذف.", "welcome_delete_seconds":"زمان حذف خوشامد به ثانیه (۰ تا ۳۶۰۰) را بفرست."}
            bot.answer_callback_query(call.id); bot.send_message(uid,prompts.get(action,"اطلاعات موردنیاز را بفرست.")); return
        if data.startswith("show:"):
            if not is_owner(uid):
                bot.answer_callback_query(call.id,"⛔ این پنل مخصوص مالک رباته!",show_alert=True); return
            action=data.split(":",1)[1]
            if action in {"ban_list","mute_list","whitelist"}:
                WAITING[uid]={"action":"show_list_group","list_type":action}
                bot.answer_callback_query(call.id); bot.send_message(uid,"شناسه گروه را بفرست (مثلاً -1001234567890).")
                return
            if action == "rules":
                WAITING[uid]={"action":"show_rules_group"}
                bot.answer_callback_query(call.id); bot.send_message(uid,"شناسه گروه را بفرست تا قوانین همان گروه نمایش داده شود.")
                return
            WAITING[uid]={"action":"show_"+action,"chat_id":chat_id}
            bot.answer_callback_query(call.id); handle_show(uid,action); WAITING.pop(uid,None); return
        if data=="game:guess":
            GAMES[uid]=random.randint(1,5); WAITING[uid]={"action":"game:guess","chat_id":uid}
            bot.answer_callback_query(call.id); bot.send_message(uid,"🎮 عددی بین ۱ تا ۵ حدس بزن و بفرست."); return
        bot.answer_callback_query(call.id,"گزینه ناشناخته است.")
    except Exception as e:
        print("Callback error:",repr(e))
        try: bot.answer_callback_query(call.id,"خطا رخ داد؛ دوباره تلاش کن.",show_alert=True)
        except Exception: pass

@bot.message_handler(content_types=["photo"], func=lambda m: m.chat.type == "private")
def private_receipt_photo_handler(message):
    uid = int(message.from_user.id)
    pending = WAITING.get(uid, {})
    if pending.get("action") != "payment_receipt":
        return
    rid = str(pending.get("request_id", ""))
    req = DATA.get("subscription_requests", {}).get(rid)
    if not req or int(req.get("user_id", 0)) != uid or req.get("status") != "pending":
        WAITING.pop(uid, None)
        bot.reply_to(message, "⚠️ درخواست پرداخت معتبر نیست یا قبلاً بررسی شده است.")
        return
    photo = getattr(message, "photo", None) or []
    if not photo:
        bot.reply_to(message, "لطفاً عکس رسید را به‌صورت تصویر ارسال کن.")
        return
    file_id = getattr(photo[-1], "file_id", "")
    if not file_id:
        bot.reply_to(message, "⚠️ دریافت شناسهٔ تصویر ناموفق بود؛ دوباره ارسال کن.")
        return
    req["receipt_file_id"] = file_id
    req["receipt_user_id"] = uid
    req["receipt_received_at"] = now_text()
    req["receipt_message_id"] = int(message.message_id)
    save_data()
    caption = (f"🧾 <b>رسید پرداخت اشتراک</b>\nدرخواست: <code>{esc(rid)}</code>\n"
               f"شناسه عددی کاربر: <code>{uid}</code>\nمدت: {int(req.get('days', 0))} روز\n"
               f"مبلغ: {int(req.get('price_toman', 0)):,} تومان\n"
               "⚠️ رسید را دستی بررسی کن؛ دریافت تصویر به معنی تأیید پرداخت نیست.")
    kb = types.InlineKeyboardMarkup(row_width=2)
    kb.row(types.InlineKeyboardButton("✅ تأیید و فعال‌سازی", callback_data=f"subreq:approve:{rid}"),
           types.InlineKeyboardButton("❌ رد درخواست", callback_data=f"subreq:reject:{rid}"))
    try:
        bot.send_photo(OWNER_ID, file_id, caption=caption, reply_markup=kb)
        WAITING.pop(uid, None)
        bot.reply_to(message, "✅ رسید برای مالک ارسال شد. پس از بررسی، نتیجه اعلام می‌شود؛ اشتراک هنوز فعال نشده است.")
    except Exception as e:
        print("Receipt forwarding error:", repr(e))
        bot.reply_to(message, "⚠️ رسید ذخیره شد، اما ارسال آن به مالک ناموفق بود. کمی بعد دوباره تلاش کن.")


@bot.message_handler(content_types=["text"], func=lambda m: m.chat.type=="private")
def private_text_handler(message):
    uid=message.from_user.id; text=(message.text or "").strip()
    ensure_user(uid,message.from_user.username,message.from_user.first_name)
    if text.startswith("/"): return
    # AI trigger requested by the owner: only «هوش» or a reply to the bot activates it.
    normalized_private = text.replace("ي", "ی").replace("ك", "ک").strip().casefold()
    if normalized_private == "هوش":
        bot.reply_to(message, "جانم، بگو ببینم؟")
        return
    if normalized_private.startswith("هوش "):
        question = text.strip()[len("هوش "):].strip()
        if not question:
            bot.reply_to(message, "جانم، بگو ببینم؟")
        else:
            status = bot.reply_to(message, "🧠 دارم بررسی می‌کنم…")
            answer = ask_ai(question)
            try: bot.edit_message_text(esc(answer[:3900]), status.chat.id, status.message_id)
            except Exception: bot.send_message(uid, esc(answer[:3900]), reply_to_message_id=message.message_id)
        return
    replied = getattr(message, "reply_to_message", None)
    if replied and getattr(getattr(replied, "from_user", None), "is_bot", False) and text and not text.startswith("/"):
        status = bot.reply_to(message, "🧠 دارم بررسی می‌کنم…")
        answer = ask_ai(text)
        try: bot.edit_message_text(esc(answer[:3900]), status.chat.id, status.message_id)
        except Exception: bot.send_message(uid, esc(answer[:3900]), reply_to_message_id=message.message_id)
        return
    # Removed public proxy and font tools from this build.
    public_shortcuts = {
        "کیف پول": "user:wallet", "موجودی": "user:wallet", "wallet": "user:wallet",
        "خرید اشتراک": "user:shop", "اشتراک": "user:shop", "shop": "user:shop",
        "زیرمجموعه": "user:referrals", "دعوت‌ها": "user:referrals", "دعوت ها": "user:referrals",
        "تراکنش": "user:transactions", "تراکنش‌ها": "user:transactions", "تراکنش ها": "user:transactions",
        "امکانات": "user:home", "راهنما": "user:home", "help": "user:home",
    }
    shortcut = public_shortcuts.get(text.casefold())
    if shortcut == "user:wallet": bot.send_message(uid, public_wallet(uid)); return
    if shortcut == "user:shop": bot.send_message(uid, shop_text(uid), reply_markup=shop_keyboard()); return
    if shortcut == "user:referrals": bot.send_message(uid, referral_text(uid)); return
    if shortcut == "user:transactions": bot.send_message(uid, transactions_text(uid)); return
    if shortcut == "user:home": bot.send_message(uid, public_features_text(), reply_markup=public_keyboard()); return
    pending=WAITING.get(uid)
    if not pending: return
    action=pending.get("action",""); chat_id=pending.get("chat_id",uid)
    owner_only={"add_proxy","delete_proxy","add_customer","find_customer","delete_reply","bad_word","warn_limit","toggle_group_setting","select_group_for_action",
                "public_features","channel_url","website_url","referral_reward_toman","wallet_adjust","add_whitelist","remove_whitelist","member_info","clear_warnings","activate_group","extend_group","revoke_group","add_custom_command","delete_custom_command","announcement","group_stats","group_settings","search_logs",
                "welcome_text","farewell_text","rules","auto_reply","quiet_hours","welcome_image","welcome_delete_seconds","warn","mute","unmute","ban","unban","kick","show_list_group","show_rules_group"}
    if action in owner_only and not is_owner(uid):
        WAITING.pop(uid,None); bot.send_message(uid,"⛔ این عملیات فقط برای مالک است."); return
    try:
        if action in {"public_features","channel_url","website_url","referral_reward_toman"}:
            cfg = bot_settings()
            if action == "public_features":
                if text.casefold() in {"پیش‌فرض", "default", "بازنشانی"}:
                    cfg["public_features"] = ""
                    message_text = "✅ متن معرفی به حالت پیش‌فرض برگشت."
                else:
                    if len(text) > 3500: raise ValueError("متن معرفی حداکثر ۳۵۰۰ نویسه باشد.")
                    cfg["public_features"] = text
                    message_text = "✅ متن معرفی /start ذخیره شد."
            elif action in ("channel_url", "website_url"):
                if not text.startswith(("https://", "http://")) or len(text) > 500:
                    raise ValueError("لینک کامل با https:// یا http:// وارد کن.")
                cfg[action] = text
                message_text = "✅ لینک ذخیره شد."
            elif action == "referral_reward_toman":
                value = int(text)
                if not 0 <= value <= 1000000: raise ValueError("مبلغ باید بین ۰ تا ۱٬۰۰۰٬۰۰۰ تومان باشد.")
                cfg["referral_reward_toman"] = value
                message_text = f"✅ پاداش دعوت روی {value:,} تومان تنظیم شد."
            save_data(); add_log("bot_setting_updated", "", uid, action)
            WAITING.pop(uid, None)
            bot.send_message(uid, message_text)
            return
        if action=="show_rules_group":
            target=int(text)
            if target >= 0: raise ValueError("شناسه گروه باید منفی باشد.")
            if not is_group_licensed(target): raise PermissionError("این گروه مجوز فعال ندارد.")
            bot.send_message(uid,"📜 <b>قوانین گروه</b>\n"+esc(get_group_settings(target).get("rules","قوانینی ثبت نشده است.")))
            WAITING.pop(uid,None); return
        if action == "payout_amount":
            amount = int(text)
            result = request_payout(uid, amount)
            WAITING.pop(uid, None)
            bot.send_message(uid, result)
            return
        if action == "wallet_adjust":
            parts = [x.strip() for x in text.split("|", 2)]
            if len(parts) != 3: raise ValueError("قالب: شناسه کاربر | مبلغ (+/-) | دلیل")
            target_uid, amount = int(parts[0]), int(parts[1])
            if amount == 0: raise ValueError("مبلغ تغییر موجودی نمی‌تواند صفر باشد.")
            if not transaction(target_uid, amount, "تغییر دستی مالک: " + parts[2][:80]):
                raise ValueError("موجودی کاربر برای این کسر کافی نیست.")
            add_log("wallet_adjusted", "", target_uid, f"amount_toman={amount}; reason={parts[2][:100]}")
            WAITING.pop(uid, None)
            bot.send_message(uid, f"✅ موجودی کاربر {target_uid} به اندازهٔ {amount:+,} تومان تغییر کرد. موجودی جدید: {wallet(target_uid):,} تومان")
            try: bot.send_message(target_uid, f"💳 کیف پول شما توسط مالک به‌روزرسانی شد.\nمبلغ تغییر: {amount:+,} تومان\nموجودی جدید: {wallet(target_uid):,} تومان\nدلیل: {esc(parts[2][:120])}")
            except Exception: pass
            return
        if action=="show_list_group":
            target=int(text)
            if target>=0: raise ValueError("شناسه گروه باید منفی باشد.")
            list_type=pending.get("list_type")
            if list_type=="whitelist":
                values=get_group_settings(target).get("whitelist",[])
                heading="📂 <b>فهرست کاربران مجاز</b>"
            else:
                kind="banned" if list_type=="ban_list" else "muted"
                values=DATA.setdefault("moderation_lists",{}).get(str(target),{}).get(kind,[])
                heading="📋 <b>فهرست ثبت‌شده توسط ربات</b>"
            bot.send_message(uid,(heading+"\n"+"\n".join(f"• <code>{esc(x)}</code>" for x in values)) if values else "فهرست برای این گروه خالی است.")
            WAITING.pop(uid,None); return
        if action=="select_group_for_action":
            target=int(text)
            if target>=0: raise ValueError("شناسه گروه باید منفی باشد.")
            next_action=pending.get("next_action","")
            WAITING[uid]={"action":next_action,"chat_id":target}
            prompts={"welcome_text":"متن خوشامد را بفرست؛ می‌توانی {name} بگذاری.","farewell_text":"متن خداحافظی را بفرست.","rules":"قوانین جدید را بفرست.","auto_reply":"قالب: کلمه کلیدی | متن پاسخ","delete_reply":"کلمه کلیدی را بفرست.","bad_word":"کلمه ممنوع را بفرست.","warn_limit":"سقف اخطار ۱ تا ۲۰ را بفرست.","whitelist":"شناسه گروه را بفرست تا فهرست کاربران مجاز نمایش داده شود.","add_custom_command":"قالب: نام فرمان بدون ! | متن پاسخ","delete_custom_command":"نام فرمان را بفرست.", "quiet_hours":"بازهٔ سکوت را به شکل 23:00-07:00 بفرست؛ برای خاموش‌کردن بنویس خاموش.", "welcome_image":"لینک مستقیم تصویر (https://...) را بفرست؛ برای حذف تصویر بنویس حذف.", "welcome_delete_seconds":"زمان حذف پیام خوشامد را به ثانیه بفرست (۰ یعنی حذف خودکار خاموش؛ حداکثر ۳۶۰۰)."}
            bot.send_message(uid,"✅ گروه انتخاب شد.\n"+prompts.get(next_action,"مقدار تنظیم را بفرست.")); return
        if action=="whitelist":
            target=int(text)
            if target>=0: raise ValueError("شناسه گروه باید منفی باشد.")
            values=get_group_settings(target).get("whitelist",[])
            bot.send_message(uid,"📂 <b>کاربران مجاز</b>\n"+("\n".join(f"• <code>{esc(x)}</code>" for x in values) if values else "فهرست خالی است."))
            WAITING.pop(uid,None); return
        if action=="group_settings":
            target=int(text)
            if target >= 0: raise ValueError("شناسه گروه باید منفی باشد.")
            cfg=get_group_settings(target)
            lines=[f"🆔 شناسه گروه: <code>{target}</code>",f"🛡 مجوز نصب: {'فعال' if is_group_licensed(target) else 'غیرفعال'}"]
            labels={"anti_link":"ضد لینک","anti_ads":"ضد تبلیغ","anti_spam":"ضد اسپم","anti_repeat":"ضد تکرار","anti_forward":"ضد فوروارد","media_lock":"قفل رسانه","lock_mentions":"قفل تگ/منشن","lock_hashtags":"قفل هشتگ","lock_usernames":"قفل نام‌کاربری","smart_security":"امنیت هوشمند گروه","welcome_on":"خوشامدگویی","farewell_on":"خداحافظی","quiet_hours_on":"سکوت شبانه"}
            for key,label in labels.items(): lines.append(f"{label}: {'روشن' if cfg.get(key,False) else 'خاموش'}")
            lines.append(f"قوانین: {esc(cfg.get('rules',''))[:500]}")
            bot.send_message(uid,"⚙️ <b>شناسه و تنظیمات گروه</b>\n"+"\n".join(lines))
            WAITING.pop(uid,None); return
        if action=="search_logs":
            query=text.casefold()
            rows=[]
            for row in reversed(DATA.get("logs",[])):
                blob=" ".join(str(row.get(k,"")) for k in ("time","action","chat_id","user_id","detail")).casefold()
                if query in blob: rows.append(row)
                if len(rows)>=20: break
            result="\n\n".join(f"{esc(x.get('time'))} | {esc(log_action_label(x.get('action')))}\nگروه: <code>{esc(x.get('chat_id'))}</code> کاربر: <code>{esc(x.get('user_id'))}</code>\n{esc(x.get('detail'))}" for x in rows)
            bot.send_message(uid,"🔎 <b>نتیجهٔ جست‌وجوی گزارش‌ها</b>\n"+(result or "موردی پیدا نشد."))
            WAITING.pop(uid,None); return
        if action=="group_stats":
            target=int(text)
            if target >= 0: raise ValueError("شناسه گروه باید منفی باشد.")
            gs=DATA.setdefault("group_stats",{}).get(str(target),{})
            active=len(DATA.setdefault("active_members",{}).get(str(target),{}))
            bot.send_message(uid, f"📊 <b>آمار گروه</b> <code>{target}</code>\nپیام‌ها: {int(gs.get('messages',0))}\nمسدودشده‌ها: {int(gs.get('blocked',0))}\nورودها: {int(gs.get('joins',0))}\nخروج‌ها: {int(gs.get('leaves',0))}\nکاربران دیده‌شده: {active}")
            WAITING.pop(uid,None); return
        if action=="quiet_hours":
            s=get_group_settings(chat_id)
            if text.casefold() in {"خاموش","off","0"}:
                s["quiet_hours_on"]=False
                save_data(); bot.send_message(uid,"🌙 ساعت سکوت شبانه برای این گروه خاموش شد.")
            else:
                match=re.fullmatch(r"\s*(\d{1,2}:\d{2})\s*-\s*(\d{1,2}:\d{2})\s*",text)
                if not match: raise ValueError("قالب درست: 23:00-07:00")
                start,end=match.group(1),match.group(2)
                datetime.strptime(start,"%H:%M"); datetime.strptime(end,"%H:%M")
                s.update({"quiet_start":start,"quiet_end":end,"quiet_hours_on":True})
                save_data(); add_log("quiet_hours_set",chat_id,uid,f"{start}-{end}")
                bot.send_message(uid,f"🌙 ساعت سکوت گروه فعال شد: {start} تا {end}")
            WAITING.pop(uid,None); return
        if action=="welcome_image":
            s=get_group_settings(chat_id)
            if text.casefold() in {"حذف","پاک","off"}:
                s["welcome_image"]=""; save_data(); bot.send_message(uid,"🗑 تصویر خوشامد حذف شد.")
            else:
                if not text.startswith(("https://","http://")) or len(text)>1000: raise ValueError("لینک مستقیم تصویر باید با https:// شروع شود.")
                s["welcome_image"]=text; save_data(); bot.send_message(uid,"🖼 لینک تصویر خوشامد ذخیره شد.")
            WAITING.pop(uid,None); return
        if action=="welcome_delete_seconds":
            seconds=int(text)
            if not 0 <= seconds <= 3600: raise ValueError("زمان باید بین ۰ تا ۳۶۰۰ ثانیه باشد.")
            get_group_settings(chat_id)["welcome_delete_seconds"]=seconds; save_data()
            bot.send_message(uid,"🗑 حذف خودکار خوشامد: "+("خاموش" if seconds==0 else f"پس از {seconds} ثانیه"))
            WAITING.pop(uid,None); return
        if action=="toggle_group_setting":
            target=int(text)
            if target>=0: raise ValueError("شناسه گروه باید منفی باشد.")
            setting=pending.get("setting",""); s=get_group_settings(target)
            if not isinstance(s.get(setting),bool): raise ValueError("این تنظیم قابل تغییر نیست.")
            s[setting]=not s[setting]; save_data(); add_log("setting_toggled",target,uid,f"{setting}={s[setting]}")
            label={"smart_security":"امنیت هوشمند گروه","anti_link":"ضد لینک","anti_ads":"ضد تبلیغ","anti_spam":"ضد اسپم","anti_repeat":"ضد پیام تکراری","anti_forward":"ضد فوروارد","media_lock":"قفل رسانه","lock_mentions":"قفل تگ/منشن","lock_hashtags":"قفل هشتگ","lock_usernames":"قفل نام‌کاربری","phone_filter":"فیلتر شماره تماس","lock_photos":"قفل عکس","lock_videos":"قفل فیلم","lock_files":"قفل فایل","lock_stickers":"قفل استیکر و گیف","lock_voice":"قفل پیام صوتی","lock_video_notes":"قفل ویدئوی گرد","welcome_on":"خوشامدگویی","farewell_on":"پیام خداحافظی","join_approval":"تأیید ورود"}.get(setting,setting)
            bot.send_message(uid,f"✅ {label} برای گروه <code>{target}</code>: {'روشن' if s[setting] else 'خاموش'}")
        elif action in ("activate_group", "extend_group", "revoke_group"):
            if action == "activate_group":
                raise ValueError("برای فعال‌سازی، ربات را مدیر گروه کن و داخل همان گروه بنویس: فعال سازی ۳۰ روز؛ برای دائمی عدد ۰ را بزن.")
            parts=[x.strip() for x in text.split("|")]
            target=int(parts[0])
            if target >= 0: raise ValueError("شناسه گروه باید منفی باشد.")
            licenses=DATA.setdefault("group_licenses", {})
            if action == "revoke_group":
                if len(parts) != 1: raise ValueError("فقط شناسه گروه را بفرست.")
                licenses.pop(str(target), None)
                add_log("group_license_revoked",target,uid,"لغو مجوز نصب")
                save_data(); bot.send_message(uid,f"⛔ مجوز گروه <code>{target}</code> لغو شد.")
            else:
                if len(parts) != 2: raise ValueError("قالب: شناسه گروه | تعداد روز؛ برای دائمی عدد ۰")
                days=int(parts[1])
                if not 0 <= days <= 3650: raise ValueError("تعداد روز باید بین ۰ تا ۳۶۵۰ باشد.")
                from datetime import timedelta
                now=datetime.now()
                old=licenses.get(str(target),{})
                base=now
                if action == "extend_group":
                    try: base=max(now,datetime.strptime(old.get("expires", ""),"%Y-%m-%d %H:%M:%S"))
                    except Exception: base=now
                expires="" if days == 0 else (base+timedelta(days=days)).strftime("%Y-%m-%d %H:%M:%S")
                licenses[str(target)]={"approved":True,"expires":expires,"activated_by":uid,"updated":now_text()}
                add_log("group_license_activated" if action=="activate_group" else "group_license_extended",target,uid,f"days={days}")
                save_data()
                bot.send_message(uid,f"✅ مجوز گروه <code>{target}</code> فعال شد.\n⭐ پایان مجوز: {esc(expires or 'دائمی')}")
                # Only a NEW activation sends a confirmation to the group; panel replies stay private.
                if action == "activate_group":
                    try:
                        bot.send_message(
                            target,
                            "🛡️ <b>مجوز نصب MASIH GUARD فعال شد!</b>\n"
                            "━━━━━━━━━━━━━━━━━━\n"
                            "✅ مجوز این گروه با موفقیت تأیید شد.\n"
                            f"⭐ پایان اعتبار: {esc(expires or 'دائمی')}\n"
                            "🌈 اکنون می‌توانید از امکانات ربات استفاده کنید."
                        )
                    except Exception as group_notice_error:
                        print("Group activation notice error:", repr(group_notice_error))
                        bot.send_message(uid,"⚠️ مجوز ثبت شد، اما پیام گروه ارسال نشد. مطمئن شو ربات داخل گروه است و اجازهٔ ارسال پیام دارد؛ سپس دوباره فعال‌سازی را انجام بده.")
        elif action=="announcement":
            if "|" not in text: raise ValueError("قالب: شناسه گروه | متن اطلاعیه")
            group_text,announcement=text.split("|",1); target=int(group_text.strip()); announcement=announcement.strip()
            if target>=0 or not announcement: raise ValueError("شناسه گروه منفی و متن اطلاعیه الزامی است.")
            if not is_group_licensed(target): raise PermissionError("این گروه مجوز فعال ندارد.")
            bot.send_message(target,"📣 <b>اطلاعیهٔ مدیریت</b>\n━━━━━━━━━━━━━━\n"+esc(announcement[:3500]))
            add_log("announcement",target,uid,announcement[:150]); save_data(); bot.send_message(uid,"✅ اطلاعیه ارسال شد.")
        elif action=="add_custom_command":
            if "|" not in text: raise ValueError("قالب: نام فرمان | متن پاسخ")
            command,response=[x.strip() for x in text.split("|",1)]
            if not re.fullmatch(r"[A-Za-z0-9_؀-ۿ-]{1,40}",command) or not response: raise ValueError("نام فرمان یا متن پاسخ معتبر نیست.")
            get_group_settings(chat_id).setdefault("custom_commands",{})[command.lstrip("!").casefold()]=response[:2000]
            save_data(); bot.send_message(uid,"✅ فرمان اختصاصی ذخیره شد. در گروه از !نام‌فرمان استفاده کن.")
        elif action=="delete_custom_command":
            key=text.lstrip("!").casefold(); existed=get_group_settings(chat_id).setdefault("custom_commands",{}).pop(key,None)
            save_data(); bot.send_message(uid,"🗑 فرمان حذف شد." if existed is not None else "فرمان پیدا نشد.")
        elif action in ("add_whitelist", "remove_whitelist"):

            parts=[x.strip() for x in text.split("|")]
            if len(parts)!=2: raise ValueError("قالب: شناسه گروه | شناسه کاربر")
            target, member=int(parts[0]),int(parts[1])
            if target >= 0: raise ValueError("شناسه گروه باید منفی باشد.")
            s=get_group_settings(target); values=[str(x) for x in s.get("whitelist",[])]
            if action=="add_whitelist":
                if str(member) not in values: values.append(str(member))
                s["whitelist"]=values; result="به فهرست مجاز اضافه شد."
            else:
                s["whitelist"]=[x for x in values if x!=str(member)]; result="از فهرست مجاز حذف شد."
            save_data(); add_log(action,target,uid,str(member)); bot.send_message(uid,"✅ "+result)
        elif action=="clear_warnings":
            parts=[x.strip() for x in text.split("|")]
            if len(parts)!=2: raise ValueError("قالب: شناسه گروه | شناسه کاربر")
            target,member=int(parts[0]),int(parts[1]); DATA["warnings"].pop(f"{target}:{member}",None)
            save_data(); bot.send_message(uid,"🧹 اخطارهای عضو پاک شد.")
        elif action=="member_info":
            parts=[x.strip() for x in text.split("|")]
            if len(parts)!=2: raise ValueError("قالب: شناسه گروه | شناسه کاربر")
            target,member=int(parts[0]),int(parts[1])
            try:
                cm=bot.get_chat_member(target,member)
                full_name=" ".join(x for x in [getattr(cm.user,"first_name", ""),getattr(cm.user,"last_name", "")] if x)
                status_raw=getattr(cm,"status","unknown")
                status={"creator":"مالک گروه","administrator":"مدیر","member":"عضو","restricted":"محدودشده","left":"خارج‌شده","kicked":"مسدودشده"}.get(status_raw,"نامشخص")
                warnings=DATA["warnings"].get(f"{target}:{member}",0)
                bot.send_message(uid,f"🔎 <b>اطلاعات عضو</b>\nنام: {esc(full_name)}\nشناسه: <code>{member}</code>\nوضعیت: {esc(status)}\nاخطارها: {warnings}")
            except Exception as e: raise ValueError("دریافت اطلاعات عضو ممکن نشد؛ شناسه و دسترسی ربات را بررسی کن.")
        elif action == "public_font_text":
            if len(text) > 120: raise ValueError("برای نمایش ۱۰۰ سبک، متن حداکثر ۱۲۰ نویسه باشد.")
            WAITING[uid]={"action":"public_font_name","font_text":text}
            bot.send_message(uid,"حالا اسم دلخواهت را برای عنوان خروجی بفرست؛ اگر عنوان نمی‌خواهی، بنویس بدون اسم.")
            return
        elif action == "public_font_name":
            raw=pending.get("font_text", "")
            label="" if text.casefold() in {"بدون اسم","ندارد","نه"} else text[:50]
            heading=(f"✨ <b>{esc(label)}</b>\n━━━━━━━━━━━━━━\n" if label else "🔤 <b>۱۰۰ سبک فونت رایگان</b>\n━━━━━━━━━━━━━━\n")
            variants=font_variants(raw)
            for start in range(0, 100, 10):
                lines=[]
                for idx,(name,value) in enumerate(variants[start:start+10], start=start+1):
                    lines.append(f"<b>{idx}. {esc(name)}</b>\n<code>{esc(value)}</code>")
                bot.send_message(uid, (heading if start==0 else f"🔤 <b>ادامهٔ فونت‌ها ({start+1} تا {min(start+10,100)})</b>\n━━━━━━━━━━━━━━\n") + "\n\n".join(lines))
        elif action in ("public_font","font"):
            variants=font_variants(text[:120])
            for start in range(0,100,10):
                lines=[f"<b>{idx}. {esc(name)}</b>\n<code>{esc(value)}</code>" for idx,(name,value) in enumerate(variants[start:start+10],start=start+1)]
                bot.send_message(uid, ("🔤 <b>۱۰۰ سبک فونت رایگان</b>\n━━━━━━━━━━━━━━\n" if start==0 else f"🔤 <b>ادامهٔ فونت‌ها ({start+1} تا {min(start+10,100)})</b>\n━━━━━━━━━━━━━━\n")+"\n\n".join(lines))
        elif action in ("welcome_text","farewell_text","rules"):
            s=get_group_settings(chat_id); s[action]=text[:3000]; save_data(); bot.send_message(uid,"✅ ذخیره شد.")
        elif action=="auto_reply":
            if "|" not in text: bot.send_message(uid,"قالب: کلمه کلیدی | متن پاسخ"); return
            keyword,reply=[p.strip() for p in text.split("|",1)]
            if not keyword or not reply: raise ValueError("کلمه کلیدی و پاسخ خالی نباشند.")
            get_group_settings(chat_id)["auto_replies"][keyword]=reply[:2000]; save_data(); bot.send_message(uid,"✅ پاسخ خودکار ذخیره شد.")
        elif action=="delete_reply":
            existed=get_group_settings(chat_id)["auto_replies"].pop(text,None); save_data()
            bot.send_message(uid,"🗑 پاسخ حذف شد." if existed is not None else "کلمه کلیدی پیدا نشد.")
        elif action=="bad_word":
            s=get_group_settings(chat_id)
            if text not in s["bad_words"]: s["bad_words"].append(text[:100])
            save_data(); bot.send_message(uid,"✅ کلمه ممنوع ثبت شد.")
        elif action=="warn_limit":
            n=int(text)
            if not 1<=n<=20: raise ValueError("عدد باید بین ۱ تا ۲۰ باشد.")
            get_group_settings(chat_id)["warn_limit"]=n; save_data(); bot.send_message(uid,"✅ سقف اخطار ذخیره شد.")
        elif action in ("warn","mute","unmute","ban","unban","kick"):
            parts=[x.strip() for x in text.split("|")]
            if len(parts) != 2:
                raise ValueError("برای امنیت، شناسه گروه و شناسه عضو را با | بفرست. نمونه: -1001234567890 | 123456789")
            target_chat,target_user=int(parts[0]),int(parts[1])
            if target_chat >= 0: raise ValueError("شناسه گروه باید منفی باشد.")
            if not is_owner(uid) and not is_group_admin(target_chat,uid): raise PermissionError("باید مدیر همان گروه باشی.")
            if not is_group_licensed(target_chat): raise PermissionError("این گروه مجوز فعال ندارد.")
            bot.send_message(uid,moderate_member(action,target_chat,target_user))
        elif action=="add_proxy":
            if not (text.startswith("https://t.me/proxy?") or text.startswith("http://t.me/proxy?") or text.startswith("tg://proxy?")):
                raise ValueError("لینک معتبر t.me/proxy یا tg://proxy وارد کن.")
            if not proxy_endpoint(text): raise ValueError("این لینک سرور یا پورت معتبر ندارد؛ لینک کامل پروکسی را بفرست.")
            if text in DATA["proxies"]: bot.send_message(uid,"این پروکسی قبلاً ثبت شده است.")
            elif len(DATA["proxies"]) >= 20: raise ValueError("حداکثر ۲۰ پروکسی می‌توان ذخیره کرد؛ ابتدا یکی را حذف کن.")
            else:
                DATA["proxies"].append(text); save_data(); add_log("proxy_added","",uid,"پروکسی ثبت شد")
                ping=proxy_ping_ms(text)
                bot.send_message(uid,"✅ پروکسی ذخیره شد.\n"+(f"🟢 پاسخ سرور: {ping} ms (آزمایش اتصال TCP)" if ping is not None else "⚠️ اتصال به سرور در حال حاضر برقرار نشد؛ لینک ذخیره شده ولی ممکن است آفلاین باشد."))
        elif action=="delete_proxy":
            i=int(text)-1
            if not 0<=i<len(DATA["proxies"]): raise ValueError("شماره پروکسی معتبر نیست.")
            removed=DATA["proxies"].pop(i); save_data(); add_log("proxy_deleted","",uid,removed); bot.send_message(uid,"🗑 پروکسی حذف شد.")
        elif action=="add_customer":
            parts=[p.strip() for p in text.split("|",2)]
            if len(parts)<2: raise ValueError("قالب: شناسه | نام | توضیحات")
            DATA["customers"][parts[0]]={"name":parts[1],"details":parts[2] if len(parts)>2 else "","created":now_text()}
            save_data(); bot.send_message(uid,"✅ مشتری ثبت شد.")
        elif action=="find_customer":
            c=DATA["customers"].get(text)
            bot.send_message(uid,(f"💼 <b>{esc(c['name'])}</b>\nشناسه: <code>{esc(text)}</code>\nتوضیحات: {esc(c.get('details',''))}") if c else "مشتری پیدا نشد.")
        elif action=="ticket":
            tid=create_ticket(uid,message.from_user.username,text); bot.send_message(uid,f"🎫 تیکت ثبت شد. شناسه: <code>{tid}</code>")
        elif action=="ai":
            status=bot.send_message(uid,"🧠 در حال دریافت پاسخ...")
            answer=ask_ai(text)
            try: bot.edit_message_text(esc(answer[:3900]),uid,status.message_id)
            except Exception: bot.send_message(uid,esc(answer[:3900]))
        elif action=="game:guess":
            guess=int(text)
            if not 1<=guess<=5: raise ValueError("عدد باید بین ۱ تا ۵ باشد.")
            answer=GAMES.get(uid)
            if answer is None: raise ValueError("بازی فعالی نیست.")
            if guess==answer:
                DATA["points"][str(uid)]=DATA["points"].get(str(uid),0)+1; save_data()
                bot.send_message(uid,f"🎉 درست بود! عدد {answer} بود؛ یک امتیاز گرفتی.")
            else: bot.send_message(uid,f"این بار نه؛ عدد درست {answer} بود.")
            GAMES.pop(uid,None)
        elif action.startswith("show_"): handle_show(uid,action[5:])
        else:
            WAITING.pop(uid,None)
            bot.send_message(uid,"⚠️ این گزینه به این نسخه متصل نشده است. پنل را از /panel باز کن و اگر تکرار شد، نام همان دکمه را برای اصلاح بفرست.")
            return
        WAITING.pop(uid,None)
    except (ValueError,TypeError,PermissionError) as e:
        bot.send_message(uid,"⚠️ ورودی یا دسترسی معتبر نیست.\n"+esc(str(e)))
    except Exception as e:
        print("Private action error:",repr(e)); bot.send_message(uid,"⚠️ عملیات ناموفق بود؛ دسترسی ربات و اطلاعات واردشده را بررسی کن.")

# Register the group text router after command handlers so /start and /ping keep priority.
bot.message_handler(content_types=["text"], func=lambda m: getattr(getattr(m, "chat", None), "type", "") in ("group", "supergroup"))(group_message_handler)


if __name__ == "__main__":
    print(f"{BRAND} {VERSION}: starting polling")
    try:
        bot.infinity_polling(skip_pending=True, timeout=30, long_polling_timeout=25)
    except Exception as e:
        print("Polling stopped:",repr(e))
        raise
