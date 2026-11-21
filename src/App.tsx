import React, { useState, useEffect, useRef } from 'react';
import { AppSettings, Conversation, Folder, MemoryItem, Message, Model, Prompt } from './types/chat';
import {
  DEFAULT_MODELS,
  DEFAULT_SETTINGS,
} from './utils/constants';
import {
  exportData,
  extractVariables,
  getInitialConversations,
  getInitialFolders,
  getInitialPrompts,
  getInitialSelectedId,
  getInitialSettings,
  parseImportData,
  saveConversationsToStorage,
  saveFoldersToStorage,
  savePromptsToStorage,
  saveSelectedIdToStorage,
  saveSettingsToStorage,
} from './utils/storage';
import { Chatbar } from './components/Sidebar/Chatbar';
import { Promptbar } from './components/Sidebar/Promptbar';
import { Chat } from './components/Chat/Chat';
import { SettingsModal } from './components/Modals/SettingsModal';
import { SystemPromptModal } from './components/Modals/SystemPromptModal';
import { PromptModal } from './components/Modals/PromptModal';
import { VariableModal } from './components/Modals/VariableModal';
import { ChatHistoryModal } from './components/Modals/ChatHistoryModal';
import { MemoryModal } from './components/Modals/MemoryModal';
import { WorkflowModal } from './components/Modals/WorkflowModal';
import { LowCodeCanvasModal } from './components/Modals/LowCodeCanvasModal';

export default function App() {
  // State Initialization
  const [conversations, setConversations] = useState<Conversation[]>(
    getInitialConversations
  );
  const [selectedId, setSelectedId] = useState<string>(() =>
    getInitialSelectedId(conversations)
  );
  const [folders, setFolders] = useState<Folder[]>(getInitialFolders);
  const [prompts, setPrompts] = useState<Prompt[]>(getInitialPrompts);
  const [settings, setSettings] = useState<AppSettings>(getInitialSettings);
  const [models, setModels] = useState<Model[]>(DEFAULT_MODELS);

  // Sidebar toggles
  const [isLeftSidebarOpen, setIsLeftSidebarOpen] = useState(true);
  const [isRightSidebarOpen, setIsRightSidebarOpen] = useState(false);

  // Streaming state & abort controller
  const [isStreaming, setIsStreaming] = useState(false);
  const abortControllerRef = useRef<AbortController | null>(null);

  // Modals state
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isSystemPromptOpen, setIsSystemPromptOpen] = useState(false);
  const [isPromptModalOpen, setIsPromptModalOpen] = useState(false);
  const [promptToEdit, setPromptToEdit] = useState<Prompt | null>(null);
  const [isVariableModalOpen, setIsVariableModalOpen] = useState(false);
  const [activeVariablePrompt, setActiveVariablePrompt] = useState<Prompt | null>(
    null
  );
  const [isHistoryModalOpen, setIsHistoryModalOpen] = useState(false);
  const [isMemoryModalOpen, setIsMemoryModalOpen] = useState(false);
  const [isWorkflowModalOpen, setIsWorkflowModalOpen] = useState(false);
  const [isLowCodeModalOpen, setIsLowCodeModalOpen] = useState(false);

  // Sync to storage on state change
  useEffect(() => {
    saveConversationsToStorage(conversations);
  }, [conversations]);

  useEffect(() => {
    saveSelectedIdToStorage(selectedId);
  }, [selectedId]);

  useEffect(() => {
    saveFoldersToStorage(folders);
  }, [folders]);

  useEffect(() => {
    savePromptsToStorage(prompts);
  }, [prompts]);

  useEffect(() => {
    saveSettingsToStorage(settings);

    // Apply theme
    if (settings.theme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }

    // Apply RTL / LTR direction and language tag
    if (settings.language === 'fa') {
      document.documentElement.setAttribute('dir', 'rtl');
      document.documentElement.setAttribute('lang', 'fa');
    } else {
      document.documentElement.setAttribute('dir', 'ltr');
      document.documentElement.setAttribute('lang', 'en');
    }
  }, [settings]);

  // Fetch server models
  useEffect(() => {
    fetch('/api/models')
      .then((res) => res.json())
      .then((data) => {
        if (data && Array.isArray(data.models) && data.models.length > 0) {
          setModels(data.models);
        }
      })
      .catch((err) => {
        console.warn('Could not fetch server models list, using defaults:', err);
      });
  }, []);

  // Currently selected conversation object
  const selectedConversation =
    conversations.find((c) => c.id === selectedId) ||
    conversations[0] || {
      id: 'default',
      name: 'New Chat',
      messages: [],
      model: settings.defaultModel,
      prompt: settings.defaultSystemPrompt,
      temperature: settings.defaultTemperature,
      folderId: null,
    };

  // Conversation Management
  const handleNewConversation = () => {
    const newConv: Conversation = {
      id: 'conv-' + Date.now(),
      name: settings.language === 'fa' ? 'گفتگوی جدید' : 'New Chat',
      messages: [],
      model: settings.defaultModel,
      prompt: settings.defaultSystemPrompt,
      temperature: settings.defaultTemperature,
      folderId: null,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };
    setConversations((prev) => [newConv, ...prev]);
    setSelectedId(newConv.id);
  };

  const handleSelectConversation = (id: string) => {
    if (isStreaming) {
      handleStopGeneration();
    }
    setSelectedId(id);
  };

  const handleDeleteConversation = (id: string) => {
    setConversations((prev) => {
      const filtered = prev.filter((c) => c.id !== id);
      if (filtered.length === 0) {
        const replacement: Conversation = {
          id: 'conv-' + Date.now(),
          name: settings.language === 'fa' ? 'گفتگوی جدید' : 'New Chat',
          messages: [],
          model: settings.defaultModel,
          prompt: settings.defaultSystemPrompt,
          temperature: settings.defaultTemperature,
          folderId: null,
        };
        setSelectedId(replacement.id);
        return [replacement];
      }
      if (selectedId === id) {
        setSelectedId(filtered[0].id);
      }
      return filtered;
    });
  };

  const handleUpdateConversationName = (id: string, name: string) => {
    setConversations((prev) =>
      prev.map((c) => (c.id === id ? { ...c, name, updatedAt: Date.now() } : c))
    );
  };

  const handleClearAllConversations = () => {
    const fresh: Conversation = {
      id: 'conv-' + Date.now(),
      name: settings.language === 'fa' ? 'گفتگوی جدید' : 'New Chat',
      messages: [],
      model: settings.defaultModel,
      prompt: settings.defaultSystemPrompt,
      temperature: settings.defaultTemperature,
      folderId: null,
    };
    setConversations([fresh]);
    setSelectedId(fresh.id);
  };

  const handleClearCurrentMessages = () => {
    setConversations((prev) =>
      prev.map((c) =>
        c.id === selectedConversation.id ? { ...c, messages: [] } : c
      )
    );
  };

  // Folder Management
  const handleCreateFolder = (name: string, type: 'chat' | 'prompt') => {
    const newFolder: Folder = {
      id: 'folder-' + Date.now(),
      name,
      type,
    };
    setFolders((prev) => [...prev, newFolder]);
  };

  const handleDeleteFolder = (id: string) => {
    setFolders((prev) => prev.filter((f) => f.id !== id));
    setConversations((prev) =>
      prev.map((c) => (c.folderId === id ? { ...c, folderId: null } : c))
    );
    setPrompts((prev) =>
      prev.map((p) => (p.folderId === id ? { ...p, folderId: null } : p))
    );
  };

  const handleUpdateFolderName = (id: string, name: string) => {
    setFolders((prev) =>
      prev.map((f) => (f.id === id ? { ...f, name } : f))
    );
  };

  const handleMoveConversationToFolder = (
    convId: string,
    folderId: string | null
  ) => {
    setConversations((prev) =>
      prev.map((c) => (c.id === convId ? { ...c, folderId } : c))
    );
  };

  // Prompt Management
  const handleSavePrompt = (prompt: Prompt) => {
    setPrompts((prev) => {
      const exists = prev.some((p) => p.id === prompt.id);
      if (exists) {
        return prev.map((p) => (p.id === prompt.id ? prompt : p));
      }
      return [prompt, ...prev];
    });
  };

  const handleDeletePrompt = (id: string) => {
    setPrompts((prev) => prev.filter((p) => p.id !== id));
  };

  const handleSelectPrompt = (prompt: Prompt) => {
    const vars = extractVariables(prompt.content);
    if (vars.length > 0) {
      setActiveVariablePrompt(prompt);
      setIsVariableModalOpen(true);
    } else {
      handleSendMessage(prompt.content);
    }
  };

  // Memory Management
  const handleAddMemory = (
    content: string,
    category: 'preference' | 'fact' | 'instruction'
  ) => {
    const newItem: MemoryItem = {
      id: 'mem-' + Date.now(),
      content,
      category,
      enabled: true,
      createdAt: Date.now(),
    };
    setSettings((prev) => ({
      ...prev,
      memories: [newItem, ...prev.memories],
    }));
  };

  const handleToggleMemoryItem = (id: string) => {
    setSettings((prev) => ({
      ...prev,
      memories: prev.memories.map((m) =>
        m.id === id ? { ...m, enabled: !m.enabled } : m
      ),
    }));
  };

  const handleDeleteMemoryItem = (id: string) => {
    setSettings((prev) => ({
      ...prev,
      memories: prev.memories.filter((m) => m.id !== id),
    }));
  };

  const handleClearAllMemories = () => {
    setSettings((prev) => ({
      ...prev,
      memories: [],
    }));
  };

  // Workflow integration: Export workflow result into a new or active conversation
  const handleExportWorkflowResultToChat = (
    workflowName: string,
    finalResult: string
  ) => {
    const newConv: Conversation = {
      id: 'conv-' + Date.now(),
      name: `${workflowName.slice(0, 25)}...`,
      messages: [
        {
          role: 'user',
          content: `Run Workflow: ${workflowName}`,
          timestamp: Date.now() - 1000,
        },
        {
          role: 'assistant',
          content: finalResult,
          timestamp: Date.now(),
        },
      ],
      model: selectedConversation.model,
      prompt: selectedConversation.prompt,
      temperature: selectedConversation.temperature,
      folderId: null,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };
    setConversations((prev) => [newConv, ...prev]);
    setSelectedId(newConv.id);
  };

  // Parameters
  const handleSelectModel = (modelId: string) => {
    setConversations((prev) =>
      prev.map((c) =>
        c.id === selectedConversation.id ? { ...c, model: modelId } : c
      )
    );
  };

  const handleUpdateTemperature = (temp: number) => {
    setConversations((prev) =>
      prev.map((c) =>
        c.id === selectedConversation.id ? { ...c, temperature: temp } : c
      )
    );
  };

  const handleSaveSystemPrompt = (prompt: string) => {
    setConversations((prev) =>
      prev.map((c) =>
        c.id === selectedConversation.id ? { ...c, prompt } : c
      )
    );
  };

  // Chat Streaming Logic
  const handleSendMessage = async (text: string) => {
    if (!text.trim() || isStreaming) return;

    const userMessage: Message = {
      role: 'user',
      content: text,
      timestamp: Date.now(),
    };

    let updatedName = selectedConversation.name;
    if (
      selectedConversation.messages.length === 0 &&
      (selectedConversation.name === 'New Chat' ||
        selectedConversation.name === 'گفتگوی جدید')
    ) {
      updatedName = text.slice(0, 30) + (text.length > 30 ? '...' : '');
    }

    const newMessages = [...selectedConversation.messages, userMessage];

    const assistantMessage: Message = {
      role: 'assistant',
      content: '',
      timestamp: Date.now(),
    };

    const conversationWithAssistant = {
      ...selectedConversation,
      name: updatedName,
      messages: [...newMessages, assistantMessage],
      updatedAt: Date.now(),
    };

    setConversations((prev) =>
      prev.map((c) =>
        c.id === selectedConversation.id ? conversationWithAssistant : c
      )
    );

    setIsStreaming(true);
    const controller = new AbortController();
    abortControllerRef.current = controller;

    // Build memory context if enabled
    const memoryContext = settings.memoryEnabled
      ? settings.memories.filter((m) => m.enabled).map((m) => m.content)
      : [];

    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        signal: controller.signal,
        body: JSON.stringify({
          model: selectedConversation.model,
          messages: newMessages,
          systemPrompt: selectedConversation.prompt,
          temperature: selectedConversation.temperature,
          customServer: settings.customServer,
          memoryContext,
          thinkModeEnabled: settings.thinkModeEnabled,
        }),
      });

      if (!response.ok) {
        throw new Error(`Server returned HTTP ${response.status}`);
      }

      if (!response.body) {
        throw new Error('Response body is null');
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder('utf-8');
      let accumulatedContent = '';
      let buffer = '';

      while (true) {
        const { value, done } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n');
        buffer = lines.pop() || '';

        for (const line of lines) {
          const trimmed = line.trim();
          if (!trimmed.startsWith('data:')) continue;

          const dataStr = trimmed.replace(/^data:\s*/, '');
          if (dataStr === '[DONE]') {
            break;
          }

          try {
            const parsed = JSON.parse(dataStr);
            if (parsed.error) {
              accumulatedContent += `\n\n*Error: ${parsed.error}*`;
            } else if (parsed.text) {
              accumulatedContent += parsed.text;
            }

            setConversations((prev) =>
              prev.map((c) => {
                if (c.id !== selectedConversation.id) return c;
                const msgs = [...c.messages];
                if (msgs.length > 0) {
                  msgs[msgs.length - 1] = {
                    ...msgs[msgs.length - 1],
                    content: accumulatedContent,
                  };
                }
                return { ...c, messages: msgs };
              })
            );
          } catch (e) {
            // Ignore partial JSON parse errors
          }
        }
      }
    } catch (err: any) {
      if (err.name === 'AbortError') {
        console.log('Stream generation aborted by user.');
      } else {
        console.error('Chat stream error:', err);
        setConversations((prev) =>
          prev.map((c) => {
            if (c.id !== selectedConversation.id) return c;
            const msgs = [...c.messages];
            if (msgs.length > 0) {
              const last = msgs[msgs.length - 1];
              msgs[msgs.length - 1] = {
                ...last,
                content:
                  last.content +
                  `\n\n*Network or API Error: ${err?.message || 'Could not reach server'}*`,
              };
            }
            return { ...c, messages: msgs };
          })
        );
      }
    } finally {
      setIsStreaming(false);
      abortControllerRef.current = null;
    }
  };

  const handleStopGeneration = () => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
    }
    setIsStreaming(false);
  };

  const handleRegenerate = () => {
    if (isStreaming || selectedConversation.messages.length === 0) return;

    const msgs = [...selectedConversation.messages];
    if (msgs[msgs.length - 1]?.role === 'assistant') {
      msgs.pop();
    }
    const lastUser = msgs[msgs.length - 1];
    if (!lastUser || lastUser.role !== 'user') return;

    setConversations((prev) =>
      prev.map((c) =>
        c.id === selectedConversation.id ? { ...c, messages: msgs.slice(0, -1) } : c
      )
    );

    handleSendMessage(lastUser.content);
  };

  // Import / Export handlers
  const handleExport = () => {
    exportData(conversations, folders, prompts);
  };

  const handleImport = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result as string;
      const res = parseImportData(content);
      if (res.error) {
        alert('Failed to import file: ' + res.error);
        return;
      }
      if (res.conversations && res.conversations.length > 0) {
        setConversations(res.conversations);
        setSelectedId(res.conversations[0].id);
      }
      if (res.folders) setFolders(res.folders);
      if (res.prompts) setPrompts(res.prompts);
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  return (
    <div
      dir={settings.language === 'fa' ? 'rtl' : 'ltr'}
      className={`w-screen h-screen flex overflow-hidden ${
        settings.theme === 'dark' ? 'dark bg-[#202123]' : 'bg-gray-100'
      }`}
    >
      {/* Left Sidebar: Chatbar */}
      {isLeftSidebarOpen && (
        <Chatbar
          conversations={conversations}
          selectedConversationId={selectedId}
          onSelectConversation={handleSelectConversation}
          onNewConversation={handleNewConversation}
          onDeleteConversation={handleDeleteConversation}
          onUpdateConversationName={handleUpdateConversationName}
          onClearAllConversations={handleClearAllConversations}
          folders={folders}
          onCreateFolder={handleCreateFolder}
          onDeleteFolder={handleDeleteFolder}
          onUpdateFolderName={handleUpdateFolderName}
          onMoveConversationToFolder={handleMoveConversationToFolder}
          settings={settings}
          onToggleTheme={() =>
            setSettings({
              ...settings,
              theme: settings.theme === 'dark' ? 'light' : 'dark',
            })
          }
          onOpenSettings={() => setIsSettingsOpen(true)}
          onOpenHistoryModal={() => setIsHistoryModalOpen(true)}
          onExportData={handleExport}
          onImportData={handleImport}
          onToggleSidebar={() => setIsLeftSidebarOpen(false)}
          language={settings.language}
        />
      )}

      {/* Main Center Area: Chat */}
      <Chat
        conversation={selectedConversation}
        models={models}
        selectedModel={selectedConversation.model}
        onSelectModel={handleSelectModel}
        temperature={selectedConversation.temperature}
        onUpdateTemperature={handleUpdateTemperature}
        systemPrompt={selectedConversation.prompt}
        onOpenSystemPromptModal={() => setIsSystemPromptOpen(true)}
        onOpenHistoryModal={() => setIsHistoryModalOpen(true)}
        onOpenMemoryModal={() => setIsMemoryModalOpen(true)}
        onOpenWorkflowModal={() => setIsWorkflowModalOpen(true)}
        isStreaming={isStreaming}
        onSendMessage={handleSendMessage}
        onStopGeneration={handleStopGeneration}
        onRegenerate={handleRegenerate}
        onClearMessages={handleClearCurrentMessages}
        isLeftSidebarOpen={isLeftSidebarOpen}
        onToggleLeftSidebar={() => setIsLeftSidebarOpen(true)}
        isRightSidebarOpen={isRightSidebarOpen}
        onToggleRightSidebar={() => setIsRightSidebarOpen(!isRightSidebarOpen)}
        onOpenPromptbar={() => setIsRightSidebarOpen(true)}
        onOpenSettingsModal={() => setIsSettingsOpen(true)}
        onSaveToMemory={(content) => handleAddMemory(content, 'fact')}
        language={settings.language}
        memoryEnabled={settings.memoryEnabled}
        thinkModeMarkdown={settings.thinkModeMarkdown}
        customServer={settings.customServer}
        onOpenLowCodeCanvas={() => setIsLowCodeModalOpen(true)}
      />

      {/* Right Sidebar: Promptbar */}
      {isRightSidebarOpen && (
        <Promptbar
          prompts={prompts}
          onSelectPrompt={handleSelectPrompt}
          onNewPrompt={() => {
            setPromptToEdit(null);
            setIsPromptModalOpen(true);
          }}
          onEditPrompt={(prompt) => {
            setPromptToEdit(prompt);
            setIsPromptModalOpen(true);
          }}
          onDeletePrompt={handleDeletePrompt}
          folders={folders}
          onCreateFolder={handleCreateFolder}
          onDeleteFolder={handleDeleteFolder}
          onUpdateFolderName={handleUpdateFolderName}
          onTogglePromptbar={() => setIsRightSidebarOpen(false)}
          language={settings.language}
        />
      )}

      {/* Modals */}
      <SettingsModal
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        settings={settings}
        onSaveSettings={setSettings}
        models={models}
        onOpenMemoryModal={() => {
          setIsSettingsOpen(false);
          setIsMemoryModalOpen(true);
        }}
      />

      <SystemPromptModal
        isOpen={isSystemPromptOpen}
        onClose={() => setIsSystemPromptOpen(false)}
        systemPrompt={selectedConversation.prompt}
        onSavePrompt={handleSaveSystemPrompt}
      />

      <PromptModal
        isOpen={isPromptModalOpen}
        onClose={() => setIsPromptModalOpen(false)}
        promptToEdit={promptToEdit}
        onSavePrompt={handleSavePrompt}
        folders={folders}
      />

      <VariableModal
        isOpen={isVariableModalOpen}
        onClose={() => setIsVariableModalOpen(false)}
        prompt={activeVariablePrompt}
        onSubmit={(text) => handleSendMessage(text)}
      />

      <ChatHistoryModal
        isOpen={isHistoryModalOpen}
        onClose={() => setIsHistoryModalOpen(false)}
        conversations={conversations}
        selectedConversationId={selectedId}
        onSelectConversation={handleSelectConversation}
        onDeleteConversation={handleDeleteConversation}
        onClearAllConversations={handleClearAllConversations}
        onExportData={handleExport}
      />

      <MemoryModal
        isOpen={isMemoryModalOpen}
        onClose={() => setIsMemoryModalOpen(false)}
        language={settings.language}
        memoryEnabled={settings.memoryEnabled}
        onToggleMemory={(enabled) =>
          setSettings((prev) => ({ ...prev, memoryEnabled: enabled }))
        }
        memories={settings.memories}
        onAddMemory={handleAddMemory}
        onToggleMemoryItem={handleToggleMemoryItem}
        onDeleteMemoryItem={handleDeleteMemoryItem}
        onClearAllMemories={handleClearAllMemories}
      />

      <WorkflowModal
        isOpen={isWorkflowModalOpen}
        onClose={() => setIsWorkflowModalOpen(false)}
        language={settings.language}
        onExportToChat={handleExportWorkflowResultToChat}
        selectedModel={selectedConversation.model}
        customServer={settings.customServer}
        memoryEnabled={settings.memoryEnabled}
        memoryContext={
          settings.memoryEnabled
            ? settings.memories.filter((m) => m.enabled).map((m) => m.content)
            : []
        }
      />

      <LowCodeCanvasModal
        isOpen={isLowCodeModalOpen}
        onClose={() => setIsLowCodeModalOpen(false)}
        language={settings.language}
        onExportToChat={handleExportWorkflowResultToChat}
        selectedModel={selectedConversation.model}
        customServer={settings.customServer}
        memoryEnabled={settings.memoryEnabled}
        memoryContext={
          settings.memoryEnabled
            ? settings.memories.filter((m) => m.enabled).map((m) => m.content)
            : []
        }
      />
    </div>
  );
}
