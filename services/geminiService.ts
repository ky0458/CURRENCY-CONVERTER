
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
    // Initialize Gemini only when needed
    const apiKey = process.env.API_KEY;
    if (!apiKey) {
        console.warn("API Key for Gemini is missing");
        return "Lỗi cấu hình";
    }

    const ai = new GoogleGenAI({ apiKey });
    
    // Use gemini-3-flash-preview for text tasks to avoid 404 errors with older/preview names
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: `Translate the following job title/position from Vietnamese to Simplified Chinese. 
      Ensure professional business terminology. 
      Output ONLY the Chinese translation text, do not include pinyin or explanations.
      
      Input: "${text}"`,
    });

    return response.text?.trim() || "Không tìm thấy";
  } catch (error) {
    console.error("Translation error:", error);
    return "Lỗi dịch";
  }
};
