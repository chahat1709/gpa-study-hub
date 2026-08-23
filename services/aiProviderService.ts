/**
 * Unified AI Provider Service
 * Supports: Gemini (Google) + OpenCode Zen (MiMo V2.5 Free) + any OpenAI-compatible API
 */

import { GoogleGenAI, GenerateContentResponse, Chat } from '@google/genai';

export type AIProvider = 'gemini' | 'opencode-zen' | 'custom';

interface ProviderConfig {
  id: AIProvider;
  name: string;
  endpoint?: string;
  model?: string;
}

export const PROVIDERS: Record<AIProvider, ProviderConfig> = {
  gemini: {
    id: 'gemini',
    name: 'Google Gemini',
    model: 'gemini-3-pro-preview',
  },
  'opencode-zen': {
    id: 'opencode-zen',
    name: 'OpenCode Zen (MiMo V2.5 Free)',
    endpoint: 'https://opencode.ai/zen/v1/chat/completions',
    model: 'mimo-v2.5-free',
  },
  custom: {
    id: 'custom',
    name: 'Custom OpenAI-Compatible',
  },
};

const STORAGE_KEY_PROVIDER = 'GPA_HUB_AI_PROVIDER';
const STORAGE_KEY_GEMINI = 'USER_GEMINI_API_KEY';
const STORAGE_KEY_ZEN = 'USER_ZEN_API_KEY';
const STORAGE_KEY_CUSTOM_URL = 'GPA_HUB_CUSTOM_AI_URL';
const STORAGE_KEY_CUSTOM_KEY = 'GPA_HUB_CUSTOM_AI_KEY';
const STORAGE_KEY_CUSTOM_MODEL = 'GPA_HUB_CUSTOM_AI_MODEL';

// ─── Provider Selection ────────────────────────────────────────────────────
export function getSelectedProvider(): AIProvider {
  const stored = localStorage.getItem(STORAGE_KEY_PROVIDER);
  if (stored && stored in PROVIDERS) return stored as AIProvider;
  // Auto-detect: if Zen key exists, use it; else default to gemini
  if (localStorage.getItem(STORAGE_KEY_ZEN)) return 'opencode-zen';
  return 'gemini';
}

export function setSelectedProvider(provider: AIProvider): void {
  localStorage.setItem(STORAGE_KEY_PROVIDER, provider);
}

// ─── API Key Management ────────────────────────────────────────────────────
export function getGeminiApiKey(): string {
  if (import.meta.env.VITE_GEMINI_API_KEY) return import.meta.env.VITE_GEMINI_API_KEY;
  return localStorage.getItem(STORAGE_KEY_GEMINI) || '';
}

export function setGeminiApiKey(key: string): void {
  localStorage.setItem(STORAGE_KEY_GEMINI, key);
}

export function getZenApiKey(): string {
  return localStorage.getItem(STORAGE_KEY_ZEN) || '';
}

export function setZenApiKey(key: string): void {
  localStorage.setItem(STORAGE_KEY_ZEN, key);
}

export function getCustomConfig(): { url: string; key: string; model: string } {
  return {
    url: localStorage.getItem(STORAGE_KEY_CUSTOM_URL) || '',
    key: localStorage.getItem(STORAGE_KEY_CUSTOM_KEY) || '',
    model: localStorage.getItem(STORAGE_KEY_CUSTOM_MODEL) || '',
  };
}

export function setCustomConfig(url: string, key: string, model: string): void {
  localStorage.setItem(STORAGE_KEY_CUSTOM_URL, url);
  localStorage.setItem(STORAGE_KEY_CUSTOM_KEY, key);
  localStorage.setItem(STORAGE_KEY_CUSTOM_MODEL, model);
}

// ─── Unified Key Check ─────────────────────────────────────────────────────
export function hasAnyApiKey(): boolean {
  if (window.aistudio) return true; // Gemini via AI Studio
  if (getGeminiApiKey()) return true;
  if (getZenApiKey()) return true;
  const custom = getCustomConfig();
  if (custom.url && custom.key) return true;
  return false;
}

export function getCurrentApiKey(): string {
  const provider = getSelectedProvider();
  switch (provider) {
    case 'gemini':
      return getGeminiApiKey();
    case 'opencode-zen':
      return getZenApiKey();
    case 'custom':
      return getCustomConfig().key;
    default:
      return '';
  }
}

// ─── Chat Session (Gemini-specific) ────────────────────────────────────────
let geminiChatSession: Chat | null = null;

export function createGeminiChatSession(systemInstruction?: string): Chat {
  const apiKey = getGeminiApiKey();
  const ai = new GoogleGenAI({ apiKey: apiKey || 'dummy_key' });
  return ai.chats.create({
    model: PROVIDERS.gemini.model!,
    config: {
      systemInstruction,
      thinkingConfig: { thinkingBudget: 4096 },
    },
  });
}

// ─── OpenAI-Compatible Fetch ────────────────────────────────────────────────
interface OpenAIMessage {
  role: 'system' | 'user' | 'assistant';
  content: string | Array<{ type: string; text?: string; image_url?: { url: string } }>;
}

interface OpenAIResponse {
  choices: Array<{ message: { content: string }; delta?: { content: string } }>;
}

async function fetchOpenAICompatible(
  endpoint: string,
  apiKey: string,
  model: string,
  messages: OpenAIMessage[],
  maxTokens = 2048
): Promise<string> {
  const response = await fetch(endpoint, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model,
      messages,
      max_tokens: maxTokens,
    }),
  });

  if (!response.ok) {
    const errText = await response.text().catch(() => '');
    throw new Error(`API error ${response.status}: ${errText}`);
  }

  const data: OpenAIResponse = await response.json();
  return data.choices[0]?.message?.content || '';
}

// ─── Unified Send Message ──────────────────────────────────────────────────
export interface ChatMessage {
  role: 'user' | 'assistant' | 'system';
  content: string;
}

export async function sendChatMessage(
  messages: ChatMessage[],
  systemPrompt?: string
): Promise<string> {
  const provider = getSelectedProvider();

  if (provider === 'gemini') {
    return sendGeminiMessage(messages, systemPrompt);
  }

  // OpenAI-compatible (Zen, Custom)
  return sendOpenAIMessage(messages, systemPrompt);
}

async function sendGeminiMessage(messages: ChatMessage[], systemPrompt?: string): Promise<string> {
  try {
    const apiKey = getGeminiApiKey();
    if (!apiKey && !window.aistudio) throw new Error('No Gemini API key');

    const ai = new GoogleGenAI({ apiKey: apiKey || 'dummy_key' });
    const contents = messages
      .filter(m => m.role !== 'system')
      .map(m => ({
        role: m.role === 'assistant' ? ('model' as const) : ('user' as const),
        parts: [{ text: m.content }],
      }));

    const response: GenerateContentResponse = await ai.models.generateContent({
      model: PROVIDERS.gemini.model!,
      contents,
      config: {
        systemInstruction:
          systemPrompt ||
          'You are a professional study tutor for GTU diploma students. Be helpful, concise, and academic.',
        thinkingConfig: { thinkingBudget: 2048 },
      },
    });
    return response.text || '';
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : String(error);
    if (msg.includes('429')) return 'System Busy: Rate limit exceeded. Try again shortly.';
    return 'AI Tutor is temporarily unavailable. Please try again.';
  }
}

async function sendOpenAIMessage(messages: ChatMessage[], systemPrompt?: string): Promise<string> {
  const provider = getSelectedProvider();

  let endpoint = '';
  let apiKey = '';
  let model = '';

  if (provider === 'opencode-zen') {
    endpoint = PROVIDERS['opencode-zen'].endpoint!;
    apiKey = getZenApiKey();
    model = PROVIDERS['opencode-zen'].model!;
  } else if (provider === 'custom') {
    const custom = getCustomConfig();
    endpoint = custom.url;
    apiKey = custom.key;
    model = custom.model;
  }

  if (!endpoint || !apiKey || !model) {
    return 'AI configuration incomplete. Please check your settings.';
  }

  try {
    const openMessages: OpenAIMessage[] = [];
    if (systemPrompt) {
      openMessages.push({ role: 'system', content: systemPrompt });
    }
    for (const msg of messages) {
      openMessages.push({ role: msg.role as 'user' | 'assistant', content: msg.content });
    }

    return await fetchOpenAICompatible(endpoint, apiKey, model, openMessages);
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : String(error);
    if (msg.includes('429')) return 'Rate limit exceeded. Please try again shortly.';
    return 'AI Tutor is temporarily unavailable. Please try again.';
  }
}

// ─── Image Analysis ────────────────────────────────────────────────────────
export async function analyzeImage(base64Image: string, prompt: string): Promise<string> {
  const provider = getSelectedProvider();

  if (provider === 'gemini') {
    try {
      const apiKey = getGeminiApiKey();
      if (!apiKey && !window.aistudio) throw new Error('No Gemini API key');

      const ai = new GoogleGenAI({ apiKey: apiKey || 'dummy_key' });
      const base64Data = base64Image.replace(/^data:image\/\w+;base64,/, '');

      const response: GenerateContentResponse = await ai.models.generateContent({
        model: PROVIDERS.gemini.model!,
        contents: {
          parts: [{ inlineData: { mimeType: 'image/jpeg', data: base64Data } }, { text: prompt }],
        },
        config: {
          maxOutputTokens: 1000,
          thinkingConfig: { thinkingBudget: 500 },
        },
      });
      return response.text || 'No analysis generated.';
    } catch {
      return 'Visual analysis failed. Ensure image is clear.';
    }
  }

  // OpenAI-compatible vision
  const config =
    provider === 'opencode-zen'
      ? {
          endpoint: PROVIDERS['opencode-zen'].endpoint!,
          key: getZenApiKey(),
          model: PROVIDERS['opencode-zen'].model!,
        }
      : {
          endpoint: getCustomConfig().url,
          key: getCustomConfig().key,
          model: getCustomConfig().model,
        };

  try {
    const messages: OpenAIMessage[] = [
      {
        role: 'user',
        content: [
          { type: 'image_url', image_url: { url: base64Image } },
          { type: 'text', text: prompt },
        ],
      },
    ];
    return await fetchOpenAICompatible(config.endpoint, config.key, config.model, messages, 1000);
  } catch {
    return 'Visual analysis failed. Ensure image is clear.';
  }
}

// ─── Social Agent Response ─────────────────────────────────────────────────
export async function generateSocialAgentResponse(
  userMessage: string,
  context?: string
): Promise<string> {
  const socialPrompt = `You are an AI Moderator inside a professional student campus forum.
Instruction:
1. Be professional, helpful, and brief (1 sentence).
2. SAFETY: If the user message is vulgar, offensive, sexually explicit, or inappropriate for a campus setting, DO NOT answer. Instead reply: "This system is for academic purposes. Your message has been flagged for review."
${context ? `Context: ${context}` : ''}
User Message: "${userMessage}"`;

  try {
    return await sendChatMessage([{ role: 'user', content: socialPrompt }]);
  } catch {
    return 'Campus Agent is currently syncing.';
  }
}

// ─── Text Generation ───────────────────────────────────────────────────────
export async function generateTextContent(prompt: string): Promise<string> {
  try {
    return await sendChatMessage([{ role: 'user', content: prompt }]);
  } catch {
    return 'Unable to generate content at this time.';
  }
}
