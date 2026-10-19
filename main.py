
import os
import threading
import telebot
from flask import Flask

TOKEN = os.getenv("BOT_TOKEN")

if not TOKEN:
    raise ValueError("BOT_TOKEN is not set in Render Environment")

bot = telebot.TeleBot(TOKEN)
app = Flask(__name__)


@app.get("/")
def home():
    return "Telegram font bot is running!", 200


def fancy_english(text):
    normal = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz"
    bold = "𝐀𝐁𝐂𝐃𝐄𝐅𝐆𝐇𝐈𝐉𝐊𝐋𝐌𝐍𝐎𝐏𝐐𝐑𝐒𝐓𝐔𝐕𝐖𝐗𝐘𝐙𝐚𝐛𝐜𝐝𝐞𝐟𝐠𝐡𝐢𝐣𝐤𝐥𝐦𝐧𝐨𝐩𝐪𝐫𝐬𝐭𝐮𝐯𝐰𝐱𝐲𝐳"
    italic = "𝐴𝐵𝐶𝐷𝐸𝐹𝐺𝐻𝐼𝐽𝐾𝐿𝑀𝑁𝑂𝑃𝑄𝑅𝑆𝑇𝑈𝑉𝑊𝑋𝑌𝑍𝑎𝑏𝑐𝑑𝑒𝑓𝑔ℎ𝑖𝑗𝑘𝑙𝑚𝑛𝑜𝑝𝑞𝑟𝑠𝑡𝑢𝑣𝑤𝑥𝑦𝑧"

    bold_table = str.maketrans(normal, bold)
    italic_table = str.maketrans(normal, italic)

    return (
        "✨ فونت‌های متن شما ✨\n\n"
        f"1) معمولی:\n{text}\n\n"
        f"2) بولد:\n{text.translate(bold_table)}\n\n"
        f"3) ایتالیک:\n{text.translate(italic_table)}\n\n"
        f"4) تزئینی:\n『 {text} 』"
    )


@bot.message_handler(commands=["start"])
def start(message):
    bot.reply_to(
        message,
        "سلام! ❤️\n"
        "متن فارسی یا انگلیسی خودت رو بفرست "
        "تا چند مدل فانتزی برات آماده کنم."
    )


@bot.message_handler(
    content_types=["text"],
    func=lambda message: not message.text.startswith("/")
)
def convert_text(message):
    result = fancy_english(message.text)
    bot.reply_to(message, result)


def run_bot():
    bot.infinity_polling(skip_pending=True)


if __name__ == "__main__":
    threading.Thread(target=run_bot, daemon=True).start()

    port = int(os.environ.get("PORT", 10000))
    app.run(host="0.0.0.0", port=port)
