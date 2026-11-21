import React, { useState, useRef, useEffect, useCallback } from 'react';
import {
  PanelLeftOpen,
  PanelRightOpen,
  Sliders,
  Sparkles,
  ChevronDown,
  TrendingUp,
  Code2,
  Languages,
  History,
  Brain,
  Workflow as WorkflowIcon,
  Server,
  Bot,
  Volume2,
  VolumeX,
  ArrowDown,
  Mic,
  Eye,
  FileText,
  Settings as SettingsIcon,
  Cpu,
  Wrench,
  FolderCode,
} from 'lucide-react';
import { Conversation, CustomServerConfig, Model } from '../../types/chat';
import { translations, Language } from '../../utils/translations';
import { copyToClipboard } from '../../utils/clipboard';
import { ChatInput } from './ChatInput';
import { ChatMessageItem } from './ChatMessageItem';
import { WorkspaceModal } from '../Modals/WorkspaceModal';

interface ChatProps {
  conversation: Conversation;
  models: Model[];
  selectedModel: string;
  onSelectModel: (modelId: string) => void;
  temperature: number;
  onUpdateTemperature: (temp: number) => void;
  systemPrompt: string;
  onOpenSystemPromptModal: () => void;
  onOpenHistoryModal: () => void;
  onOpenMemoryModal: () => void;
  onOpenWorkflowModal: () => void;
  onOpenLowCodeCanvas?: () => void;
  onOpenSettingsModal?: () => void;
  onSaveToMemory?: (content: string) => void;
  isStreaming: boolean;
  onSendMessage: (content: string) => void;
  onStopGeneration: () => void;
  onRegenerate: () => void;
  onClearMessages: () => void;
  isLeftSidebarOpen: boolean;
  onToggleLeftSidebar: () => void;
  isRightSidebarOpen: boolean;
  onToggleRightSidebar: () => void;
  onOpenPromptbar: () => void;
  language: Language;
  memoryEnabled: boolean;
  thinkModeMarkdown: boolean;
  customServer: CustomServerConfig;
}

export const Chat: React.FC<ChatProps> = ({
  conversation,
  models,
  selectedModel,
  onSelectModel,
  temperature,
  onUpdateTemperature,
  systemPrompt,
  onOpenSystemPromptModal,
  onOpenHistoryModal,
  onOpenMemoryModal,
  onOpenWorkflowModal,
  onOpenLowCodeCanvas,
  onOpenSettingsModal,
  onSaveToMemory,
  isStreaming,
  onSendMessage,
  onStopGeneration,
  onRegenerate,
  onClearMessages,
  isLeftSidebarOpen,
  onToggleLeftSidebar,
  isRightSidebarOpen,
  onToggleRightSidebar,
  onOpenPromptbar,
  language,
  memoryEnabled,
  thinkModeMarkdown,
  customServer,
}) => {
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null);
  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  const [editInput, setEditInput] = useState('');
  const [showTempDropdown, setShowTempDropdown] = useState(false);
  const [showModelDropdown, setShowModelDropdown] = useState(false);
  const [showToolsDropdown, setShowToolsDropdown] = useState(false);
  const [showWorkspace, setShowWorkspace] = useState(false);

  // Auto-scroll and scroll detection state
  const [isUserScrolledUp, setIsUserScrolledUp] = useState(false);
  const [hasNewMessagesWhileScrolled, setHasNewMessagesWhileScrolled] = useState(false);
  const [isHeaderVisible, setIsHeaderVisible] = useState(true);
  const isUserScrolledUpRef = useRef(false);
  const lastScrollTopRef = useRef(0);
  const prevMessagesCountRef = useRef(conversation.messages.length);
  const prevConversationIdRef = useRef(conversation.id);

  // Web Speech API / TTS state
  const [speakingIndex, setSpeakingIndex] = useState<number | null>(null);
  const [isSpeaking, setIsSpeaking] = useState(false);

  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const t = translations[language];
  const isRtl = language === 'fa';

  // Find the last assistant message
  const lastAssistantMessageIndex = conversation.messages.reduce<number>(
    (lastIdx, msg, idx) => (msg.role === 'assistant' ? idx : lastIdx),
    -1
  );
  const lastAssistantMessage =
    lastAssistantMessageIndex >= 0 ? conversation.messages[lastAssistantMessageIndex] : null;

  // Scroll to bottom smoothly or immediately
  const scrollToBottom = useCallback((behavior: ScrollBehavior = 'smooth') => {
    isUserScrolledUpRef.current = false;
    setIsUserScrolledUp(false);
    setHasNewMessagesWhileScrolled(false);

    if (scrollContainerRef.current) {
      if (behavior === 'auto') {
        scrollContainerRef.current.scrollTop = scrollContainerRef.current.scrollHeight;
      } else {
        scrollContainerRef.current.scrollTo({
          top: scrollContainerRef.current.scrollHeight,
          behavior: 'smooth',
        });
      }
    }
    messagesEndRef.current?.scrollIntoView({ behavior });
  }, []);

  // Detect when user manually scrolls up/down
  const handleScroll = useCallback(() => {
    if (!scrollContainerRef.current) return;
    const { scrollTop, scrollHeight, clientHeight } = scrollContainerRef.current;
    const distanceFromBottom = scrollHeight - (scrollTop + clientHeight);

    const isScrolledUp = distanceFromBottom > 70;
    setIsUserScrolledUp(isScrolledUp);
    isUserScrolledUpRef.current = isScrolledUp;

    if (!isScrolledUp) {
      setHasNewMessagesWhileScrolled(false);
    }

    const currentScrollTop = scrollTop;
    const diff = currentScrollTop - lastScrollTopRef.current;
    if (diff > 8 && currentScrollTop > 40) {
      setIsHeaderVisible(false);
    } else if (diff < -8 || currentScrollTop <= 15) {
      setIsHeaderVisible(true);
    }
    lastScrollTopRef.current = currentScrollTop;
  }, []);

  // Smart Auto-Scroll on message updates and streaming
  useEffect(() => {
    if (prevConversationIdRef.current !== conversation.id) {
      prevConversationIdRef.current = conversation.id;
      prevMessagesCountRef.current = conversation.messages.length;
      isUserScrolledUpRef.current = false;
      setIsUserScrolledUp(false);
      setHasNewMessagesWhileScrolled(false);
      try {
        if (typeof window !== 'undefined' && 'speechSynthesis' in window && window.speechSynthesis) {
          window.speechSynthesis.cancel();
          setIsSpeaking(false);
          setSpeakingIndex(null);
        }
      } catch (e) {
        console.warn(e);
      }
      setTimeout(() => scrollToBottom('auto'), 40);
      return;
    }

    const currentCount = conversation.messages.length;
    const prevCount = prevMessagesCountRef.current;
    prevMessagesCountRef.current = currentCount;
    const lastMessage = conversation.messages[currentCount - 1];

    if (currentCount > prevCount && lastMessage?.role === 'user') {
      scrollToBottom('smooth');
      return;
    }

    if (isStreaming) {
      if (!isUserScrolledUpRef.current) {
        if (scrollContainerRef.current) {
          scrollContainerRef.current.scrollTop = scrollContainerRef.current.scrollHeight;
        }
      } else {
        setHasNewMessagesWhileScrolled(true);
      }
    } else {
      if (!isUserScrolledUpRef.current) {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
      }
    }
  }, [conversation.messages, isStreaming, conversation.id, scrollToBottom]);

  // Clean up speech synthesis on unmount
  useEffect(() => {
    return () => {
      try {
        if (typeof window !== 'undefined' && 'speechSynthesis' in window && window.speechSynthesis) {
          window.speechSynthesis.cancel();
        }
      } catch (e) {
        console.warn(e);
      }
    };
  }, []);

  // Text-To-Speech Handler
  const handleSpeak = useCallback((rawText: string, index?: number) => {
    if (typeof window === 'undefined' || !('speechSynthesis' in window) || !window.speechSynthesis) {
      return;
    }

    try {
      if (isSpeaking && (index === undefined || speakingIndex === index)) {
        window.speechSynthesis.cancel();
        setIsSpeaking(false);
        setSpeakingIndex(null);
        return;
      }

      window.speechSynthesis.cancel();

      const cleanText = rawText
        .replace(/```[\s\S]*?```/g, '')
        .replace(/`([^`]+)`/g, '$1')
        .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1')
        .replace(/[#*_~`>-]/g, '')
        .replace(/\s+/g, ' ')
        .trim();

      if (!cleanText) return;

      const utterance = new SpeechSynthesisUtterance(cleanText);
      const isPersian = /[\u0600-\u06FF]/.test(cleanText);
      utterance.lang = isPersian ? 'fa-IR' : 'en-US';

      const voices = window.speechSynthesis.getVoices ? window.speechSynthesis.getVoices() : [];
      if (isPersian) {
        const faVoice = voices.find((v) => v.lang && v.lang.startsWith('fa'));
        if (faVoice) utterance.voice = faVoice;
      } else {
        const enVoice =
          voices.find((v) => v.lang && v.lang.startsWith('en') && v.name && v.name.includes('Natural')) ||
          voices.find((v) => v.lang && v.lang.startsWith('en'));
        if (enVoice) utterance.voice = enVoice;
      }

      utterance.rate = 1.0;
      utterance.pitch = 1.0;

      utterance.onstart = () => {
        setIsSpeaking(true);
        if (index !== undefined) setSpeakingIndex(index);
      };

      utterance.onend = () => {
        setIsSpeaking(false);
        setSpeakingIndex(null);
      };

      utterance.onerror = () => {
        setIsSpeaking(false);
        setSpeakingIndex(null);
      };

      window.speechSynthesis.speak(utterance);
    } catch (err) {
      console.warn('Speech synthesis error:', err);
      setIsSpeaking(false);
      setSpeakingIndex(null);
    }
  }, [isSpeaking, speakingIndex]);

  const handleCopyMessage = useCallback(async (content: string, index: number) => {
    const success = await copyToClipboard(content);
    if (success) {
      setCopiedIndex(index);
      setTimeout(() => setCopiedIndex(null), 2500);
    }
  }, []);

  const handleStartEdit = useCallback((index: number, content: string) => {
    setEditingIndex(index);
    setEditInput(content);
  }, []);

  const handleSaveEdit = useCallback((index: number) => {
    if (!editInput.trim()) return;
    setEditingIndex(null);
    onSendMessage(editInput.trim());
  }, [editInput, onSendMessage]);

  const handleCancelEdit = useCallback(() => {
    setEditingIndex(null);
  }, []);

  const handleEditInputChange = useCallback((value: string) => {
    setEditInput(value);
  }, []);

  const handleSendMessageWrapper = useCallback((content: string) => {
    onSendMessage(content);
    setTimeout(() => scrollToBottom('smooth'), 20);
  }, [onSendMessage, scrollToBottom]);

  // Determine active model details
  const isCustomSelected =
    selectedModel === 'custom-server-ai' ||
    Boolean(customServer.availableModels?.some((m) => m.id === selectedModel));

  const customModelObj = customServer.availableModels?.find((m) => m.id === selectedModel);
  const currentModelName = customModelObj
    ? customModelObj.name
    : isCustomSelected
    ? `${customServer.modelName || 'Local AI'} (سرور اختصاصی)`
    : models.find((m) => m.id === selectedModel)?.name || 'Gemini 2.5 Flash';

  return (
    <main
      dir={isRtl ? 'rtl' : 'ltr'}
      className="flex-1 h-full flex flex-col bg-[#343541] relative overflow-hidden select-text"
    >
      {/* Top Header - Organized, Clean, Non-wrapping Grid/Flex */}
      <header
        className={`transition-all duration-300 overflow-hidden bg-[#2a2b32] flex items-center justify-between px-3 sm:px-4 z-20 shrink-0 select-none ${
          isHeaderVisible
            ? 'h-14 opacity-100 border-b border-white/10'
            : 'h-0 opacity-0 border-b-0'
        }`}
      >
        {/* Left Side: Sidebar toggle & Model Selector */}
        <div className="flex items-center gap-2 shrink-0">
          {!isLeftSidebarOpen && (
            <button
              type="button"
              onClick={onToggleLeftSidebar}
              title="باز کردن نوار کناری گفتگوها"
              className="p-2 rounded-xl border border-white/10 bg-[#202123] hover:bg-[#343541] text-gray-300 hover:text-white transition-colors"
            >
              <PanelLeftOpen className="w-4 h-4" />
            </button>
          )}

          {/* Model Selector Dropdown */}
          <div className="relative">
            <button
              type="button"
              onClick={() => {
                setShowModelDropdown(!showModelDropdown);
                setShowTempDropdown(false);
              }}
              className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-[#202123] hover:bg-[#343541] border border-white/10 text-xs font-semibold text-white transition-all shadow-xs"
            >
              {isCustomSelected ? (
                <div className="flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                  <Server className="w-3.5 h-3.5 text-emerald-400" />
                </div>
              ) : (
                <div className="flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-blue-400" />
                  <Bot className="w-3.5 h-3.5 text-blue-400" />
                </div>
              )}
              <span className="truncate max-w-[120px] sm:max-w-[170px]">
                {currentModelName}
              </span>
              <ChevronDown className="w-3.5 h-3.5 text-gray-400" />
            </button>

            {showModelDropdown && (
              <div
                className={`absolute ${
                  isRtl ? 'right-0' : 'left-0'
                } top-full mt-2 w-80 bg-[#202123] border border-white/15 rounded-2xl shadow-2xl py-2 z-50 text-xs`}
              >
                {/* Custom Server Section */}
                {customServer.enabled ? (
                  <div>
                    <div className="px-3.5 py-1.5 text-[11px] font-bold text-emerald-400 uppercase tracking-wider flex items-center justify-between border-b border-white/5">
                      <span className="flex items-center gap-1.5">
                        <Server className="w-3.5 h-3.5 text-emerald-400" />
                        <span>سرور اختصاصی شما (Local AI)</span>
                      </span>
                      {onOpenSettingsModal && (
                        <button
                          type="button"
                          onClick={() => {
                            setShowModelDropdown(false);
                            onOpenSettingsModal();
                          }}
                          className="text-[10px] text-gray-400 hover:text-emerald-300 flex items-center gap-1"
                        >
                          <SettingsIcon className="w-3 h-3" />
                          <span>تنظیمات سرور</span>
                        </button>
                      )}
                    </div>

                    {/* Detected models from user's server */}
                    {customServer.availableModels && customServer.availableModels.length > 0 ? (
                      <div className="max-h-48 overflow-y-auto custom-scrollbar divide-y divide-white/5">
                        {customServer.availableModels.map((m) => {
                          const isSelected = selectedModel === m.id;
                          return (
                            <button
                              key={m.id}
                              type="button"
                              onClick={() => {
                                onSelectModel(m.id);
                                setShowModelDropdown(false);
                              }}
                              className={`w-full text-left px-3.5 py-2 flex items-center justify-between hover:bg-white/5 transition-colors ${
                                isSelected ? 'bg-emerald-500/10 text-emerald-300 font-bold' : 'text-gray-200'
                              }`}
                            >
                              <div className="flex items-center gap-2 truncate">
                                {m.type === 'audio' ? (
                                  <Mic className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                                ) : m.type === 'vision' ? (
                                  <Eye className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
                                ) : (
                                  <FileText className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                                )}
                                <span className="truncate">{m.name}</span>
                              </div>
                              <span className="text-[10px] text-gray-500 font-mono">
                                {m.type === 'audio' ? 'صوت' : m.type === 'vision' ? 'تصویر' : 'متن'}
                              </span>
                            </button>
                          );
                        })}
                      </div>
                    ) : (
                      <button
                        type="button"
                        onClick={() => {
                          onSelectModel('custom-server-ai');
                          setShowModelDropdown(false);
                        }}
                        className="w-full text-left px-3.5 py-2 flex items-center gap-2 text-gray-200 hover:bg-white/5"
                      >
                        <Server className="w-3.5 h-3.5 text-emerald-400" />
                        <span>{customServer.modelName || 'Local Model'}</span>
                      </button>
                    )}
                  </div>
                ) : (
                  <div className="px-3.5 py-2 bg-white/5 border-b border-white/5 text-[11px] text-gray-400 flex items-center justify-between">
                    <span>سرور اختصاصی غیرفعال است</span>
                    {onOpenSettingsModal && (
                      <button
                        type="button"
                        onClick={() => {
                          setShowModelDropdown(false);
                          onOpenSettingsModal();
                        }}
                        className="text-emerald-400 hover:underline font-semibold"
                      >
                        فعال‌سازی در تنظیمات
                      </button>
                    )}
                  </div>
                )}

                {/* Official Google Gemini Models */}
                <div className="px-3.5 pt-2 pb-1 text-[11px] font-bold text-gray-400 uppercase tracking-wider">
                  مدل‌های ابری رسمی گوگل
                </div>
                {models.map((m) => (
                  <button
                    key={m.id}
                    type="button"
                    onClick={() => {
                      onSelectModel(m.id);
                      setShowModelDropdown(false);
                    }}
                    className={`w-full text-left px-3.5 py-2 flex items-start gap-2.5 hover:bg-white/5 transition-colors ${
                      m.id === selectedModel
                        ? 'bg-blue-500/10 text-blue-400 font-semibold'
                        : 'text-gray-200'
                    }`}
                  >
                    <Bot className="w-3.5 h-3.5 mt-0.5 shrink-0 text-blue-400" />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <span className="font-medium">{m.name}</span>
                        {m.recommended && (
                          <span className="text-[9px] bg-blue-500/20 text-blue-300 px-1.5 py-0.2 rounded border border-blue-500/30">
                            پیش‌فرض
                          </span>
                        )}
                      </div>
                      <div className="text-[10px] text-gray-400 truncate">
                        {m.description}
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Right Side: Clean Toolset & Quick Actions */}
        <div className="flex items-center gap-2 shrink-0">
          <button
            type="button"
            onClick={() => { setShowWorkspace(true); setShowToolsDropdown(false); }}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-600/15 hover:bg-emerald-600/25 border border-emerald-500/30 text-xs font-semibold text-emerald-300 transition-all"
            title={language === 'fa' ? 'فضای کاری پروژه' : 'Project workspace'}
          >
            <FolderCode className="w-3.5 h-3.5" />
            <span>{language === 'fa' ? 'پروژه' : 'Project'}</span>
          </button>
          {/* Tools Dropdown Menu */}
          <div className="relative">
            <button
              type="button"
              onClick={() => {
                setShowToolsDropdown(!showToolsDropdown);
                setShowModelDropdown(false);
              }}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#202123] hover:bg-[#343541] border border-white/10 text-xs font-semibold text-gray-200 hover:text-white transition-all shadow-xs"
            >
              <Wrench className="w-3.5 h-3.5 text-emerald-400" />
              <span>{language === 'fa' ? 'ابزارها' : 'Tools'}</span>
              <ChevronDown className="w-3.5 h-3.5 text-gray-400" />
            </button>

            {showToolsDropdown && (
              <div
                className={`absolute ${
                  isRtl ? 'left-0' : 'right-0'
                } top-full mt-2 w-64 bg-[#202123] border border-white/15 rounded-2xl shadow-2xl py-2 z-50 text-xs space-y-1 divide-y divide-white/5`}
              >
                <div className="px-3.5 py-1.5 text-[10px] font-bold text-gray-400 uppercase tracking-wider">
                  {language === 'fa' ? 'ابزارها و قابلیت‌های هوش مصنوعی' : 'AI Tools & Features'}
                </div>
                <div className="pt-1">
                  <button
                    type="button"
                    onClick={() => {
                      setShowToolsDropdown(false);
                      onOpenWorkflowModal();
                    }}
                    className="w-full text-left px-3.5 py-2 flex items-center gap-2.5 hover:bg-white/5 text-gray-200 transition-colors"
                  >
                    <WorkflowIcon className="w-4 h-4 text-emerald-400 shrink-0" />
                    <span>{t.workflows}</span>
                  </button>

                  {onOpenLowCodeCanvas && (
                    <button
                      type="button"
                      onClick={() => {
                        setShowToolsDropdown(false);
                        onOpenLowCodeCanvas();
                      }}
                      className="w-full text-left px-3.5 py-2 flex items-center gap-2.5 hover:bg-white/5 text-gray-200 transition-colors"
                    >
                      <Cpu className="w-4 h-4 text-cyan-400 shrink-0" />
                      <span>Low-Code Canvas</span>
                    </button>
                  )}

                  <button
                    type="button"
                    onClick={() => {
                      setShowToolsDropdown(false);
                      onOpenMemoryModal();
                    }}
                    className="w-full text-left px-3.5 py-2 flex items-center gap-2.5 hover:bg-white/5 text-gray-200 transition-colors"
                  >
                    <Brain className="w-4 h-4 text-purple-400 shrink-0" />
                    <span>{t.memoryTitle} ({memoryEnabled ? 'فعال' : 'غیرفعال'})</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setShowToolsDropdown(false);
                      onOpenHistoryModal();
                    }}
                    className="w-full text-left px-3.5 py-2 flex items-center gap-2.5 hover:bg-white/5 text-gray-200 transition-colors"
                  >
                    <History className="w-4 h-4 text-gray-400 shrink-0" />
                    <span>{t.history}</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setShowToolsDropdown(false);
                      onOpenSystemPromptModal();
                    }}
                    className="w-full text-left px-3.5 py-2 flex items-center gap-2.5 hover:bg-white/5 text-gray-200 transition-colors"
                  >
                    <Sparkles className="w-4 h-4 text-amber-400 shrink-0" />
                    <span>{t.systemPrompt}</span>
                  </button>
                </div>

                <div className="pt-2 px-3.5 py-2 space-y-2">
                  <div className="flex items-center justify-between text-gray-300 font-medium">
                    <span>{t.temperature}:</span>
                    <span className="font-mono text-emerald-400 font-semibold">
                      {temperature.toFixed(2)}
                    </span>
                  </div>
                  <input
                    type="range"
                    min="0"
                    max="1.5"
                    step="0.05"
                    value={temperature}
                    onChange={(e) => onUpdateTemperature(parseFloat(e.target.value))}
                    className="w-full accent-emerald-500 cursor-pointer"
                  />
                </div>

                {lastAssistantMessage && (
                  <div className="pt-1">
                    <button
                      type="button"
                      onClick={() => {
                        setShowToolsDropdown(false);
                        handleSpeak(lastAssistantMessage.content, lastAssistantMessageIndex);
                      }}
                      className="w-full text-left px-3.5 py-2 flex items-center gap-2.5 hover:bg-white/5 text-emerald-300 transition-colors"
                    >
                      <Volume2 className="w-4 h-4 text-emerald-400 shrink-0" />
                      <span>{isSpeaking ? t.stopSpeaking : t.readLastMessage}</span>
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Toggle Promptbar */}
          {!isRightSidebarOpen && (
            <button
              type="button"
              onClick={onToggleRightSidebar}
              title="باز کردن نوار الگوها (Prompts)"
              className="p-2 rounded-xl border border-white/10 bg-[#202123] hover:bg-[#343541] text-gray-300 hover:text-white transition-colors"
            >
              <PanelRightOpen className="w-4 h-4" />
            </button>
          )}
        </div>
      </header>

      {/* Main Message Area with auto-scroll container */}
      <div
        id="message-list-container"
        data-testid="message-list-container"
        ref={scrollContainerRef}
        onScroll={handleScroll}
        className="flex-1 overflow-y-auto px-3 sm:px-4 py-4 sm:py-6 custom-scrollbar"
      >
        {conversation.messages.length === 0 ? (
          /* Empty State / Welcome Screen */
          <div className="max-w-2xl mx-auto h-full flex flex-col items-center justify-center text-center px-4 py-8">
            <div className="w-14 h-14 rounded-2xl bg-emerald-600 flex items-center justify-center text-white shadow-md mb-4">
              <Bot className="w-8 h-8" />
            </div>
            <h1 className="text-2xl sm:text-3xl font-bold text-white tracking-tight">
              {t.appTitle}
            </h1>
            <p className="text-sm text-gray-400 mt-1 mb-6">
              {t.appSubtitle}
            </p>

            {/* Quick Starter Suggestions */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 w-full text-left">
              <button
                type="button"
                onClick={() =>
                  handleSendMessageWrapper(
                    'Analyze the Nasdaq 100 (NDX) 15-minute timeframe using the Quantitative Trading System Architect specifications and return structured JSON.'
                  )
                }
                className="p-4 rounded-xl border border-white/10 bg-[#202123] hover:border-emerald-500/50 transition-colors text-xs group text-left"
              >
                <div className="flex items-center gap-2 font-semibold text-white group-hover:text-emerald-400 transition-colors">
                  <TrendingUp className="w-4 h-4 text-emerald-400" />
                  <span>{t.quantTitle}</span>
                </div>
                <p className="text-gray-400 text-[11px] mt-1.5 leading-relaxed">
                  {t.quantDesc}
                </p>
              </button>

              <button
                type="button"
                onClick={() =>
                  handleSendMessageWrapper(
                    'Review and refactor this TypeScript React hook for optimal performance and clean state management.'
                  )
                }
                className="p-4 rounded-xl border border-white/10 bg-[#202123] hover:border-emerald-500/50 transition-colors text-xs group text-left"
              >
                <div className="flex items-center gap-2 font-semibold text-white group-hover:text-emerald-400 transition-colors">
                  <Code2 className="w-4 h-4 text-emerald-400" />
                  <span>{t.codeTitle}</span>
                </div>
                <p className="text-gray-400 text-[11px] mt-1.5 leading-relaxed">
                  {t.codeDesc}
                </p>
              </button>

              <button
                type="button"
                onClick={() =>
                  handleSendMessageWrapper(
                    'سلام! ویژگی‌های این نسخه از برنامه Chatbot UI را توضیح بده و بگو چه بخش‌هایی را می‌توان تغییر داد.'
                  )
                }
                className="p-4 rounded-xl border border-white/10 bg-[#202123] hover:border-emerald-500/50 transition-colors text-xs group text-left"
              >
                <div className="flex items-center gap-2 font-semibold text-white group-hover:text-emerald-400 transition-colors">
                  <Languages className="w-4 h-4 text-emerald-400" />
                  <span>{t.persianTitle}</span>
                </div>
                <p className="text-gray-400 text-[11px] mt-1.5 leading-relaxed">
                  {t.persianDesc}
                </p>
              </button>

              <button
                type="button"
                onClick={onOpenWorkflowModal}
                className="p-4 rounded-xl border border-white/10 bg-[#202123] hover:border-emerald-500/50 transition-colors text-xs group text-left"
              >
                <div className="flex items-center gap-2 font-semibold text-white group-hover:text-emerald-400 transition-colors">
                  <WorkflowIcon className="w-4 h-4 text-amber-400" />
                  <span>{t.workflowsCardTitle}</span>
                </div>
                <p className="text-gray-400 text-[11px] mt-1.5 leading-relaxed">
                  {t.workflowsCardDesc}
                </p>
              </button>
            </div>
          </div>
        ) : (
          /* Message List with Memoized Items */
          <div className="max-w-3xl mx-auto space-y-4 sm:space-y-6">
            {conversation.messages.map((message, index) => {
              const isLastMessage = index === conversation.messages.length - 1;
              return (
                <ChatMessageItem
                  key={`${conversation.id}-${index}`}
                  message={message}
                  index={index}
                  isStreaming={isStreaming}
                  isLastMessage={isLastMessage}
                  currentModelName={currentModelName}
                  isCustomSelected={isCustomSelected}
                  speakingIndex={speakingIndex}
                  isSpeaking={isSpeaking}
                  onSpeak={handleSpeak}
                  onCopy={handleCopyMessage}
                  onSaveToMemory={onSaveToMemory}
                  copiedIndex={copiedIndex}
                  editingIndex={editingIndex}
                  editInput={editInput}
                  onStartEdit={handleStartEdit}
                  onSaveEdit={handleSaveEdit}
                  onCancelEdit={handleCancelEdit}
                  onEditInputChange={handleEditInputChange}
                  onRegenerate={onRegenerate}
                  thinkModeMarkdown={thinkModeMarkdown}
                  t={t}
                />
              );
            })}
            <div ref={messagesEndRef} />
          </div>
        )}
      </div>

      {/* Floating Scroll to Bottom Button */}
      {isUserScrolledUp && conversation.messages.length > 0 && (
        <button
          type="button"
          onClick={() => scrollToBottom('smooth')}
          className="absolute bottom-24 left-1/2 -translate-x-1/2 z-20 flex items-center gap-2 px-4 py-2 rounded-full bg-[#202123] hover:bg-[#2c2d32] border border-white/20 text-gray-200 hover:text-white shadow-xl transition-all duration-200 text-xs font-semibold group"
          title={t.scrollToBottom}
        >
          <ArrowDown className="w-3.5 h-3.5 text-emerald-400 group-hover:translate-y-0.5 transition-transform shrink-0" />
          <span>
            {hasNewMessagesWhileScrolled ? t.newMessagesBelow : t.scrollToBottom}
          </span>
          {hasNewMessagesWhileScrolled && (
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
            </span>
          )}
        </button>
      )}

      <WorkspaceModal open={showWorkspace} onClose={() => setShowWorkspace(false)} language={language} />

      {/* Standalone Chat Input Component - Zero typing latency */}
      <ChatInput
        isStreaming={isStreaming}
        hasMessages={conversation.messages.length > 0}
        onSendMessage={handleSendMessageWrapper}
        onStopGeneration={onStopGeneration}
        onClearMessages={onClearMessages}
        language={language}
      />
    </main>
  );
};
