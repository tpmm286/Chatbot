import React, { useState, useEffect } from 'react';
import { X, Send, Sparkles } from 'lucide-react';
import { Prompt } from '../../types/chat';
import { extractVariables, interpolateVariables } from '../../utils/storage';

interface VariableModalProps {
  isOpen: boolean;
  onClose: () => void;
  prompt: Prompt | null;
  onSubmit: (interpolatedText: string) => void;
}

export const VariableModal: React.FC<VariableModalProps> = ({
  isOpen,
  onClose,
  prompt,
  onSubmit,
}) => {
  const [variables, setVariables] = useState<string[]>([]);
  const [values, setValues] = useState<Record<string, string>>({});

  useEffect(() => {
    if (prompt) {
      const vars = extractVariables(prompt.content);
      setVariables(vars);
      const initialMap: Record<string, string> = {};
      vars.forEach((v) => {
        initialMap[v] = '';
      });
      setValues(initialMap);
    }
  }, [prompt, isOpen]);

  if (!isOpen || !prompt) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const finalContent = interpolateVariables(prompt.content, values);
    onSubmit(finalContent);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-xs p-4">
      <div className="bg-[#202123] border border-white/10 rounded-xl shadow-2xl w-full max-w-lg overflow-hidden text-gray-100 animate-in fade-in zoom-in-95 duration-150">
        <div className="flex items-center justify-between px-6 py-4 border-b border-white/10 bg-[#2b2c2f]/50">
          <div>
            <div className="flex items-center gap-2 font-semibold text-base text-white">
              <Sparkles className="w-4 h-4 text-emerald-400" />
              <span>Fill Template: {prompt.name}</span>
            </div>
            {prompt.description && (
              <p className="text-xs text-gray-400 mt-0.5">{prompt.description}</p>
            )}
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-white p-1 rounded-md hover:bg-white/5 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div className="max-h-[60vh] overflow-y-auto space-y-4 pr-1">
            {variables.map((variable) => (
              <div key={variable}>
                <label className="block text-xs font-semibold text-gray-300 uppercase tracking-wider mb-1.5 font-mono">
                  {variable}
                </label>
                {variable.toLowerCase().includes('code') ||
                variable.toLowerCase().includes('text') ||
                variable.toLowerCase().includes('data') ? (
                  <textarea
                    rows={4}
                    required
                    value={values[variable] || ''}
                    onChange={(e) =>
                      setValues({ ...values, [variable]: e.target.value })
                    }
                    placeholder={`Enter value for ${variable}...`}
                    className="w-full bg-[#1e1e24] border border-white/10 rounded-lg p-3 text-xs font-mono text-white placeholder-gray-500 focus:outline-none focus:border-emerald-500"
                  />
                ) : (
                  <input
                    type="text"
                    required
                    value={values[variable] || ''}
                    onChange={(e) =>
                      setValues({ ...values, [variable]: e.target.value })
                    }
                    placeholder={`Enter value for ${variable}...`}
                    className="w-full bg-[#2a2b32] border border-white/10 rounded-lg px-3 py-2 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-emerald-500"
                  />
                )}
              </div>
            ))}
          </div>

          <div className="flex justify-end gap-3 pt-2 border-t border-white/10">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-lg text-sm text-gray-300 hover:text-white hover:bg-white/5 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-5 py-2 rounded-lg text-sm font-medium bg-emerald-600 hover:bg-emerald-500 text-white flex items-center gap-1.5 shadow-lg shadow-emerald-600/20 transition-colors"
            >
              <Send className="w-4 h-4" />
              Insert into Chat
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
