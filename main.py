
import telebot
import os

TOKEN = os.getenv("BOT_TOKEN")

if not TOKEN:
    raise ValueError("BOT_TOKEN is not set")

bot = telebot.TeleBot(TOKEN)

ENGLISH_FONTS = {
    "𝗕𝗼𝗹𝗱": str.maketrans(
        "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz",
        "𝗔𝗕𝗖𝗗𝗘𝗙𝗚𝗛𝗜𝗝𝗞𝗟𝗠𝗡𝗢𝗣𝗤𝗥𝗦𝗧𝗨𝗩𝗪𝗫𝗬𝗭"
        "𝗮𝗯𝗰𝗱𝗲𝗳𝗴𝗵𝗶𝗷𝗸𝗹𝗺𝗻𝗼𝗽𝗾𝗿𝘀𝘁𝘂𝘃𝘄𝘅𝘆𝘇"
    ),
    "𝓒𝓾𝓻𝓼𝓲𝓿𝓮": str.maketrans(
        "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz",
        "𝓐𝓑𝓒𝓓𝓔𝓕𝓖𝓗𝓘𝓙𝓚𝓛𝓜𝓝𝓞𝓟𝓠𝓡𝓢𝓣𝓤𝓥𝓦𝓧𝓨𝓩"
        "𝓪𝓫𝓬𝓭𝓮𝓯𝓰𝓱𝓲𝓳𝓴𝓵𝓶𝓷𝓸𝓹𝓺𝓻𝓼𝓽𝓾𝓿𝔀𝔁𝔂𝔃"
    ),
    "𝕯𝖔𝖚𝖇𝖑𝖊": str.maketrans(
        "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz",
        "𝔸𝔹ℂ𝔻𝔼𝔽𝔾ℍ𝕀𝕁𝕂𝕃𝕄𝕆ℙℚℝ𝕊𝕋𝕌𝕍𝕎𝕏𝕐ℤ"
        "𝕒𝕓𝕔𝕕𝕖𝕗𝕘𝕙𝕚𝕛𝕜𝕝𝕞𝕟𝕠𝕡𝕢𝕣𝕤𝕥𝕦𝕧𝕨𝕩𝕪𝕫"
    ),
}

def make_styles(text):
    results = []

    for name, table in ENGLISH_FONTS.items():
        results.append(f"{name}\n{text.translate(table)}")

    results.append(f"✨ ༺ {text} ༻ ✨")
    results.append(f"꧁༒ {text} ༒꧂")
    results.append(f"『 {text} 』")
    results.append(f"♡ {text} ♡")

    return "\n\n".join(results)

@bot.message_handler(commands=["start"])
def start(message):
    bot.reply_to(
        message,
        "سلام ❤️ به ربات فونت خوش اومدی!\n\n"
        "متن فارسی یا انگلیسی رو بفرست "
        "تا چند مدل استایل برات بسازم."
    )

@bot.message_handler(
    func=lambda message: bool(message.text)
)
def convert_font(message):
    result = make_styles(message.text)

    bot.reply_to(message, result)

bot.infinity_polling()
