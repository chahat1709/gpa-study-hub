import { GoogleGenAI, Type, FunctionDeclaration } from '@google/genai';
import { AppMode } from '../types';
import { getGeminiApiKey } from './aiProviderService';

/**
 * AGENTIC TOOLS DEFINITIONS
 * These allow the AI to actually "do" things in the app.
 */
const navigateTool: FunctionDeclaration = {
  name: 'navigate_to_feature',
  parameters: {
    type: Type.OBJECT,
    description: 'Change the current view or page of the application.',
    properties: {
      target_mode: {
        type: Type.STRING,
        description:
          'The internal mode to switch to. Options: CAMPUS, TUTOR, HOMEWORK, NOTES, SOCIAL, LIBRARY, PLANNER',
      },
    },
    required: ['target_mode'],
  },
};

const addTaskTool: FunctionDeclaration = {
  name: 'create_planner_task',
  parameters: {
    type: Type.OBJECT,
    description: 'Add a new task, assignment or deadline to the study planner.',
    properties: {
      title: { type: Type.STRING, description: 'The name of the task.' },
      priority: { type: Type.STRING, description: 'Priority level: high, medium, or low.' },
      dueDate: { type: Type.STRING, description: 'Optional due date string.' },
    },
    required: ['title', 'priority'],
  },
};

const searchLibraryTool: FunctionDeclaration = {
  name: 'search_library_resources',
  parameters: {
    type: Type.OBJECT,
    description: 'Search for PDFs, notes, or papers in the library and switch to library view.',
    properties: {
      query: { type: Type.STRING, description: 'The search term (e.g., "calculus notes").' },
    },
    required: ['query'],
  },
};

/**
 * AGENT CORE ENGINE
 */
export const runAgentCommand = async (userInput: string) => {
  // Use a fresh instance to catch the latest API key
  const ai = new GoogleGenAI({ apiKey: import.meta.env.VITE_GEMINI_API_KEY || getGeminiApiKey() });
  const model = 'gemini-3-pro-preview';

  try {
    const response = await ai.models.generateContent({
      model,
      contents: userInput,
      config: {
        systemInstruction: `You are the "Nexus AI", the agentic controller for the GPA Study Hub.
        Your goal is to HELP the user by taking actions. 
        - If the user says "Go to library", call navigate_to_feature(target_mode="LIBRARY").
        - If they say "Add homework for Friday", call create_planner_task.
        - If they just want to chat, reply briefly and offer to help with a task.
        - ALWAYS explain what you are doing.`,
        tools: [{ functionDeclarations: [navigateTool, addTaskTool, searchLibraryTool] }],
        thinkingConfig: { thinkingBudget: 4096 },
      },
    });

    const calls = response.functionCalls;
    const text = response.text || 'Action acknowledged.';

    // Emit event for the UI to catch
    if (calls && calls.length > 0) {
      calls.forEach(call => {
        window.dispatchEvent(
          new CustomEvent('AGENT_ACTION', {
            detail: { name: call.name, args: call.args },
          })
        );
      });
    }

    return text;
  } catch {
    return 'The Nexus core is temporarily offline. Please ensure your API key is correctly synced in Profile.';
  }
};
