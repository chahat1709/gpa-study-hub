
import { GoogleGenAI, GenerateContentResponse, Chat } from "@google/genai";

const MODEL_PRO = 'gemini-3-pro-preview';

export const getStoredApiKey = (): string => {
  // 1. Try Environment Variable (For dev/hosting)
  if (import.meta.env.VITE_GEMINI_API_KEY) return import.meta.env.VITE_GEMINI_API_KEY;
  
  // 2. Try Local Storage (For manual user entry)
  const stored = localStorage.getItem('USER_GEMINI_API_KEY');
  if (stored) return stored;

  return '';
};

export const createChatSession = (systemInstruction?: string): Chat => {
  const apiKey = getStoredApiKey();
  const ai = new GoogleGenAI({ apiKey: apiKey || 'dummy_key' }); // Prevent crash on init
  return ai.chats.create({
    model: MODEL_PRO,
    config: {
      systemInstruction,
      thinkingConfig: { thinkingBudget: 4096 },
    },
  });
};

export const generateSocialAgentResponse = async (userMessage: string, context?: string): Promise<string> => {
  try {
    const apiKey = getStoredApiKey();
    if (!apiKey) return "AI Agent Offline (Key Missing)";

    const ai = new GoogleGenAI({ apiKey });
    const socialPrompt = `
      You are an AI Moderator inside a professional student campus forum.
      Instruction: 
      1. Be professional, helpful, and brief (1 sentence).
      2. SAFETY: If the user message is vulgar, offensive, sexually explicit, or inappropriate for a campus setting, DO NOT answer the question. Instead, reply with a firm warning: "This system is for academic purposes. Your message has been flagged for review."
      
      User Message: "${userMessage}"
    `;

    const response: GenerateContentResponse = await ai.models.generateContent({
      model: MODEL_PRO,
      contents: socialPrompt,
      config: {
        maxOutputTokens: 200,
        thinkingConfig: { thinkingBudget: 100 } 
      }
    });
    return response.text || "Synchronized.";
  } catch {
    return "Campus Agent is currently syncing.";
  }
};

export const generateTextContent = async (prompt: string): Promise<string> => {
  try {
    const apiKey = getStoredApiKey();
    if (!apiKey) throw new Error("API Key missing");

    const ai = new GoogleGenAI({ apiKey });
    const response: GenerateContentResponse = await ai.models.generateContent({
      model: MODEL_PRO,
      contents: prompt,
      config: {
        thinkingConfig: { thinkingBudget: 2048 }
      }
    });
    return response.text || "No response generated.";
  } catch (error: any) {
    if (error.message?.includes('429')) return "System Busy: Rate limit exceeded.";
    return "Unable to generate content at this time.";
  }
};

export const analyzeImageContent = async (base64Image: string, prompt: string): Promise<string> => {
  try {
    const apiKey = getStoredApiKey();
    if (!apiKey) throw new Error("API Key missing");

    const ai = new GoogleGenAI({ apiKey });
    const base64Data = base64Image.replace(/^data:image\/\w+;base64,/, "");

    const response: GenerateContentResponse = await ai.models.generateContent({
      model: MODEL_PRO,
      contents: {
        parts: [
          {
            inlineData: {
              mimeType: 'image/jpeg',
              data: base64Data,
            },
          },
          {
            text: prompt,
          },
        ],
      },
      config: {
        maxOutputTokens: 1000,
        thinkingConfig: { thinkingBudget: 500 }
      }
    });
    return response.text || "No analysis generated.";
  } catch (error: any) {
    if (error.message?.includes('429')) return "High Traffic: Please try scanning again in a moment.";
    return "Visual analysis failed. Ensure image is clear.";
  }
};
