
import { ConversionResult } from '../types';
import { getReadFunction } from '../utils/currencyTextFormatter';
import { GoogleGenAI } from '@google/genai';

let aiInstance: GoogleGenAI | null = null;
const getAI = () => {
  if (!aiInstance) {
    const key = process.env.GEMINI_API_KEY;
    if (!key) {
      throw new Error('Please configure GEMINI_API_KEY to use AI features.');
    }
    aiInstance = new GoogleGenAI({ apiKey: key });
  }
  return aiInstance;
};

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
  "gemini-2.5-flash-lite",
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
      const response = await getAI().models.generateContent({
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

export const readCvContent = async (
  cvDataArray: { base64: string; mimeType: string; filename: string }[],
  jdData?: { base64?: string; mimeType?: string; text?: string }
): Promise<string> => {
  let attempts = 0;
  
  while (attempts < FALLBACK_MODELS.length) {
    const modelToUse = FALLBACK_MODELS[(currentModelIndex + attempts) % FALLBACK_MODELS.length];
    try {
      const parts: any[] = [];
      
      cvDataArray.forEach((cv, index) => {
          const cleanCvBase64 = cv.base64.includes('base64,') ? cv.base64.split('base64,')[1] : cv.base64;
          parts.push({
              text: `CV thứ ${index + 1} (Tên file: ${cv.filename}):`
          });
          parts.push({
              inlineData: {
                  data: cleanCvBase64,
                  mimeType: cv.mimeType
              }
          });
      });

      if (jdData) {
          if (jdData.base64 && jdData.mimeType) {
              const cleanJdBase64 = jdData.base64.includes('base64,') ? jdData.base64.split('base64,')[1] : jdData.base64;
              parts.push({
                  text: `\n\nTài liệu bên dưới là Job Description (Mô tả công việc):` 
              });
              parts.push({
                  inlineData: {
                      data: cleanJdBase64,
                      mimeType: jdData.mimeType
                  }
              });
          } else if (jdData.text) {
              parts.push({
                  text: `\n\nĐây là Job Description (Mô tả công việc):\n\n${jdData.text}`
              });
          }
          
          if (cvDataArray.length > 1) {
             parts.push({
                text: `Bạn là một Headhunter (Chuyên gia tuyển dụng) có nhiều năm kinh nghiệm. Dưới góc nhìn chuyên sâu, hãy phân tích ${cvDataArray.length} CV được cung cấp và so sánh mức độ phù hợp với JD (Job Description) đính kèm. 
Hãy xếp hạng các ứng viên theo độ phù hợp từ cao xuống thấp và đánh giá từng người.
Trình bày báo cáo theo format chuyên nghiệp, súc tích (sử dụng Markdown, in đậm, gạch đầu dòng). NGẮN GỌN VÀ NHẮM TRÚNG TRỌNG TÂM. Tuyệt đối KHÔNG sử dụng các biểu tượng (emoji) không cần thiết, trừ khi thực sự cần để làm nổi bật thông tin quan trọng:

# BẢNG XẾP HẠNG ỨNG VIÊN
*Sắp xếp theo thứ tự % phù hợp giảm dần*
1. **[Tên ứng viên 1]** - [Độ phù hợp %]
2. **[Tên ứng viên 2]** - [Độ phù hợp %]
...

---

*(Sau đó, với MỖI ứng viên, trình bày ngắn gọn các thông tin sau)*

## [Top 1] [Tên Ứng Viên] - [Độ phù hợp %]%
- **Nhận định:** [NÊN GỬI / KHÔNG NÊN GỬI / CÂN NHẮC]
- **Lý do quyết định:** [Giải thích tối đa 2 câu lý do]
- **Kinh nghiệm:** [Số năm kinh nghiệm, kỹ năng cốt lõi map với JD]
- **Điểm nổi bật:** [Điểm cộng vượt trội]
- **Khoảng trống:** [Điểm yếu/Rủi ro]

## [Top 2] [Tên Ứng Viên] - [Độ phù hợp %]%
... (tương tự như trên cho các ứng viên tiếp theo)`
             });
          } else {
             parts.push({
                text: `Bạn là một Headhunter (Chuyên gia tuyển dụng) có nhiều năm kinh nghiệm. Dưới góc nhìn chuyên sâu, hãy phân tích CV này và so sánh mức độ phù hợp với JD (Job Description) đính kèm. 
Hãy trình bày báo cáo đánh giá theo format từng tầng thông tin rõ ràng, chuyên nghiệp, súc tích (sử dụng Markdown, in đậm, gạch đầu dòng). NGẮN GỌN VÀ NHẮM TRÚNG TRỌNG TÂM. Tuyệt đối KHÔNG sử dụng các biểu tượng (emoji) không cần thiết, trừ khi thực sự cần để làm nổi bật thông tin quan trọng:

# ĐÁNH GIÁ ĐỘ PHÙ HỢP VÀ NHẬN ĐỊNH THỰC TẾ
*HÃY TÔ ĐẬM VÀ LÀM NỔI BẬT PHẦN NÀY*
- **Độ phù hợp (%):** [Đánh giá tổng quan %]
- **Nhận định:** [NÊN GỬI / KHÔNG NÊN GỬI / CÂN NHẮC]
- **Lý do quyết định:** [Giải thích tối đa 2 câu lý do tại sao lại đưa ra nhận định trên]

# THÔNG TIN CÁ NHÂN & NỀN TẢNG
- **Giới tính:** [Nam/Nữ/Không rõ]
- **Ngày/tháng/năm sinh:** [Ngày sinh hoặc Không có thông tin]
- **Số năm kinh nghiệm làm việc:** [Tổng số năm kinh nghiệm sát với chuyên môn]
- **Trình độ học vấn:** [Tên trường học (VD: Đại học/Cao đẳng/THPT...), Chuyên ngành, GPA/Điểm trung bình (nếu có)]
- **Khả năng ngoại ngữ:** [Ngôn ngữ, tên chứng chỉ, mức độ sử dụng thực tế]

# PHÂN TÍCH CHUYÊN SÂU SO VỚI JD
- **Điểm mạnh (Strengths):** [Liệt kê ngắn gọn các kinh nghiệm, kỹ năng hoàn toàn match với JD]
- **Điểm yếu / Khoảng trống (Weaknesses):** [Các yêu cầu JD có mà CV thiếu, rủi ro tiềm ẩn]
- **Điểm nổi bật khác (Highlights):** [Các thành tích hoặc kỹ năng đặc biệt làm ứng viên này sáng giá]`
             });
          }
      } else {
          if (cvDataArray.length > 1) {
             parts.push({
                text: `Bạn là một Headhunter (Chuyên gia tuyển dụng) có nhiều năm kinh nghiệm. Dưới góc nhìn chuyên sâu, hãy đọc kỹ và phân tích ${cvDataArray.length} CV này (không có JD).
Hãy so sánh nhanh điểm mạnh và điểm yếu giữa các ứng viên này để tìm ra ai là người nổi bật nhất.
Trình bày báo cáo theo format chuyên nghiệp, súc tích (sử dụng Markdown). NGẮN GỌN VÀ NHẮM TRÚNG TRỌNG TÂM. Tuyệt đối KHÔNG sử dụng các biểu tượng (emoji) không cần thiết, trừ khi thực sự cần để làm nổi bật thông tin quan trọng:

# SO SÁNH TỔNG QUAN XẾP HẠNG
*Sắp xếp theo thứ tự đánh giá từ cao xuống thấp (kinh nghiệm/năng lực chung)*
1. **[Tên ứng viên 1]** - [Mô tả ngắn 1 câu về điểm mạnh nổi bật nhất]
2. **[Tên ứng viên 2]** - [Mô tả ngắn 1 câu về điểm mạnh nổi bật nhất]
...

---

*(Sau đó, với MỖI ứng viên, trình bày ngắn gọn)*

## [Tên Ứng Viên]
- **Mức độ cạnh tranh thị trường:** [Cao / Khá / Trung bình / Thấp]
- **Kinh nghiệm cốt lõi:** [Số năm, chuyên môn chính]
- **Điểm mạnh:** [Những kỹ năng lõi vững chắc (Ngắn gọn)]
- **Rủi ro:** [Lỗ hổng kinh nghiệm (nếu có)]
- **Lời khuyên:** [Điều cần cải thiện tối đa 2 câu]`
             });
          } else {
             parts.push({
                text: `Bạn là một Headhunter (Chuyên gia tuyển dụng) có nhiều năm kinh nghiệm. Dưới góc nhìn chuyên sâu, hãy đọc kỹ và phân tích CV này.
Hãy trình bày báo cáo đánh giá theo format từng tầng thông tin rõ ràng, chuyên nghiệp, súc tích (sử dụng Markdown, in đậm, gạch đầu dòng). NGẮN GỌN VÀ NHẮM TRÚNG TRỌNG TÂM. Tuyệt đối KHÔNG sử dụng các biểu tượng (emoji) không cần thiết, trừ khi thực sự cần để làm nổi bật thông tin quan trọng:

# NHẬN ĐỊNH TỔNG QUAN
*HÃY TÔ ĐẬM VÀ LÀM NỔI BẬT PHẦN NÀY*
- **Mức độ cạnh tranh (Thẩm định nhanh):** [Cao / Khá / Trung bình / Thấp - Dựa trên thị trường chung]
- **Loại hình vị trí phù hợp nhất:** [Gợi ý các công việc phù hợp năng lực]
- **Lời khuyên cho ứng viên:** [Điều cần cải thiện ngắn gọn (Tối đa 2 câu)]

# THÔNG TIN CÁ NHÂN & NỀN TẢNG
- **Giới tính:** [Nam/Nữ/Không rõ]
- **Ngày/tháng/năm sinh:** [Ngày sinh hoặc Không có thông tin]
- **Số năm kinh nghiệm làm việc:** [Tổng số năm kinh nghiệm sát với chuyên môn]
- **Trình độ học vấn:** [Tên trường học (VD: Đại học/Cao đẳng/THPT...), Chuyên ngành, GPA/Điểm trung bình (nếu có)]
- **Khả năng ngoại ngữ:** [Ngôn ngữ, tên chứng chỉ, mức độ sử dụng thực tế]

# PHÂN TÍCH CHUYÊN MÔN
- **Điểm mạnh (Strengths):** [Những kỹ năng, kinh nghiệm lõi vững chắc nhất (Ngắn gọn)]
- **Nhược điểm / Rủi ro tiềm ẩn (Weaknesses):** [Những lỗ hổng kinh nghiệm, job hopping, v.v.]
- **Điểm nổi bật khác (Highlights):** [Công ty lớn từng làm, thành tựu cụ thể, tính cách thể hiện qua CV]`
             });
          }
      }

      const response = await getAI().models.generateContent({
        model: modelToUse,
        contents: parts
      });
      
      currentModelIndex = (currentModelIndex + attempts) % FALLBACK_MODELS.length;
      return response.text?.trim() || "Không lấy được thông tin";
    } catch (error: any) {
      console.warn(`Gemini cv read error with model ${modelToUse}:`, error);
      attempts++;
    }
  }
  
  return "Đã xảy ra lỗi khi đọc CV qua dịch vụ AI.";
};
