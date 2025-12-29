import { ConversionResult } from '../types';

/**
 * UTILS & CONSTANTS
 */
const getDecimals = (currencyCode: string): number => {
  if (['VND', 'JPY', 'KRW', 'TWD', 'HUF'].includes(currencyCode)) {
    return 0;
  }
  return 2;
};

/**
 * 1. VIETNAMESE (Tiếng Việt)
 */
const readGroupVietnamese = (group: string): string => {
  const digits = ["không", "một", "hai", "ba", "bốn", "năm", "sáu", "bảy", "tám", "chín"];
  let temp = "";
  if (group === "000") return "";

  const a = parseInt(group.substring(0, 1));
  const b = parseInt(group.substring(1, 2));
  const c = parseInt(group.substring(2, 3));

  // Hàng Trăm
  temp += digits[a] + " trăm";

  // Hàng Chục
  if (b === 0) {
    if (c === 0) return temp; // x00
    temp += " linh " + digits[c]; // x05 -> linh năm
  } else if (b === 1) {
    temp += " mười"; // x1x
    if (c === 1) temp += " một"; // 11 -> mười một
    else if (c === 5) temp += " lăm"; // 15 -> mười lăm
    else if (c !== 0) temp += " " + digits[c];
  } else {
    temp += " " + digits[b] + " mươi"; // x2x
    if (c === 1) temp += " mốt"; // 21 -> mươi mốt
    else if (c === 4) temp += " tư"; // 24 -> mươi tư
    else if (c === 5) temp += " lăm"; // 25 -> mươi lăm
    else if (c !== 0) temp += " " + digits[c];
  }
  return temp;
};

const readNumberVietnamese = (number: number, currencyName: string): string => {
  if (number === 0) return "Không " + currencyName;
  const strNum = Math.abs(number).toString();
  const parts = strNum.split('.');
  let integerPart = parts[0];
  let decimalPart = parts.length > 1 ? parts[1] : "";

  // Padding left with zeros to fit groups of 3
  while (integerPart.length % 3 !== 0) integerPart = "0" + integerPart;
  
  const groups = [];
  for (let i = 0; i < integerPart.length; i += 3) groups.push(integerPart.substring(i, i + 3));

  const suffixes = ["", "nghìn", "triệu", "tỷ", "nghìn tỷ", "triệu tỷ"];
  let result = "";
  
  for (let i = 0; i < groups.length; i++) {
    const group = groups[i];
    const groupValue = parseInt(group);
    const suffix = suffixes[groups.length - 1 - i];
    
    let read = readGroupVietnamese(group);
    
    // Fix logic: Nếu là nhóm đầu tiên, xóa các chữ thừa như "không trăm", "linh"
    if (i === 0) {
        // Ví dụ: 010 (10.000) -> "không trăm mười" -> replace -> "mười"
        // Ví dụ: 001 (1.000) -> "không trăm linh một" -> replace -> "một"
        read = read.replace(/^không trăm linh /, ""); 
        read = read.replace(/^không trăm /, "");
        
        // Clean up any remaining leading "linh " if edge cases occur
        if (read.startsWith("linh ")) read = read.replace("linh ", "");
    }

    if (groupValue > 0) {
        // Logic nối chuỗi chuẩn xác
        result += " " + read + " " + suffix;
    }
  }

  // Xóa khoảng trắng thừa
  result = result.trim().replace(/\s+/g, ' ');

  // Đọc phần thập phân (nếu có)
  if (decimalPart && parseInt(decimalPart) > 0) {
      if (decimalPart.length === 1) decimalPart += "0";
      const val = parseInt(decimalPart.substring(0, 2));
      
      let decimalText = "";
      if (val < 10) decimalText = "linh " + ["không", "một", "hai", "ba", "bốn", "năm", "sáu", "bảy", "tám", "chín"][val];
      else {
          const chuc = Math.floor(val / 10);
          const donvi = val % 10;
          const digits = ["không", "một", "hai", "ba", "bốn", "năm", "sáu", "bảy", "tám", "chín"];
          
          if (chuc === 1) decimalText = "mười";
          else decimalText = digits[chuc] + " mươi";
          
          if (donvi === 1 && chuc > 1) decimalText += " mốt";
          else if (donvi === 5 && chuc > 0) decimalText += " lăm";
          else if (donvi !== 0) decimalText += " " + digits[donvi];
      }
      
      result += ` phẩy ${decimalText}`;
  }

  const final = result + " " + currencyName;
  return final.charAt(0).toUpperCase() + final.slice(1);
};

/**
 * 2. ENGLISH (Tiếng Anh - USD, EUR, GBP, AUD...)
 */
const readNumberEnglish = (number: number, currencyCode: string): string => {
  const ones = ['', 'one', 'two', 'three', 'four', 'five', 'six', 'seven', 'eight', 'nine', 'ten', 'eleven', 'twelve', 'thirteen', 'fourteen', 'fifteen', 'sixteen', 'seventeen', 'eighteen', 'nineteen'];
  const tens = ['', '', 'twenty', 'thirty', 'forty', 'fifty', 'sixty', 'seventy', 'eighty', 'ninety'];
  const scales = ['', 'thousand', 'million', 'billion', 'trillion'];

  if (number === 0) return `Zero ${currencyCode}`;

  const numStr = Math.abs(number).toString();
  const parts = numStr.split('.');
  let integerPart = parseInt(parts[0]);
  let decimalPart = parts.length > 1 ? parts[1] : null;

  let words = [];
  
  if (integerPart === 0) words.push("zero");
  else {
      let scaleIndex = 0;
      while (integerPart > 0) {
        const chunk = integerPart % 1000;
        if (chunk > 0) {
          const chunkStr = [];
          const hundreds = Math.floor(chunk / 100);
          const remainder = chunk % 100;
          if (hundreds > 0) { chunkStr.push(ones[hundreds]); chunkStr.push('hundred'); }
          if (remainder > 0) {
             if (remainder < 20) chunkStr.push(ones[remainder]);
             else {
               chunkStr.push(tens[Math.floor(remainder / 10)]);
               if (remainder % 10 > 0) chunkStr.push(ones[remainder % 10]);
             }
          }
          if (scales[scaleIndex]) chunkStr.push(scales[scaleIndex]);
          words.unshift(...chunkStr);
        }
        integerPart = Math.floor(integerPart / 1000);
        scaleIndex++;
      }
  }

  let result = words.join(' ');
  if (decimalPart) {
      if (decimalPart.length === 1) decimalPart += "0";
      const val = parseInt(decimalPart.substring(0, 2));
      if (val > 0) {
           // Read as "point fifty" or similar for currency
           result += ` point`;
           if (val < 20) result += " " + ones[val];
           else {
               result += " " + tens[Math.floor(val/10)];
               if (val%10 > 0) result += " " + ones[val%10];
           }
      }
  }

  const currencyNames: Record<string, string> = {
      'USD': 'Dollars', 'EUR': 'Euros', 'GBP': 'Pounds', 
      'AUD': 'Australian Dollars', 'CAD': 'Canadian Dollars', 'SGD': 'Singapore Dollars'
  };
  
  const name = currencyNames[currencyCode] || currencyCode;
  result = result + " " + name;
  return result.charAt(0).toUpperCase() + result.slice(1);
};

/**
 * 3. JAPANESE (Tiếng Nhật - JPY) & CHINESE (Tiếng Trung - CNY) & KOREAN (Tiếng Hàn - KRW)
 */

const readCJK = (
    number: number, 
    currencyName: string, 
    chars: { digits: string[], units: string[], groups: string[] },
    lang: 'JP' | 'CN' | 'KR'
): string => {
    if (number === 0) return `${chars.digits[0]}${currencyName}`;

    let num = Math.floor(number); 
    let result = "";
    let groupIndex = 0;

    while (num > 0) {
        const part = num % 10000;
        if (part > 0) {
            let partStr = "";
            let p = part;
            
            const digitsInPart = [];
            for (let i = 0; i < 4; i++) {
                digitsInPart.push(p % 10);
                p = Math.floor(p / 10);
            }

            for(let i=0; i<4; i++) {
                const digit = digitsInPart[i];
                if (digit > 0) {
                    let prefix = chars.digits[digit];
                    // Skip "One" for tens in JP/KR (e.g., 15 is Juu Go, not Ichi Juu Go)
                    if (i === 1 && digit === 1 && (lang === 'JP' || lang === 'KR')) {
                        prefix = ""; 
                    }
                    partStr = prefix + (i > 0 ? chars.units[i-1] : "") + partStr;
                }
            }
            result = partStr + (groupIndex > 0 ? chars.groups[groupIndex - 1] : "") + result;
        }
        num = Math.floor(num / 10000);
        groupIndex++;
    }

    return result + currencyName;
};

// Japanese Implementation
const readNumberJapanese = (number: number): string => {
    const chars = {
        digits: ['零', '一', '二', '三', '四', '五', '六', '七', '八', '九'],
        units: ['十', '百', '千'],
        groups: ['万', '億', '兆']
    };
    return readCJK(number, '円 (Yen)', chars, 'JP');
};

// Chinese Implementation
const readNumberChinese = (number: number, code: string): string => {
    const chars = {
        digits: ['零', '一', '二', '三', '四', '五', '六', '七', '八', '九'],
        units: ['十', '百', '千'],
        groups: ['万', '亿', '兆']
    };
    const name = code === 'CNY' ? '元' : '圓';
    return readCJK(number, name, chars, 'CN');
};

// Korean Implementation
const readNumberKorean = (number: number): string => {
    const chars = {
        digits: ['영', '일', '이', '삼', '사', '오', '육', '칠', '팔', '구'],
        units: ['십', '백', '천'],
        groups: ['만', '억', '조']
    };
    return readCJK(number, '원 (Won)', chars, 'KR');
};

/**
 * 4. THAI (Tiếng Thái - THB)
 */
const readNumberThai = (number: number): string => {
    const digits = ['ศูนย์', 'หนึ่ง', 'สอง', 'สาม', 'สี่', 'ห้า', 'หก', 'เจ็ด', 'แปด', 'เก้า'];
    const units = ['', 'สิบ', 'ร้อย', 'พัน', 'หมื่น', 'แสน', 'ล้าน'];
    
    if (number === 0) return "ศูนย์ บาท";
    
    let numStr = Math.floor(number).toString();
    let text = "";
    
    for (let i = 0; i < numStr.length; i++) {
        const digit = parseInt(numStr[i]);
        const pos = numStr.length - i - 1; 
        
        if (digit !== 0) {
            if (pos === 0 && digit === 1 && numStr.length > 1) text += "เอ็ด";
            else if (pos === 1 && digit === 2) text += "ยี่";
            else if (pos === 1 && digit === 1) text += "";
            else text += digits[digit];
            
            if (pos < 6) text += units[pos];
            else text += "ล้าน"; 
        }
    }
    return text + " บาท (Baht)";
};


/**
 * MAIN DISPATCHER
 */
const getReadFunction = (currencyCode: string, amount: number) => {
    switch (currencyCode) {
        case 'VND': return readNumberVietnamese(amount, 'Đồng');
        case 'JPY': return readNumberJapanese(amount);
        case 'KRW': return readNumberKorean(amount);
        case 'CNY': return readNumberChinese(amount, 'CNY');
        case 'TWD': return readNumberChinese(amount, 'TWD');
        case 'THB': return readNumberThai(amount);
        case 'USD': case 'EUR': case 'GBP': case 'AUD': case 'CAD': case 'SGD':
        default: return readNumberEnglish(amount, currencyCode);
    }
};

/**
 * HÀM CHUYỂN ĐỔI CHÍNH
 */
export const convertCurrencyApi = async (
  amount: number,
  fromCurrency: string,
  toCurrency: string
): Promise<ConversionResult> => {
  try {
    let rate: number;

    // CUSTOM RULE: Fixed Rate for CNY/VND
    // 1 CNY = 3450 VND
    if (fromCurrency === 'CNY' && toCurrency === 'VND') {
        rate = 3450;
    } else if (fromCurrency === 'VND' && toCurrency === 'CNY') {
        rate = 1 / 3450;
    } else {
        // 1. Fetch for other currencies
        const response = await fetch(`https://open.er-api.com/v6/latest/${fromCurrency}?t=${Date.now()}`);
        if (!response.ok) throw new Error('Network response was not ok');
        const data = await response.json();
        rate = data.rates[toCurrency];

        if (!rate) throw new Error(`Exchange rate not found for ${toCurrency}`);
    }

    // 2. Calc
    const rawConverted = amount * rate;
    
    // Rounding - Cập nhật: Làm tròn lên (Ceil) để bỏ phần thập phân
    const roundedConverted = Math.ceil(rawConverted);

    const sourceDecimals = getDecimals(fromCurrency);
    const roundedInput = parseFloat(amount.toFixed(sourceDecimals));

    // 3. Generate Text Native to Country
    const textSource = getReadFunction(fromCurrency, roundedInput);
    const textTarget = getReadFunction(toCurrency, roundedConverted);

    return {
      convertedAmount: roundedConverted,
      exchangeRate: rate,
      textSource,
      textTarget
    };

  } catch (error) {
    console.error("Currency API error:", error);
    throw new Error("Failed to convert currency. Please try again.");
  }
};