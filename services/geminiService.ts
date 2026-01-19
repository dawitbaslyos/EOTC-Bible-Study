
import { GoogleGenAI } from "@google/genai";
import { ChatMessage } from "../types";

// Always use the process.env.API_KEY string directly when initializing the client instance
const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

const SYSTEM_INSTRUCTION = `
  You are a knowledgeable companion and helper specialized in the history, theology, and liturgical practices of the Ethiopian Orthodox Tewahedo Church. 
  Your goal is to provide clear, insightful, and accessible information rooted in the "Haymanot Abew" and "Andimta" commentaries.
  
  Guidelines:
  1. Act as a helpful guide rather than a distant authority figure.
  2. Use clear, modern language while respecting traditional depth.
  3. When explaining concepts, link them to church history (e.g., St. Yared's chants or the 9 Saints) where relevant.
  4. Acknowledge the richness of the Tewahedo tradition with a scholarly yet warm tone.
  5. Keep responses informative and concise.
  6. Use traditional terms like "Tewahedo," "Qine," or "Mister" only when they add clarity to the explanation.
`;

export const getSpiritualReflection = async (messages: ChatMessage[], verseContext: string) => {
  try {
    const contents = messages.map(m => {
      const parts: any[] = [{ text: m.content }];
      if (m.attachment?.type === 'audio' && m.attachment.data && m.attachment.mimeType) {
        parts.push({
          inlineData: {
            mimeType: m.attachment.mimeType,
            data: m.attachment.data
          }
        });
      }
      return {
        role: m.role === 'user' ? 'user' : 'model',
        parts
      };
    });

    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents,
      config: {
        systemInstruction: SYSTEM_INSTRUCTION,
        temperature: 0.7,
        topP: 0.9,
      },
    });

    return response.text;
  } catch (error) {
    console.error("Gemini Error:", error);
    return "I apologize, I'm having trouble connecting to the records. Let's try reflecting on the topic again in a moment.";
  }
};

export const getSpiritualReflectionStream = async (messages: ChatMessage[], verseContext: string) => {
  const contents = messages.map(m => {
    const parts: any[] = [{ text: m.content || "Reflect on this input." }];
    if (m.attachment?.type === 'audio' && m.attachment.data && m.attachment.mimeType) {
      parts.push({
        inlineData: {
          mimeType: m.attachment.mimeType,
          data: m.attachment.data
        }
      });
    }
    return {
      role: m.role === 'user' ? 'user' : 'model',
      parts
    };
  });

  const stream = await ai.models.generateContentStream({
    model: 'gemini-3-flash-preview',
    contents,
    config: {
      systemInstruction: SYSTEM_INSTRUCTION,
      temperature: 0.7,
      topP: 0.9,
    },
  });
  return stream;
};
