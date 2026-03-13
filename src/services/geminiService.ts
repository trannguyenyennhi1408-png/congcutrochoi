import { GoogleGenAI } from "@google/genai";

const FALLBACK_MODELS = [
  'gemini-3-flash-preview',
  'gemini-3-pro-preview',
  'gemini-2.5-flash'
];

export async function callGeminiAI(prompt: string, apiKey: string, modelId: string = "gemini-3-pro-preview") {
  if (!apiKey) {
    throw new Error('Vui lòng nhập API Key trong phần Cài đặt!');
  }

  const ai = new GoogleGenAI({ apiKey });
  
  // Create a list of models to try: first the requested one, then the fallbacks in order
  const modelsToTry = [modelId, ...FALLBACK_MODELS.filter(m => m !== modelId)];
  
  let lastError: any;

  for (const model of modelsToTry) {
    try {
      const response = await ai.models.generateContent({
        model: model,
        contents: prompt,
        config: {
          temperature: 0.7,
          topP: 0.95,
          topK: 40,
        }
      });

      return response.text || '';
    } catch (error: any) {
      console.warn(`Model ${model} failed, testing next fallback:`, error);
      lastError = error;
      // loop continues to next fallback model
    }
  }

  // If all models fail
  console.error('All Gemini models failed:', lastError);
  if (lastError?.message?.includes('429') || lastError?.message?.includes('RESOURCE_EXHAUSTED')) {
    throw new Error(`429 RESOURCE_EXHAUSTED - Quá tải yêu cầu (Rate limit). Vui lòng thử lại sau.`);
  }
  throw new Error(`${lastError?.message || 'Lỗi API không xác định'}`);
}

export const PROMPTS = {
  EXPLAIN_QUESTION: (question: string, answer: string) => 
    `Giải thích tại sao đáp án "${answer}" là đúng cho câu hỏi: "${question}". Hãy giải thích ngắn gọn, dễ hiểu cho học sinh.`,
  
  GENERATE_QUESTIONS: (topic: string, count: number = 5) => 
    `Hãy tạo ${count} câu hỏi trắc nghiệm về chủ đề "${topic}". 
    Trả về kết quả dưới dạng JSON array với cấu trúc: 
    [{"content": "câu hỏi", "options": ["A", "B", "C", "D"], "correctAnswer": "đáp án đúng", "explanation": "giải thích", "difficulty": "easy/medium/hard"}]`,
    
  AI_TUTOR: (userMessage: string, context: string = "") => 
    `Bạn là một gia sư AI thân thiện. Hãy trả lời câu hỏi của học sinh: "${userMessage}". 
    Ngữ cảnh hiện tại: ${context}. Hãy giải thích một cách sư phạm và khuyến khích học sinh.`
};
