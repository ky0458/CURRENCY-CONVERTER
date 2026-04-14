
import { ConversionResult } from '../types';
import { getReadFunction } from '../utils/currencyTextFormatter';
import { GoogleGenAI } from '@google/genai';

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

const getDecimals = (currencyCode: string): number => {
  if (['VND', 'JPY', 'KRW', 'TWD', 'HUF'].includes(currencyCode)) {
    return 0;
  }
  return 2;
};

export const convertCurrencyApi = async (
  amount: number,
  fromCurrency: string,
  toCurrency: string,
  customCnyRate: number = 3700,
  useCustomCnyRate: boolean = true
): Promise<ConversionResult> => {
  try {
    let rate: number;

    const isCnyVndPair = (fromCurrency === 'CNY' && toCurrency === 'VND') || (fromCurrency === 'VND' && toCurrency === 'CNY');

    if (isCnyVndPair && useCustomCnyRate) {
        if (fromCurrency === 'CNY' && toCurrency === 'VND') {
            rate = customCnyRate;
        } else {
            rate = 1 / customCnyRate;
        }
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

const FALLBACK_MODELS = [
  "gemini-2.5-flash",
  "gemini-3-flash-preview",
  "gemini-3.1-flash-lite-preview",
  "gemma-3-12b-it"
];

let currentModelIndex = 0;

export const translateJobTitle = async (text: string): Promise<string> => {
  if (!text || !text.trim()) return "";
  
  let attempts = 0;
  
  while (attempts < FALLBACK_MODELS.length) {
    const modelToUse = FALLBACK_MODELS[(currentModelIndex + attempts) % FALLBACK_MODELS.length];
    try {
      const response = await ai.models.generateContent({
        model: modelToUse,
        contents: {
          parts: [{
            text: `Dịch tên vị trí tuyển dụng sau từ tiếng Việt sang tiếng Trung. Hãy trả về đúng tên vị trí tuyển dụng khớp trong tiếng Trung thường được người Trung và người Việt sử dụng trong công việc thực tế. Chỉ trả về kết quả dịch, tuyệt đối không giải thích hay thêm bất kỳ chữ nào khác.
        
Tên vị trí: ${text.trim()}`
          }]
        }
      });
      
      currentModelIndex = (currentModelIndex + attempts) % FALLBACK_MODELS.length;
      return response.text?.trim() || "Không tìm thấy";
    } catch (error: any) {
      console.warn(`Gemini translation error with model ${modelToUse}:`, error);
      attempts++;
    }
  }
  
  return "Lỗi dịch vụ AI";
};
