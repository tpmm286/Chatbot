import React from 'react';
import { X, Bot, Sparkles, Check, RotateCcw } from 'lucide-react';
import { DEFAULT_SYSTEM_PROMPT, QUANT_TRADING_SYSTEM_PROMPT } from '../../utils/constants';

interface SystemPromptModalProps {
  isOpen: boolean;
  onClose: () => void;
  systemPrompt: string;
  onSavePrompt: (prompt: string) => void;
}

export const SystemPromptModal: React.FC<SystemPromptModalProps> = ({
  isOpen,
  onClose,
  systemPrompt,
  onSavePrompt,
}) => {
  const [value, setValue] = React.useState(systemPrompt);

  React.useEffect(() => {
    setValue(systemPrompt);
  }, [systemPrompt, isOpen]);

  if (!isOpen) return null;

  const presets = [
    {
      title: 'Default Assistant',
      desc: 'Helpful and versatile general assistant',
      prompt: DEFAULT_SYSTEM_PROMPT,
    },
    {
      title: '📈 Quantitative Trading Architect',
      desc: 'Outputs structured JSON annotations for TradingView',
      prompt: QUANT_TRADING_SYSTEM_PROMPT,
    },
    {
      title: '💻 Senior Code Architect',
      desc: 'TypeScript, clean code, architecture and optimization focus',
      prompt:
        'You are an expert Senior Staff Software Engineer and System Architect. Always provide robust TypeScript / React / Node.js production-grade code with zero placeholders and precise technical rationale.',
    },
    {
      title: '🌐 Persian Localization Expert',
      desc: 'مترجم و ویراستار متون تخصصی فارسی',
      prompt:
        'شما یک دستیار هوشمند و متخصص در نگارش، ترجمه و ویرایش متون تخصصی فارسی هستید. همواره با لحن محترمانه، شیوا و با رعایت دقیق اصول نگارشی زبان فارسی پاسخ دهید.',
    },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-xs p-4">
      <div className="bg-[#202123] border border-white/10 rounded-xl shadow-2xl w-full max-w-xl overflow-hidden text-gray-100 animate-in fade-in zoom-in-95 duration-150">
        <div className="flex items-center justify-between px-6 py-4 border-b border-white/10 bg-[#2b2c2f]/50">
          <div className="flex items-center gap-2 font-semibold text-lg text-white">
            <Bot className="w-5 h-5 text-emerald-400" />
            <span>Custom System Instructions</span>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-white p-1 rounded-md hover:bg-white/5 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 space-y-4">
          <div>
            <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">
              Select Preset
            </label>
            <div className="grid grid-cols-2 gap-2">
              {presets.map((preset, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => setValue(preset.prompt)}
                  className="text-left p-2.5 rounded-lg border border-white/10 bg-white/5 hover:border-emerald-500/50 hover:bg-emerald-500/5 transition-colors"
                >
                  <div className="text-xs font-semibold text-white truncate">
                    {preset.title}
                  </div>
                  <div className="text-[11px] text-gray-400 line-clamp-1 mt-0.5">
                    {preset.desc}
                  </div>
                </button>
              ))}
            </div>
          </div>

          <div>
            <div className="flex justify-between items-center mb-2">
              <label className="text-xs font-semibold text-gray-400 uppercase tracking-wider">
                System Prompt for Current Chat
              </label>
              <button
                type="button"
                onClick={() => setValue(DEFAULT_SYSTEM_PROMPT)}
                className="flex items-center gap-1 text-xs text-gray-400 hover:text-emerald-400"
              >
                <RotateCcw className="w-3 h-3" />
                Reset
              </button>
            </div>
            <textarea
              rows={8}
              value={value}
              onChange={(e) => setValue(e.target.value)}
              placeholder="Define instructions, tone, and behavior constraints..."
              className="w-full bg-[#1e1e24] border border-white/10 rounded-lg p-3 text-xs font-mono text-gray-200 placeholder-gray-500 focus:outline-none focus:border-emerald-500 leading-relaxed"
            />
          </div>

          <div className="flex justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-lg text-sm text-gray-300 hover:text-white hover:bg-white/5 transition-colors"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={() => {
                onSavePrompt(value);
                onClose();
              }}
              className="px-5 py-2 rounded-lg text-sm font-medium bg-emerald-600 hover:bg-emerald-500 text-white flex items-center gap-1.5 shadow-lg shadow-emerald-600/20 transition-colors"
            >
              <Check className="w-4 h-4" />
              Apply Instructions
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
