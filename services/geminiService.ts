import { GoogleGenAI } from '@google/genai';
import { ChatMessage } from '../types';

/** Injected by Vite `define` (may be "" if GEMINI_API_KEY is not set). */
const RESOLVED_API_KEY = String(process.env.API_KEY ?? '').trim();

let aiSingleton: GoogleGenAI | null = null;

function getAI(): GoogleGenAI | null {
  if (!RESOLVED_API_KEY) return null;
  if (!aiSingleton) {
    aiSingleton = new GoogleGenAI({ apiKey: RESOLVED_API_KEY });
  }
  return aiSingleton;
}

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
  const ai = getAI();
  if (!ai) {
    return "Guidance isn't available yet (no API key). You can still read and reflect in the app.";
  }
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
  const ai = getAI();
  if (!ai) {
    async function* noKeyStream(): AsyncGenerator<{ text?: string }> {
      yield {
        text: "Guidance needs a Gemini API key. Add GEMINI_API_KEY to your .env file, then run npm run build (or dev) again."
      };
    }
    return noKeyStream();
  }

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
