/**
 * UTILS: Number to Text Converters
 */

const readGroupVietnamese = (group: string): string => {
  const digits = ["không", "một", "hai", "ba", "bốn", "năm", "sáu", "bảy", "tám", "chín"];
  let temp = "";
  if (group === "000") return "";

  const a = parseInt(group.substring(0, 1));
  const b = parseInt(group.substring(1, 2));
  const c = parseInt(group.substring(2, 3));

  temp += digits[a] + " trăm";

  if (b === 0) {
    if (c === 0) return temp;
    temp += " linh " + digits[c];
  } else if (b === 1) {
    temp += " mười";
    if (c === 1) temp += " một";
    else if (c === 5) temp += " lăm";
    else if (c !== 0) temp += " " + digits[c];
  } else {
    temp += " " + digits[b] + " mươi";
    if (c === 1) temp += " mốt";
    else if (c === 4) temp += " tư";
    else if (c === 5) temp += " lăm";
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
    
    if (i === 0) {
        read = read.replace(/^không trăm linh /, "").replace(/^không trăm /, "");
        if (read.startsWith("linh ")) read = read.replace("linh ", "");
    }
    if (groupValue > 0) result += " " + read + " " + suffix;
  }

  result = result.trim().replace(/\s+/g, ' ');

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

const readCJK = (number: number, currencyName: string, chars: { digits: string[], units: string[], groups: string[] }, lang: 'JP' | 'CN' | 'KR'): string => {
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
            for (let i = 0; i < 4; i++) { digitsInPart.push(p % 10); p = Math.floor(p / 10); }
            for(let i=0; i<4; i++) {
                const digit = digitsInPart[i];
                if (digit > 0) {
                    let prefix = chars.digits[digit];
                    if (i === 1 && digit === 1 && (lang === 'JP' || lang === 'KR')) prefix = ""; 
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

export const getReadFunction = (currencyCode: string, amount: number): string => {
    switch (currencyCode) {
        case 'VND': return readNumberVietnamese(amount, 'Đồng');
        case 'JPY': return readCJK(amount, '円 (Yen)', { digits: ['零', '一', '二', '三', '四', '五', '六', '七', '八', '九'], units: ['十', '百', '千'], groups: ['万', '億', '兆'] }, 'JP');
        case 'KRW': return readCJK(amount, '원 (Won)', { digits: ['영', '일', '이', '삼', '사', '오', '육', '칠', '팔', '구'], units: ['십', '백', '천'], groups: ['만', '억', '조'] }, 'KR');
        case 'CNY': return readCJK(amount, '元', { digits: ['零', '一', '二', '三', '四', '五', '六', '七', '八', '九'], units: ['十', '百', '千'], groups: ['万', '亿', '兆'] }, 'CN');
        case 'TWD': return readCJK(amount, '圓', { digits: ['零', '一', '二', '三', '四', '五', '六', '七', '八', '九'], units: ['十', '百', '千'], groups: ['万', '亿', '兆'] }, 'CN');
        case 'USD': case 'EUR': case 'GBP': case 'AUD': case 'CAD': case 'SGD':
        default: return readNumberEnglish(amount, currencyCode);
    }
};