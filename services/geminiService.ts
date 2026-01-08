
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
    
    // Use gemini-3-flash-preview as the standard model for basic text tasks to avoid 403 errors
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: {
        parts: [{
          text: `You are an expert translator specializing in Human Resources and Corporate Recruitment in China.
          
          Task: Translate the following Job Title from Vietnamese to Simplified Chinese (Mainland China standard).
          
          Requirements:
          1. Use professional, standard business terminology commonly found on Chinese job boards (like Boss Zhipin, Liepin).
          2. Ensure accuracy for seniority levels (e.g., 'Intern', 'Senior', 'Manager', 'Director').
          3. Do not include Pinyin, explanations, or extra punctuation.
          4. Output ONLY the Chinese characters.
          
          Input Job Title: "${text}"`
        }]
      }
    });

    return response.text?.trim() || "Không tìm thấy";
  } catch (error: any) {
    // Handle Permission Denied (403) specifically
    if (error?.status === 'PERMISSION_DENIED' || error?.code === 403 || (error.message && error.message.includes('permission'))) {
        console.warn("Gemini API Permission Denied. Model access restricted or API Key invalid.");
    } else {
        console.error("Translation error:", error);
    }
    return "Lỗi cấu hình";
  }
};
