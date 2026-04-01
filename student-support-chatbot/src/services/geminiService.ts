import { GoogleGenAI, Type } from "@google/genai";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY || "" });

export interface ChatMessage {
  role: "user" | "model";
  text: string;
  timestamp: number;
}

export interface ExtractedEntities {
  dates?: string[];
  courseCodes?: string[];
  semesterNumbers?: string[];
}

export interface ChatResponse {
  answer: string;
  entities: ExtractedEntities;
  isOutOfScope: boolean;
  suggestedAction?: string;
}

const SYSTEM_INSTRUCTION = `You are a Student Support Assistant. 
Your tasks:
1. Extract entities: dates, course codes (e.g., CS101, MATH202), and semester numbers (e.g., sem 5, third year).
2. Answer student questions accurately.
3. If a question is unclear or out-of-scope (not related to university, exams, courses, or student life), ask for clarification or suggest contacting the help desk at helpdesk@university.edu.
4. Maintain a helpful and professional tone.
5. For multi-turn conversations, use the provided history to understand context.

Return your response in JSON format with the following structure:
{
  "answer": "The response text",
  "entities": {
    "dates": ["list of dates found"],
    "courseCodes": ["list of course codes"],
    "semesterNumbers": ["list of semester numbers"]
  },
  "isOutOfScope": boolean,
  "suggestedAction": "optional suggestion or link"
}`;

export async function getChatResponse(message: string, history: ChatMessage[]): Promise<ChatResponse> {
  const model = "gemini-3-flash-preview";
  
  const contents = [
    ...history.map(m => ({
      role: m.role,
      parts: [{ text: m.text }]
    })),
    {
      role: "user",
      parts: [{ text: message }]
    }
  ];

  try {
    const response = await ai.models.generateContent({
      model,
      contents,
      config: {
        systemInstruction: SYSTEM_INSTRUCTION,
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            answer: { type: Type.STRING },
            entities: {
              type: Type.OBJECT,
              properties: {
                dates: { type: Type.ARRAY, items: { type: Type.STRING } },
                courseCodes: { type: Type.ARRAY, items: { type: Type.STRING } },
                semesterNumbers: { type: Type.ARRAY, items: { type: Type.STRING } }
              }
            },
            isOutOfScope: { type: Type.BOOLEAN },
            suggestedAction: { type: Type.STRING }
          },
          required: ["answer", "entities", "isOutOfScope"]
        }
      }
    });

    const result = JSON.parse(response.text || "{}");
    return result as ChatResponse;
  } catch (error) {
    console.error("Error calling Gemini:", error);
    return {
      answer: "I'm sorry, I encountered an error processing your request.",
      entities: {},
      isOutOfScope: false
    };
  }
}
