import os
import asyncio
import logging
import json
from dotenv import load_dotenv
from aiogram import Bot, Dispatcher, types, F
from aiogram.filters import Command
from supabase import create_client, Client
from groq import Groq

# 1. Загрузка окружения
print("🚀 Step 1: Loading environment...")
load_dotenv()

# 2. Инициализация клиентов
print("🔗 Step 2: Connecting to services...")
try:
    supabase: Client = create_client(
        os.getenv("SUPABASE_URL"), os.getenv("SUPABASE_KEY"))
    groq_client = Groq(api_key=os.getenv("GROQ_API_KEY"))
    bot = Bot(token=os.getenv("TELEGRAM_BOT_TOKEN"))
    dp = Dispatcher()
    print("✅ Services connected!")
except Exception as e:
    print(f"❌ Error during initialization: {e}")

logging.basicConfig(level=logging.INFO)

SYSTEM_PROMPT = """Analyze the receipt image and return a JSON object with:
{
  "storeName": "string",
  "date": "YYYY-MM-DD",
  "totalAmount": number,
  "currency": "string",
  "items": [{"name": "string", "price": number, "category": "string"}],
  "aiSummary": "string"
}
Return ONLY valid JSON. If you can't read something, make a best guess."""


@dp.message(Command("start"))
async def cmd_start(message: types.Message):
    await message.answer(f"Привет, {message.from_user.full_name}! ✨\nТвой ID: {message.from_user.id}\nПришли фото чека.")


@dp.message(F.photo)
async def handle_photo(message: types.Message):
    tg_id = str(message.from_user.id)
    full_name = message.from_user.full_name or "Unknown User"
    print(f"📸 Received photo from {full_name} (ID: {tg_id})")

    try:
        # 1. Проверяем/Создаем пользователя
        user_res = supabase.table("profiles").select(
            "id").eq("telegram_id", tg_id).execute()

        if not user_res.data:
            new_user = supabase.table("profiles").insert({
                "telegram_id": tg_id,
                "display_name": full_name,
            }).execute()
            user_id = new_user.data[0]['id']
            logging.info(f"🆕 Registered new user: {full_name}")
        else:
            user_id = user_res.data[0]['id']

        msg = await message.answer("⏳ Магия AI началась... Анализирую чек...")

        # 2. Получаем ссылку на фото
        photo = message.photo[-1]
        file_info = await bot.get_file(photo.file_id)
        file_url = f"https://api.telegram.org/file/bot{os.getenv('TELEGRAM_BOT_TOKEN')}/{file_info.file_path}"

        # 3. Запрос к Groq Vision
        completion = groq_client.chat.completions.create(
            model="meta-llama/llama-4-scout-17b-16e-instruct",
            messages=[
                {
                    "role": "user",
                    "content": [
                        {"type": "text", "text": SYSTEM_PROMPT},
                        {"type": "image_url", "image_url": {"url": file_url}}
                    ]
                }
            ],
            temperature=0.1,
            response_format={"type": "json_object"}
        )

        receipt_data = json.loads(completion.choices[0].message.content)

        # 4. Сохранение в БД
        supabase.table("receipts").insert({
            "user_id": user_id,
            "store_name": receipt_data.get("storeName", "Unknown"),
            "transaction_date": receipt_data.get("date"),
            "total_amount": receipt_data.get("totalAmount", 0),
            "currency": receipt_data.get("currency", "EUR"),
            "items": receipt_data.get("items", []),
            "ai_summary": receipt_data.get("aiSummary", "")
        }).execute()

        await msg.edit_text(
            f"✅ Готово!\n🛒 Магазин: {receipt_data.get('storeName')}\n💰 Сумма: {receipt_data.get('totalAmount')} {receipt_data.get('currency')}"
        )

    except Exception as e:
        logging.error(f"Error: {e}")
        await message.answer(f"❌ Ошибка: {str(e)[:100]}")

# ГЛАВНЫЙ БЛОК ЗАПУСКА


async def main():
    print("📡 Step 3: Starting polling...")
    try:
        await dp.start_polling(bot)
    except Exception as e:
        print(f"❌ Polling error: {e}")

if __name__ == "__main__":
    print("🎬 Starting script...")
    asyncio.run(main())
