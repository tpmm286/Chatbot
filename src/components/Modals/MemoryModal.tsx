import React, { useState } from 'react';
import {
  X,
  Brain,
  Plus,
  Trash2,
  Check,
  ToggleLeft,
  ToggleRight,
  Sparkles,
  Info,
} from 'lucide-react';
import { MemoryItem } from '../../types/chat';
import { translations, Language } from '../../utils/translations';

interface MemoryModalProps {
  isOpen: boolean;
  onClose: () => void;
  language: Language;
  memoryEnabled: boolean;
  onToggleMemory: (enabled: boolean) => void;
  memories: MemoryItem[];
  onAddMemory: (content: string, category: 'preference' | 'fact' | 'instruction') => void;
  onToggleMemoryItem: (id: string) => void;
  onDeleteMemoryItem: (id: string) => void;
  onClearAllMemories: () => void;
}

export const MemoryModal: React.FC<MemoryModalProps> = ({
  isOpen,
  onClose,
  language,
  memoryEnabled,
  onToggleMemory,
  memories,
  onAddMemory,
  onToggleMemoryItem,
  onDeleteMemoryItem,
  onClearAllMemories,
}) => {
  const [content, setContent] = useState('');
  const [category, setCategory] = useState<'preference' | 'fact' | 'instruction'>('preference');
  const t = translations[language];
  const isRtl = language === 'fa';

  if (!isOpen) return null;

  const handleAdd = (e: React.FormEvent) => {
    e.preventDefault();
    if (!content.trim()) return;
    onAddMemory(content.trim(), category);
    setContent('');
  };

  return (
    <div
      dir={isRtl ? 'rtl' : 'ltr'}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-xs p-4"
    >
      <div className="bg-[#202123] border border-white/10 rounded-2xl shadow-2xl w-full max-w-2xl max-h-[85vh] flex flex-col overflow-hidden text-gray-100 animate-in fade-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-white/10 bg-[#2b2c2f]/50">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-purple-500/15 flex items-center justify-center text-purple-400 border border-purple-500/25">
              <Brain className="w-5 h-5" />
            </div>
            <div>
              <h2 className="font-semibold text-base text-white">{t.memoryTitle}</h2>
              <p className="text-xs text-gray-400">{t.memorySubtitle}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-white p-1 rounded-lg hover:bg-white/5 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Global Memory Switch Banner */}
        <div className="p-4 border-b border-white/10 bg-[#1e1e24] flex items-center justify-between gap-4">
          <div className="flex items-start gap-2.5">
            <Sparkles className="w-4 h-4 text-purple-400 mt-0.5 shrink-0" />
            <div>
              <div className="text-sm font-medium text-white">{t.memoryToggle}</div>
              <p className="text-xs text-gray-400 mt-0.5">{t.memoryToggleDesc}</p>
            </div>
          </div>

          <button
            onClick={() => onToggleMemory(!memoryEnabled)}
            className={`flex items-center gap-2 px-3 py-1.5 rounded-xl border text-xs font-semibold transition-all ${
              memoryEnabled
                ? 'bg-purple-600/20 border-purple-500/50 text-purple-300 shadow-xs'
                : 'bg-white/5 border-white/10 text-gray-400 hover:text-white'
            }`}
          >
            {memoryEnabled ? (
              <>
                <ToggleRight className="w-4 h-4 text-purple-400" />
                <span>{t.memoryActive}</span>
              </>
            ) : (
              <>
                <ToggleLeft className="w-4 h-4 text-gray-500" />
                <span>{t.memoryInactive}</span>
              </>
            )}
          </button>
        </div>

        {/* Add Memory Form */}
        <form onSubmit={handleAdd} className="p-4 border-b border-white/10 bg-[#25262b]/40 space-y-3">
          <div className="flex flex-col sm:flex-row gap-2">
            <input
              type="text"
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder={t.memoryPlaceholder}
              className="flex-1 min-w-[240px] bg-[#1e1e24] border border-white/10 focus:border-purple-500/80 rounded-xl px-3.5 py-2 text-xs text-white placeholder-gray-500 focus:outline-none"
            />

            <select
              value={category}
              onChange={(e: any) => setCategory(e.target.value)}
              className="bg-[#1e1e24] border border-white/10 rounded-xl px-3 py-2 text-xs text-gray-300 focus:outline-none"
            >
              <option value="preference">{t.prefCategory}</option>
              <option value="fact">{t.factCategory}</option>
              <option value="instruction">{t.ruleCategory}</option>
            </select>

            <button
              type="submit"
              disabled={!content.trim()}
              className="flex items-center justify-center gap-1.5 px-4 py-2 bg-purple-600 hover:bg-purple-500 disabled:bg-purple-600/30 text-white rounded-xl text-xs font-medium transition-colors shrink-0 shadow-xs"
            >
              <Plus className="w-4 h-4" />
              <span>{t.addMemory}</span>
            </button>
          </div>
        </form>

        {/* Stored Memories List */}
        <div className="flex-1 overflow-y-auto p-4 space-y-2.5 custom-scrollbar">
          {memories.length === 0 ? (
            <div className="text-center py-12 text-gray-500 text-xs px-6">
              <Info className="w-8 h-8 mx-auto text-gray-600 mb-2 stroke-1" />
              <p>{t.noMemories}</p>
            </div>
          ) : (
            memories.map((mem) => (
              <div
                key={mem.id}
                className={`p-3 rounded-xl border transition-all flex items-center justify-between gap-3 ${
                  mem.enabled && memoryEnabled
                    ? 'bg-[#2a2b32]/60 border-purple-500/30 text-white'
                    : 'bg-[#202123]/60 border-white/5 text-gray-400 opacity-60'
                }`}
              >
                <div className="flex items-center gap-3 flex-1 min-w-0">
                  <button
                    onClick={() => onToggleMemoryItem(mem.id)}
                    className={`w-5 h-5 rounded-md border flex items-center justify-center transition-colors shrink-0 ${
                      mem.enabled
                        ? 'bg-purple-600 border-purple-500 text-white'
                        : 'border-white/20 bg-transparent text-transparent'
                    }`}
                  >
                    <Check className="w-3.5 h-3.5" />
                  </button>

                  <div className="truncate">
                    <div className="text-xs text-white leading-relaxed truncate">
                      {mem.content}
                    </div>
                    <div className="flex items-center gap-2 mt-1">
                      <span className="px-1.5 py-0.5 rounded text-[10px] font-medium bg-white/5 border border-white/5 text-purple-300">
                        {mem.category === 'preference'
                          ? t.prefCategory
                          : mem.category === 'fact'
                          ? t.factCategory
                          : t.ruleCategory}
                      </span>
                      <span className="text-[10px] text-gray-500 font-mono">
                        {new Date(mem.createdAt).toLocaleDateString()}
                      </span>
                    </div>
                  </div>
                </div>

                <button
                  onClick={() => onDeleteMemoryItem(mem.id)}
                  className="p-1.5 rounded-lg text-gray-400 hover:text-rose-400 hover:bg-rose-500/10 transition-colors shrink-0"
                  title="Delete memory item"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            ))
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-3 border-t border-white/10 bg-[#25262b]/30 flex justify-between items-center text-xs text-gray-400">
          {memories.length > 0 && (
            <button
              onClick={onClearAllMemories}
              className="text-rose-400 hover:text-rose-300 text-xs hover:underline"
            >
              {t.clearAllMemories}
            </button>
          )}
          <button
            onClick={onClose}
            className="px-4 py-1.5 rounded-lg bg-white/10 hover:bg-white/15 text-white font-medium transition-colors ml-auto"
          >
            {t.confirm}
          </button>
        </div>
      </div>
    </div>
  );
};
