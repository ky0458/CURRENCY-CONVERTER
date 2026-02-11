
import { ConversionResult } from '../types';
import { getReadFunction } from '../utils/currencyTextFormatter';

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

export const translateJobTitle = async (text: string): Promise<string> => {
  if (!text || !text.trim()) return "";
  
  try {
    // Sử dụng Google Translate API (GTX endpoint - Free Client)
    const encodedText = encodeURIComponent(text.trim());
    const url = `https://translate.googleapis.com/translate_a/single?client=gtx&sl=vi&tl=zh-CN&dt=t&q=${encodedText}`;

    const response = await fetch(url);
    
    if (!response.ok) {
        console.warn("Google Translate blocked/failed, switching to fallback.");
        return await translateWithFallback(text);
    }

    const data = await response.json();

    if (data && data[0]) {
        return data[0].map((part: any) => part[0]).join('');
    }

    return "Không tìm thấy";
  } catch (error: any) {
    console.error("Primary translation error:", error);
    return await translateWithFallback(text);
  }
};

const translateWithFallback = async (text: string): Promise<string> => {
    try {
        const encodedText = encodeURIComponent(text.trim());
        const url = `https://api.mymemory.translated.net/get?q=${encodedText}&langpair=vi|zh-CN`;
        const response = await fetch(url);
        const data = await response.json();

        if (data && data.responseData && data.responseData.translatedText) {
            return data.responseData.translatedText;
        }
    } catch (e) {
        console.error("Fallback translation error", e);
    }
    return "Lỗi dịch vụ";
};
