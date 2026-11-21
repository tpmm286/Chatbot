import { AppSettings, Conversation, ExportDataFormat, Folder, Prompt } from '../types/chat';
import { DEFAULT_SETTINGS, DEFAULT_SYSTEM_PROMPT, INITIAL_PROMPTS } from './constants';

const CONVERSATIONS_KEY = 'chatbot_ui_conversations';
const SELECTED_ID_KEY = 'chatbot_ui_selected_id';
const FOLDERS_KEY = 'chatbot_ui_folders';
const PROMPTS_KEY = 'chatbot_ui_prompts';
const SETTINGS_KEY = 'chatbot_ui_settings';
const scopedKey = (key: string) => `chatbot_ui_${localStorage.getItem('chatbot_ui_active_user') || 'anonymous'}_${key.replace('chatbot_ui_', '')}`;

export function getInitialConversations(): Conversation[] {
  try {
    const raw = localStorage.getItem(scopedKey(CONVERSATIONS_KEY));
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) return parsed;
    }
  } catch (e) {
    console.warn('Failed to load conversations from localStorage', e);
  }

  // Create default first conversation
  const defaultConv: Conversation = {
    id: 'conv-' + Date.now(),
    name: 'New Chat',
    messages: [],
    model: 'gemini-3.8-flash',
    prompt: DEFAULT_SYSTEM_PROMPT,
    temperature: 0.7,
    folderId: null,
    createdAt: Date.now(),
    updatedAt: Date.now(),
  };
  return [defaultConv];
}

export function saveConversationsToStorage(conversations: Conversation[]) {
  try {
    localStorage.setItem(scopedKey(CONVERSATIONS_KEY), JSON.stringify(conversations));
  } catch (e) {
    console.warn('Failed to save conversations to localStorage', e);
  }
}

export function getInitialSelectedId(conversations: Conversation[]): string {
  try {
    const saved = localStorage.getItem(scopedKey(SELECTED_ID_KEY));
    if (saved && conversations.some((c) => c.id === saved)) {
      return saved;
    }
  } catch (e) {
    console.warn('Failed to load selected ID', e);
  }
  return conversations[0]?.id || '';
}

export function saveSelectedIdToStorage(id: string) {
  try {
    localStorage.setItem(scopedKey(SELECTED_ID_KEY), id);
  } catch (e) {
    console.warn('Failed to save selected ID', e);
  }
}

export function getInitialFolders(): Folder[] {
  try {
    const raw = localStorage.getItem(scopedKey(FOLDERS_KEY));
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) return parsed;
    }
  } catch (e) {
    console.warn('Failed to load folders', e);
  }
  return [
    { id: 'folder-general', name: 'Work & Projects', type: 'chat' },
    { id: 'folder-prompts', name: 'Saved Prompts', type: 'prompt' },
  ];
}

export function saveFoldersToStorage(folders: Folder[]) {
  try {
    localStorage.setItem(scopedKey(FOLDERS_KEY), JSON.stringify(folders));
  } catch (e) {
    console.warn('Failed to save folders', e);
  }
}

export function getInitialPrompts(): Prompt[] {
  try {
    const raw = localStorage.getItem(scopedKey(PROMPTS_KEY));
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) return parsed;
    }
  } catch (e) {
    console.warn('Failed to load prompts', e);
  }
  return INITIAL_PROMPTS;
}

export function savePromptsToStorage(prompts: Prompt[]) {
  try {
    localStorage.setItem(scopedKey(PROMPTS_KEY), JSON.stringify(prompts));
  } catch (e) {
    console.warn('Failed to save prompts', e);
  }
}

export function getInitialSettings(): AppSettings {
  try {
    const raw = localStorage.getItem(scopedKey(SETTINGS_KEY));
    if (raw) {
      const parsed = JSON.parse(raw);
      return {
        ...DEFAULT_SETTINGS,
        ...parsed,
        language: parsed.language || DEFAULT_SETTINGS.language,
        customServer: {
          ...DEFAULT_SETTINGS.customServer,
          ...(parsed.customServer || {}),
        },
        memories: Array.isArray(parsed.memories)
          ? parsed.memories
          : DEFAULT_SETTINGS.memories,
      };
    }
  } catch (e) {
    console.warn('Failed to load settings', e);
  }
  return DEFAULT_SETTINGS;
}

export function saveSettingsToStorage(settings: AppSettings) {
  try {
    localStorage.setItem(scopedKey(SETTINGS_KEY), JSON.stringify(settings));
  } catch (e) {
    console.warn('Failed to save settings', e);
  }
}

/**
 * Parses {{variable_name}} tokens from prompt template content
 */
export function extractVariables(content: string): string[] {
  const matches = content.match(/\{\{([a-zA-Z0-9_-]+)\}\}/g);
  if (!matches) return [];
  const uniqueVars = Array.from(
    new Set(matches.map((m) => m.replace(/\{\{|\}\}/g, '').trim()))
  );
  return uniqueVars;
}

/**
 * Replaces {{variable_name}} tokens with provided key-value map
 */
export function interpolateVariables(
  content: string,
  values: Record<string, string>
): string {
  let result = content;
  for (const [key, value] of Object.entries(values)) {
    const regex = new RegExp(`\\{\\{${key}\\}\\}`, 'g');
    result = result.replace(regex, value);
  }
  return result;
}

/**
 * Export full Chatbot UI dataset
 */
export function exportData(
  conversations: Conversation[],
  folders: Folder[],
  prompts: Prompt[]
) {
  const data: ExportDataFormat = {
    version: 4,
    history: conversations,
    folders,
    prompts,
  };
  const jsonString = `data:text/json;charset=utf-8,${encodeURIComponent(
    JSON.stringify(data, null, 2)
  )}`;
  const downloadAnchor = document.createElement('a');
  downloadAnchor.setAttribute('href', jsonString);
  const date = new Date().toISOString().slice(0, 10);
  downloadAnchor.setAttribute('download', `chatbot_ui_export_${date}.json`);
  document.body.appendChild(downloadAnchor);
  downloadAnchor.click();
  downloadAnchor.remove();
}

/**
 * Validates and imports JSON data
 */
export function parseImportData(jsonString: string): {
  conversations?: Conversation[];
  folders?: Folder[];
  prompts?: Prompt[];
  error?: string;
} {
  try {
    const parsed = JSON.parse(jsonString);
    const conversations: Conversation[] = Array.isArray(parsed.history)
      ? parsed.history
      : [];
    const folders: Folder[] = Array.isArray(parsed.folders)
      ? parsed.folders
      : [];
    const prompts: Prompt[] = Array.isArray(parsed.prompts)
      ? parsed.prompts
      : [];

    return { conversations, folders, prompts };
  } catch (err: any) {
    return { error: err?.message || 'Invalid JSON format' };
  }
}
