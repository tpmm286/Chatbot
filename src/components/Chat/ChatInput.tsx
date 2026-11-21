import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Send, StopCircle, Trash2, Mic, MicOff, Image as ImageIcon } from 'lucide-react';
import { translations, Language } from '../../utils/translations';

interface ChatInputProps {
  isStreaming: boolean;
  hasMessages: boolean;
  onSendMessage: (content: string) => void;
  onStopGeneration: () => void;
  onClearMessages: () => void;
  language: Language;
}

export const ChatInput: React.FC<ChatInputProps> = React.memo(({
  isStreaming,
  hasMessages,
  onSendMessage,
  onStopGeneration,
  onClearMessages,
  language,
}) => {
  const [text, setText] = useState('');
  const [isRecording, setIsRecording] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const t = translations[language];
  const isRtl = language === 'fa';

  // Efficient local textarea height auto-adjust
  const adjustHeight = useCallback(() => {
    const el = textareaRef.current;
    if (!el) return;
    el.style.height = 'auto';
    el.style.height = `${Math.min(el.scrollHeight, 200)}px`;
  }, []);

  const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setText(e.target.value);
    adjustHeight();
  };

  const handleSend = () => {
    const trimmed = text.trim();
    if (!trimmed || isStreaming) return;
    onSendMessage(trimmed);
    setText('');
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  // Voice recording trigger (Web Speech API if available)
  const handleToggleVoice = () => {
    const SpeechRecognitionAPI =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

    if (!SpeechRecognitionAPI) {
      alert('مرورگر شما از تشخیص گفتار پشتیبانی نمی‌کند. لطفاً متن خود را تایپ کنید.');
      return;
    }

    if (isRecording) {
      setIsRecording(false);
      return;
    }

    try {
      const recognition = new SpeechRecognitionAPI();
      recognition.lang = language === 'fa' ? 'fa-IR' : 'en-US';
      recognition.interimResults = true;

      recognition.onstart = () => {
        setIsRecording(true);
      };

      recognition.onresult = (event: any) => {
        let transcript = '';
        for (let i = event.resultIndex; i < event.results.length; i++) {
          transcript += event.results[i][0].transcript;
        }
        setText((prev) => (prev ? `${prev} ${transcript}` : transcript));
        adjustHeight();
      };

      recognition.onerror = () => {
        setIsRecording(false);
      };

      recognition.onend = () => {
        setIsRecording(false);
      };

      recognition.start();
    } catch (err) {
      console.warn('Speech recognition error:', err);
      setIsRecording(false);
    }
  };

  // Image prompt trigger
  const handleImagePrompt = () => {
    const promptDescription = prompt(
      language === 'fa'
        ? 'توضیحات تصویر مورد نظر خود را برای تولید یا پردازش وارد کنید:'
        : 'Enter image description or prompt for generation:'
    );
    if (promptDescription && promptDescription.trim()) {
      onSendMessage(`[Image Generation Request]: ${promptDescription.trim()}`);
    }
  };

  // Reset height if text cleared
  useEffect(() => {
    if (!text && textareaRef.current) {
      textareaRef.current.style.height = 'auto';
    }
  }, [text]);

  return (
    <footer className="p-3 sm:p-4 border-t border-white/10 bg-[#343541] shrink-0">
      <div className="max-w-3xl mx-auto space-y-2">
        {/* Floating actions: Stop Generating & Clear */}
        <div className="flex items-center justify-between h-7 px-1">
          <div className="flex items-center gap-2">
            {hasMessages && !isStreaming && (
              <button
                onClick={onClearMessages}
                type="button"
                className="flex items-center gap-1 text-[11px] text-gray-400 hover:text-rose-400 transition-colors"
                title={t.clearChat}
              >
                <Trash2 className="w-3 h-3" />
                <span>{t.clearChat}</span>
              </button>
            )}
          </div>

          {isStreaming && (
            <button
              onClick={onStopGeneration}
              type="button"
              className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-rose-600/20 border border-rose-500/30 hover:bg-rose-600/30 text-rose-300 text-xs font-medium transition-colors mx-auto"
            >
              <StopCircle className="w-3.5 h-3.5" />
              <span>{t.stopGenerating}</span>
            </button>
          )}

          <div className="text-[11px] text-gray-400 font-mono">
            {text.length} {t.chars}
          </div>
        </div>

        {/* Text Area Input with Voice and Image Triggers */}
        <div className="relative flex items-end bg-[#40414f] border border-white/10 focus-within:border-emerald-500/80 rounded-2xl shadow-md transition-colors">
          <div className={`absolute ${isRtl ? 'right-2' : 'left-2'} bottom-2.5 flex items-center gap-1 z-10`}>
            {/* Voice Dictation Trigger */}
            <button
              type="button"
              onClick={handleToggleVoice}
              className={`p-2 rounded-xl transition-colors ${
                isRecording
                  ? 'bg-rose-600 text-white animate-pulse'
                  : 'bg-white/5 hover:bg-white/10 text-gray-300 hover:text-white'
              }`}
              title={isRecording ? 'توقف ضبط صدا' : 'ضبط صدا / صوت (Voice)'}
            >
              {isRecording ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4 text-emerald-400" />}
            </button>

            {/* Image Generation / Prompt Trigger */}
            <button
              type="button"
              onClick={handleImagePrompt}
              className="p-2 rounded-xl bg-white/5 hover:bg-white/10 text-gray-300 hover:text-white transition-colors"
              title="تولید یا ارسال درخواست تصویر (Image)"
            >
              <ImageIcon className="w-4 h-4 text-cyan-400" />
            </button>
          </div>

          <textarea
            ref={textareaRef}
            rows={1}
            value={text}
            onChange={handleChange}
            onKeyDown={handleKeyDown}
            placeholder={t.sendPlaceholder}
            className={`w-full resize-none bg-transparent py-3 ${
              isRtl ? 'pr-20 pl-12' : 'pl-20 pr-12'
            } text-sm text-white placeholder-gray-400 focus:outline-none max-h-52 custom-scrollbar font-sans`}
          />

          <button
            onClick={handleSend}
            disabled={!text.trim() || isStreaming}
            type="button"
            title="Send message"
            className={`absolute ${
              isRtl ? 'left-2.5' : 'right-2.5'
            } bottom-2.5 p-2 rounded-xl transition-all ${
              text.trim() && !isStreaming
                ? 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-sm'
                : 'bg-white/5 text-gray-500 cursor-not-allowed'
            }`}
          >
            <Send className={`w-4 h-4 ${isRtl ? 'rotate-180' : ''}`} />
          </button>
        </div>

        <div className="text-center text-[11px] text-gray-400">
          {t.disclaimer}
        </div>
      </div>
    </footer>
  );
});
