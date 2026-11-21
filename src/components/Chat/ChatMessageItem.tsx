import React, { useState } from 'react';
import {
  Bot,
  User,
  Server,
  Volume2,
  VolumeX,
  Copy,
  Check,
  Edit3,
  RotateCcw,
  Brain,
  Sparkles,
} from 'lucide-react';
import { Message } from '../../types/chat';
import { MarkdownView } from '../MarkdownView';

interface ChatMessageItemProps {
  message: Message;
  index: number;
  isStreaming: boolean;
  isLastMessage: boolean;
  currentModelName: string;
  isCustomSelected: boolean;
  speakingIndex: number | null;
  isSpeaking: boolean;
  onSpeak: (content: string, index: number) => void;
  onCopy: (content: string, index: number) => void;
  onSaveToMemory?: (content: string) => void;
  copiedIndex: number | null;
  editingIndex: number | null;
  editInput: string;
  onStartEdit: (index: number, content: string) => void;
  onSaveEdit: (index: number) => void;
  onCancelEdit: () => void;
  onEditInputChange: (value: string) => void;
  onRegenerate: () => void;
  thinkModeMarkdown?: boolean;
  t: {
    copyToClipboard: string;
    copiedToClipboard: string;
    readAloud: string;
    stopSpeaking: string;
    editAndResend: string;
    regenerate: string;
    cancel: string;
    saveAndSubmit: string;
    chars: string;
  };
}

export const ChatMessageItem: React.FC<ChatMessageItemProps> = React.memo(({
  message,
  index,
  isStreaming,
  isLastMessage,
  currentModelName,
  isCustomSelected,
  speakingIndex,
  isSpeaking,
  onSpeak,
  onCopy,
  onSaveToMemory,
  copiedIndex,
  editingIndex,
  editInput,
  onStartEdit,
  onSaveEdit,
  onCancelEdit,
  onEditInputChange,
  onRegenerate,
  thinkModeMarkdown = true,
  t,
}) => {
  const isAssistant = message.role === 'assistant';
  const isCurrentlySpeaking = isSpeaking && speakingIndex === index;
  const isCopied = copiedIndex === index;
  const isEditing = editingIndex === index;
  const [memorySaved, setMemorySaved] = useState(false);

  const handleSaveMemory = () => {
    if (onSaveToMemory && message.content) {
      onSaveToMemory(message.content);
      setMemorySaved(true);
      setTimeout(() => setMemorySaved(false), 2500);
    }
  };

  // Parse thought process if present (<thought>...</thought>), handling both closed and unclosed (streaming) thoughts
  let thoughtText: string | null = null;
  let displayContent = message.content;
  let isThinkingActive = false;

  const closedThoughtMatch = message.content.match(/<thought>([\s\S]*?)<\/thought>/);
  if (closedThoughtMatch) {
    thoughtText = closedThoughtMatch[1].trim();
    displayContent = message.content.replace(/<thought>[\s\S]*?<\/thought>/g, '').trim();
  } else {
    const openThoughtIdx = message.content.indexOf('<thought>');
    if (openThoughtIdx !== -1) {
      isThinkingActive = true;
      thoughtText = message.content.slice(openThoughtIdx + 9).trim();
      displayContent = message.content.slice(0, openThoughtIdx).trim();
    }
  }

  const [userToggledThought, setUserToggledThought] = useState<boolean | null>(null);
  const showThought = userToggledThought !== null ? userToggledThought : (isStreaming && isThinkingActive);

  return (
    <div
      className={`flex gap-3 sm:gap-4 p-3.5 sm:p-4 rounded-xl transition-colors message-contain ${
        isAssistant
          ? 'bg-[#444654] border border-white/5'
          : 'bg-transparent hover:bg-white/5'
      }`}
    >
      {/* Avatar */}
      <div className="shrink-0">
        {isAssistant ? (
          <div className="w-8 h-8 rounded-lg bg-emerald-600 flex items-center justify-center text-white shadow-sm">
            {isCustomSelected ? (
              <Server className="w-4.5 h-4.5" />
            ) : (
              <Bot className="w-5 h-5" />
            )}
          </div>
        ) : (
          <div className="w-8 h-8 rounded-lg bg-purple-600 flex items-center justify-center text-white shadow-sm">
            <User className="w-5 h-5" />
          </div>
        )}
      </div>

      {/* Content & Actions */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between mb-1.5">
          <span className="text-xs font-semibold text-gray-300">
            {isAssistant ? currentModelName : 'You'}
          </span>

          {/* Header Actions */}
          <div className="flex items-center gap-1.5 text-gray-400 text-xs">
            {onSaveToMemory && (
              <button
                type="button"
                onClick={handleSaveMemory}
                className={`flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] transition-colors border ${
                  memorySaved
                    ? 'bg-purple-600/30 text-purple-300 border-purple-500/50'
                    : 'bg-white/5 hover:bg-white/10 text-gray-400 hover:text-purple-300 border-white/5'
                }`}
                title="افزودن این پیام به حافظه سراسری چت‌ها"
              >
                <Brain className="w-3 h-3 text-purple-400" />
                <span className="hidden sm:inline">
                  {memorySaved ? 'در حافظه ذخیره شد' : 'افزودن به حافظه'}
                </span>
              </button>
            )}

            {isAssistant && (
              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  onClick={() => onSpeak(message.content, index)}
                  className={`p-1.5 rounded-md transition-colors border ${
                    isCurrentlySpeaking
                      ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40 animate-pulse'
                      : 'bg-white/5 hover:bg-white/10 text-gray-300 hover:text-white border-white/5'
                  }`}
                  title={isCurrentlySpeaking ? t.stopSpeaking : t.readAloud}
                >
                  {isCurrentlySpeaking ? (
                    <VolumeX className="w-3.5 h-3.5 text-emerald-400" />
                  ) : (
                    <Volume2 className="w-3.5 h-3.5" />
                  )}
                </button>

                <button
                  type="button"
                  onClick={() => onCopy(message.content, index)}
                  className="flex items-center gap-1.5 px-2 py-1 rounded-md bg-white/5 hover:bg-white/10 text-gray-300 hover:text-white transition-colors border border-white/5"
                  title={t.copyToClipboard}
                >
                  {isCopied ? (
                    <>
                      <Check className="w-3.5 h-3.5 text-emerald-400" />
                      <span className="text-emerald-400 font-medium text-xs">
                        {t.copiedToClipboard}
                      </span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-3.5 h-3.5" />
                      <span className="text-xs">{t.copyToClipboard}</span>
                    </>
                  )}
                </button>
              </div>
            )}

            {!isAssistant && (
              <div className="flex items-center gap-1">
                <button
                  type="button"
                  onClick={() => onCopy(message.content, index)}
                  className="p-1 rounded hover:text-white hover:bg-white/5 transition-colors"
                  title={t.copyToClipboard}
                >
                  {isCopied ? (
                    <Check className="w-3.5 h-3.5 text-emerald-400" />
                  ) : (
                    <Copy className="w-3.5 h-3.5" />
                  )}
                </button>
                <button
                  type="button"
                  onClick={() => onStartEdit(index, message.content)}
                  className="p-1 rounded hover:text-white hover:bg-white/5 transition-colors"
                  title={t.editAndResend}
                >
                  <Edit3 className="w-3.5 h-3.5" />
                </button>
              </div>
            )}

            {isAssistant && isLastMessage && !isStreaming && (
              <button
                type="button"
                onClick={onRegenerate}
                className="p-1 rounded hover:text-white hover:bg-white/5 transition-colors"
                title={t.regenerate}
              >
                <RotateCcw className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        </div>

        {/* Text / Markdown Render */}
        {isEditing ? (
          <div className="space-y-2 mt-2">
            <textarea
              rows={3}
              value={editInput}
              onChange={(e) => onEditInputChange(e.target.value)}
              className="w-full bg-[#1e1e24] border border-white/20 rounded-lg p-2.5 text-sm text-white focus:outline-none focus:border-emerald-500 font-sans"
            />
            <div className="flex justify-end gap-2">
              <button
                type="button"
                onClick={onCancelEdit}
                className="px-3 py-1 rounded text-xs text-gray-400 hover:text-white"
              >
                {t.cancel}
              </button>
              <button
                type="button"
                onClick={() => onSaveEdit(index)}
                className="px-3 py-1 rounded text-xs bg-emerald-600 hover:bg-emerald-500 text-white font-medium"
              >
                {t.saveAndSubmit}
              </button>
            </div>
          </div>
        ) : (
          <div className="text-gray-100">
            {/* Thought Process Accordion */}
            {thoughtText && (
              <div className="mb-3.5 rounded-xl border border-amber-500/30 bg-amber-950/20 overflow-hidden shadow-sm">
                <button
                  type="button"
                  onClick={() => setUserToggledThought(!showThought)}
                  className="w-full flex items-center justify-between px-3.5 py-2 text-xs font-semibold text-amber-300 hover:bg-amber-500/10 transition-colors"
                >
                  <div className="flex items-center gap-2">
                    <Sparkles className="w-4 h-4 text-amber-400 animate-pulse" />
                    <span>
                      {isStreaming && isThinkingActive
                        ? 'در حال تفکر و استدلال عمیق... (Thinking)'
                        : 'حالت تفکر و استدلال عمیق مدل (Thinking Process)'}
                    </span>
                  </div>
                  <span className="text-[11px] text-amber-400/90 font-mono underline">
                    {showThought ? 'مخفی کردن' : 'مشاهده تفکر'}
                  </span>
                </button>
                {showThought && (
                  <div className="p-3 bg-black/40 border-t border-amber-500/20 text-xs text-amber-100/95 font-mono leading-relaxed max-h-64 overflow-y-auto custom-scrollbar">
                    {thinkModeMarkdown ? (
                      <MarkdownView content={thoughtText} />
                    ) : (
                      <div className="whitespace-pre-wrap">{thoughtText}</div>
                    )}
                  </div>
                )}
              </div>
            )}

            <MarkdownView content={displayContent || message.content} />

            {/* Blinking cursor while assistant is streaming */}
            {isAssistant && isStreaming && isLastMessage && (
              <span className="inline-block w-2 h-4 bg-emerald-400 ml-1 animate-pulse align-middle" />
            )}

            {/* Bottom bar for assistant message */}
            {isAssistant && message.content && (
              <div className="flex items-center justify-between mt-3 pt-2.5 border-t border-white/5 text-xs text-gray-400">
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => onCopy(message.content, index)}
                    className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-medium transition-all border ${
                      isCopied
                        ? 'bg-emerald-500/15 border-emerald-500/40 text-emerald-400'
                        : 'bg-white/5 border-white/10 hover:bg-white/10 text-gray-200 hover:text-white'
                    }`}
                    title={t.copyToClipboard}
                  >
                    {isCopied ? (
                      <>
                        <Check className="w-3.5 h-3.5 text-emerald-400" />
                        <span>{t.copiedToClipboard}</span>
                      </>
                    ) : (
                      <>
                        <Copy className="w-3.5 h-3.5 text-emerald-400" />
                        <span>{t.copyToClipboard}</span>
                      </>
                    )}
                  </button>

                  <button
                    type="button"
                    onClick={() => onSpeak(message.content, index)}
                    className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-medium transition-all border ${
                      isCurrentlySpeaking
                        ? 'bg-emerald-500/20 border-emerald-500/40 text-emerald-300 animate-pulse'
                        : 'bg-white/5 border-white/10 hover:bg-white/10 text-gray-300 hover:text-white'
                    }`}
                    title={isCurrentlySpeaking ? t.stopSpeaking : t.readAloud}
                  >
                    {isCurrentlySpeaking ? (
                      <>
                        <VolumeX className="w-3.5 h-3.5 text-emerald-400" />
                        <span>{t.stopSpeaking}</span>
                      </>
                    ) : (
                      <>
                        <Volume2 className="w-3.5 h-3.5 text-gray-300" />
                        <span>{t.readAloud}</span>
                      </>
                    )}
                  </button>

                  {isLastMessage && !isStreaming && (
                    <button
                      type="button"
                      onClick={onRegenerate}
                      className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-white/5 border border-white/10 hover:bg-white/10 text-gray-300 hover:text-white text-xs font-medium transition-colors"
                      title={t.regenerate}
                    >
                      <RotateCcw className="w-3.5 h-3.5" />
                      <span>{t.regenerate}</span>
                    </button>
                  )}
                </div>

                <span className="text-[11px] text-gray-400 font-mono">
                  {message.content.length} {t.chars}
                </span>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
});
