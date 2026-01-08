
import { ConversionResult } from '../types';
import { getReadFunction } from '../utils/currencyTextFormatter';
import { GoogleGenAI } from "@google/genai";

const getDecimals = (currencyCode: string): number => {
  if (['VND', 'JPY', 'KRW', 'TWD', 'HUF'].includes(currencyCode)) {
    return 0;
  }
  return 2;
};

export const convertCurrencyApi = async (
  amount: number,
  fromCurrency: string,
  toCurrency: string
): Promise<ConversionResult> => {
  try {
    let rate: number;

    if (fromCurrency === 'CNY' && toCurrency === 'VND') {
        rate = 3450;
    } else if (fromCurrency === 'VND' && toCurrency === 'CNY') {
        rate = 1 / 3450;
    } else {
        const response = await fetch(`https://open.er-api.com/v6/latest/${fromCurrency}?t=${Date.now()}`);
        if (!response.ok) throw new Error('Network response was not ok');
        const data = await response.json();
        rate = data.rates[toCurrency];
        if (!rate) throw new Error(`Exchange rate not found for ${toCurrency}`);
    }

    const rawConverted = amount * rate;
    const roundedConverted = Math.ceil(rawConverted);
    const sourceDecimals = getDecimals(fromCurrency);
    const roundedInput = parseFloat(amount.toFixed(sourceDecimals));

    return {
      convertedAmount: roundedConverted,
      exchangeRate: rate,
      textSource: getReadFunction(fromCurrency, roundedInput),
      textTarget: getReadFunction(toCurrency, roundedConverted)
    };
  } catch (error) {
    console.error("Currency API error:", error);
    throw new Error("Failed to convert currency. Please try again.");
  }
};

export const translateJobTitle = async (text: string): Promise<string> => {
  if (!text || !text.trim()) return "";
  
  try {
    const apiKey = process.env.API_KEY;
    if (!apiKey) {
        console.warn("API Key for Gemini is missing");
        return "Lỗi cấu hình";
    }

    const ai = new GoogleGenAI({ apiKey });
    
    // Switch to gemini-2.0-flash-exp per user request for a free/efficient model
    const response = await ai.models.generateContent({
      model: 'gemini-2.0-flash-exp',
      contents: {
        parts: [{
          text: `Role: Expert HR Recruitment Specialist in China.
          
Task: Translate the Vietnamese Job Title "${text}" into the most standard, professional Simplified Chinese job title used on recruitment platforms like Boss Zhipin or Liepin.

Context:
- The translation must be accurate to the corporate hierarchy (Intern, Junior, Senior, Manager, Director).
- It should sound natural to a Chinese HR professional.

Output Rules:
- Output ONLY the Chinese characters.
- Do NOT include Pinyin, English explanations, or extra punctuation.`
        }]
      }
    });

    return response.text?.trim() || "Không tìm thấy";
  } catch (error: any) {
    if (error?.status === 'PERMISSION_DENIED' || error?.code === 403 || (error.message && error.message.includes('permission'))) {
        console.warn("Gemini API Permission Denied. Model access restricted or API Key invalid.");
    } else {
        console.error("Translation error:", error);
    }
    return "Lỗi dịch thuật";
  }
};
