
import { GoogleGenAI } from "@google/genai";
import { ChatMessage } from "../types";

// Always use the process.env.API_KEY string directly when initializing the client instance
const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

export const getSpiritualReflection = async (messages: ChatMessage[], verseContext: string) => {
  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: messages.map(m => ({
        role: m.role === 'user' ? 'user' : 'model',
        parts: [{ text: m.content }]
      })),
      config: {
        systemInstruction: `
          You are "Memhir," a wise Ethiopian Orthodox theologian and spiritual guide. 
          Your wisdom is rooted in the "Haymanot Abew" (Faith of the Fathers) and "Andimta" (Commentary).
          The user has just finished reading this passage: ${verseContext}.
          
          Guidelines:
          1. Be empathetic, patient, and non-judgmental.
          2. Use traditional metaphors (e.g., refer to St. Yared, St. Cyril, or the Desert Fathers).
          3. When discussing difficulties in scripture, acknowledge the "Mystery" (Mister) and suggest that understanding comes through spiritual practice, not just logic.
          4. Keep responses profound but concise.
          5. If appropriate, use Ge'ez or Amharic terms like "Hluna" (consciousness/will), "Qal" (The Word), or "Kibur" (Honored/Glorious).
        `,
        temperature: 0.8,
        topP: 0.95,
      },
    });

    // The text property returns the string output directly (not a method)
    return response.text;
  } catch (error) {
    console.error("Gemini Error:", error);
    return "Forgive me, my child. The path of understanding is sometimes clouded. Let us reflect on the silence of the heart.";
  }
};
