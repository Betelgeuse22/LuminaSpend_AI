import { GoogleGenAI, Type } from "@google/genai";
import { Receipt, Category } from "../types";

// Initialize Gemini Client
const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

const SYSTEM_INSTRUCTION = `
You are an expert financial assistant and OCR specialist. 
Your task is to analyze receipt images and extract structured data.
1. Identify the store name, transaction date, and total amount.
2. List all purchased items with their prices.
3. Categorize each item into one of these exact categories: Groceries, Dining, Electronics, Utilities, Transport, Clothing, Health, Entertainment, Other.
4. If a category is ambiguous, use your best judgement based on the item name.
5. Provide a brief, single-sentence strategic insight about this purchase (e.g., "This meal was 15% more expensive than your average dining spend.").
`;

export const parseReceiptImage = async (base64Image: string): Promise<Partial<Receipt>> => {
  try {
    // Remove header if present (data:image/jpeg;base64,)
    const cleanBase64 = base64Image.split(',')[1] || base64Image;

    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      config: {
        systemInstruction: SYSTEM_INSTRUCTION,
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            storeName: { type: Type.STRING },
            date: { type: Type.STRING, description: "YYYY-MM-DD format" },
            total: { type: Type.NUMBER },
            currency: { type: Type.STRING, description: "Currency code e.g. USD, EUR" },
            confidence: { type: Type.NUMBER, description: "Confidence score 0-1" },
            aiInsight: { type: Type.STRING, description: "A helpful financial insight about this specific receipt" },
            items: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  name: { type: Type.STRING },
                  price: { type: Type.NUMBER },
                  category: { 
                    type: Type.STRING, 
                    enum: Object.values(Category)
                  }
                }
              }
            }
          }
        }
      },
      contents: {
        parts: [
          {
            inlineData: {
              mimeType: "image/jpeg",
              data: cleanBase64
            }
          },
          {
            text: "Extract data from this receipt."
          }
        ]
      }
    });

    const text = response.text;
    if (!text) throw new Error("No response from AI");

    const data = JSON.parse(text);
    return data;

  } catch (error) {
    console.error("Gemini Scan Error:", error);
    throw error;
  }
};

export const generateSavingsAdvice = async (receipts: Receipt[]): Promise<any[]> => {
  if (receipts.length === 0) return [];

  const summary = receipts.map(r => `${r.date}: ${r.storeName} - ${r.total} ${r.currency}`).join('\n');

  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview", // Good for text analysis
      config: {
        responseMimeType: "application/json",
        systemInstruction: "You are a financial advisor. Analyze the spending history and provide 3 specific savings opportunities or alerts.",
        responseSchema: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              title: { type: Type.STRING },
              description: { type: Type.STRING },
              type: { type: Type.STRING, enum: ["warning", "savings", "trend"] },
              impact: { type: Type.STRING, description: "Estimated money saved or lost" }
            }
          }
        }
      },
      contents: `Analyze this spending summary and give advice:\n${summary}`
    });
    
    return JSON.parse(response.text || "[]");
  } catch (e) {
    console.error("Advice generation error", e);
    return [];
  }
};