export type Role = 'user' | 'assistant' | 'system';

export interface Message {
  id?: string;
  role: Role;
  content: string;
  timestamp?: number;
}

export interface Model {
  id: string;
  name: string;
  provider: string;
  contextWindow?: number;
  description?: string;
  recommended?: boolean;
  isCustomServer?: boolean;
  type?: 'text' | 'audio' | 'vision';
}

export interface Conversation {
  id: string;
  name: string;
  messages: Message[];
  model: string;
  prompt: string;
  temperature: number;
  folderId: string | null;
  createdAt?: number;
  updatedAt?: number;
}

export type FolderType = 'chat' | 'prompt';

export interface Folder {
  id: string;
  name: string;
  type: FolderType;
}

export interface Prompt {
  id: string;
  name: string;
  description: string;
  content: string;
  folderId: string | null;
  model?: string;
}

export interface ServerModelInfo {
  id: string;
  name: string;
  type?: 'text' | 'audio' | 'vision';
  size?: string;
}

export interface CustomServerConfig {
  enabled: boolean;
  baseUrl: string;
  apiKey: string;
  modelName: string;
  availableModels?: ServerModelInfo[];
}

export interface MemoryItem {
  id: string;
  content: string;
  category: 'preference' | 'fact' | 'instruction';
  enabled: boolean;
  createdAt: number;
}

export interface WorkflowStep {
  id: string;
  title: string;
  description: string;
  systemPrompt: string;
  promptTemplate: string; // supports {{input}}, {{previous_step}}, {{step_1_output}} etc.
  model?: string;
}

export interface Workflow {
  id: string;
  name: string;
  description: string;
  icon?: string;
  steps: WorkflowStep[];
}

export interface LowCodeNode {
  id: string;
  type: 'prompt' | 'filter' | 'model' | 'json' | 'output';
  label: string;
  config: {
    promptText?: string;
    modelId?: string;
    filterCondition?: string;
  };
}

export interface LowCodeConnection {
  from: string;
  to: string;
}

export interface AppSettings {
  theme: 'dark' | 'light';
  defaultModel: string;
  defaultSystemPrompt: string;
  defaultTemperature: number;
  language: 'en' | 'fa';
  enableStream: boolean;
  memoryEnabled: boolean;
  thinkModeEnabled: boolean;
  thinkModeMarkdown: boolean;
  memories: MemoryItem[];
  customServer: CustomServerConfig;
}

export interface ExportDataFormat {
  version: number;
  history: Conversation[];
  folders: Folder[];
  prompts: Prompt[];
  memories?: MemoryItem[];
  workflows?: Workflow[];
}
