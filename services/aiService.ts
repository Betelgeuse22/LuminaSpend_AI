import Groq from "groq-sdk";
import { Receipt, Category, SpendingInsight } from "../types";

// Инициализируем Groq через Vite env
const groq = new Groq({ 
  apiKey: import.meta.env.VITE_GROQ_API_KEY,
  dangerouslyAllowBrowser: true // Разрешаем запуск в браузере для учебного проекта
});

const SYSTEM_PROMPT = `You are a receipt OCR expert. Analyze the image and return ONLY a JSON object.
Fields:
- storeName (string)
- date (YYYY-MM-DD)
- totalAmount (number)
- currency (string, e.g., "RUB")
- items (array of { name, price, quantity, category })
- aiSummary (string, one short sentence in Russian)

Categories MUST be one of: ${Object.values(Category).join(', ')}.
Language: Russian.`;

export const parseReceiptImage = async (base64Image: string): Promise<Partial<Receipt>> => {
  try {
    const cleanBase64 = base64Image.split(',')[1] || base64Image;

    const completion = await groq.chat.completions.create({
      // ИСПРАВЛЕНИЕ: Переходим на Llama 4 Scout (актуальная Vision-модель)
      model: "meta-llama/llama-4-scout-17b-16e-instruct", 
      messages: [
        {
          role: "user",
          content: [
            { type: "text", text: SYSTEM_PROMPT },
            {
              type: "image_url",
              image_url: { url: `data:image/jpeg;base64,${cleanBase64}` },
            },
          ],
        },
      ],
      response_format: { type: "json_object" },
    });

    const content = completion.choices[0]?.message?.content;
    if (!content) throw new Error("Пустой ответ от ИИ");

    return JSON.parse(content);
  } catch (error) {
    console.error("Groq OCR Error:", error);
    // Точка роста: Если Maverick тоже не виден, попробуй llama-3.2-90b-vision-preview (если она еще жива)
    throw error;
  }
};

export const generateSavingsAdvice = async (receipts: Receipt[]): Promise<SpendingInsight[]> => {
  if (receipts.length === 0) return [];

  // Подготавливаем сводку трат для контекста ИИ
  const summary = receipts
    .map(r => `${r.date}: ${r.storeName} - ${r.totalAmount} ${r.currency}`)
    .join('\n');

  try {
    const completion = await groq.chat.completions.create({
      model: "llama-3.3-70b-versatile", 
      messages: [
        { 
          role: "system", 
          // Уточняем инструкцию: просим конкретный ключ "insights"
          content: `Ты финансовый аналитик. Проанализируй расходы пользователя. 
          Верни JSON объект с ключом "insights", который содержит массив из 3 объектов.
          Структура объекта: { "title": string, "description": string, "type": "warning" | "savings" | "trend", "impact": string }.
          Язык: русский.` 
        },
        { 
          role: "user", 
          content: `Дай советы по экономии на основе этих чеков:\n${summary}` 
        },
      ],
      // Это поле заставляет Groq проверять валидность JSON
      response_format: { type: "json_object" },
    });

    const rawContent = completion.choices[0]?.message?.content || '{}';
    const parsedData = JSON.parse(rawContent);

    // ЛОГИКА РАСПАКОВКИ:
    // 1. Проверяем наш основной ключ "insights"
    if (parsedData.insights && Array.isArray(parsedData.insights)) {
      return parsedData.insights;
    }

    // 2. Запасной вариант: если ИИ использовал другое имя ключа, ищем любой массив внутри
    const anyArray = Object.values(parsedData).find(val => Array.isArray(val));
    if (Array.isArray(anyArray)) {
      return anyArray as SpendingInsight[];
    }

    // 3. Если ничего не нашли — возвращаем пустой массив, чтобы приложение не упало
    console.warn("AI не вернул массив советов в нужном формате", parsedData);
    return [];

  } catch (e) {
    console.error("Ошибка при генерации советов Groq:", e);
    return [];
  }
};