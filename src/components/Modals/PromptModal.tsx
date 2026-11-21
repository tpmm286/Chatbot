import React, { useState, useEffect } from 'react';
import { X, Check, FileText } from 'lucide-react';
import { Folder, Prompt } from '../../types/chat';

interface PromptModalProps {
  isOpen: boolean;
  onClose: () => void;
  promptToEdit: Prompt | null;
  onSavePrompt: (prompt: Prompt) => void;
  folders: Folder[];
}

export const PromptModal: React.FC<PromptModalProps> = ({
  isOpen,
  onClose,
  promptToEdit,
  onSavePrompt,
  folders,
}) => {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [content, setContent] = useState('');
  const [folderId, setFolderId] = useState<string | null>(null);

  useEffect(() => {
    if (promptToEdit) {
      setName(promptToEdit.name);
      setDescription(promptToEdit.description || '');
      setContent(promptToEdit.content);
      setFolderId(promptToEdit.folderId || null);
    } else {
      setName('');
      setDescription('');
      setContent('');
      setFolderId(null);
    }
  }, [promptToEdit, isOpen]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !content.trim()) return;

    const newPrompt: Prompt = {
      id: promptToEdit ? promptToEdit.id : 'prompt-' + Date.now(),
      name: name.trim(),
      description: description.trim(),
      content: content.trim(),
      folderId,
    };
    onSavePrompt(newPrompt);
    onClose();
  };

  const promptFolders = folders.filter((f) => f.type === 'prompt');

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-xs p-4">
      <div className="bg-[#202123] border border-white/10 rounded-xl shadow-2xl w-full max-w-lg overflow-hidden text-gray-100 animate-in fade-in zoom-in-95 duration-150">
        <div className="flex items-center justify-between px-6 py-4 border-b border-white/10 bg-[#2b2c2f]/50">
          <div className="flex items-center gap-2 font-semibold text-lg text-white">
            <FileText className="w-5 h-5 text-emerald-400" />
            <span>{promptToEdit ? 'Edit Prompt' : 'Create New Prompt'}</span>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-white p-1 rounded-md hover:bg-white/5 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1">
              Title
            </label>
            <input
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g., Code Reviewer or Market Analyst"
              className="w-full bg-[#2a2b32] border border-white/10 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-emerald-500"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1">
              Description
            </label>
            <input
              type="text"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="A brief summary of what this template does"
              className="w-full bg-[#2a2b32] border border-white/10 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-emerald-500"
            />
          </div>

          {promptFolders.length > 0 && (
            <div>
              <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1">
                Folder
              </label>
              <select
                value={folderId || ''}
                onChange={(e) => setFolderId(e.target.value || null)}
                className="w-full bg-[#2a2b32] border border-white/10 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-emerald-500"
              >
                <option value="">(No folder)</option>
                {promptFolders.map((f) => (
                  <option key={f.id} value={f.id}>
                    {f.name}
                  </option>
                ))}
              </select>
            </div>
          )}

          <div>
            <div className="flex justify-between items-center mb-1">
              <label className="text-xs font-semibold text-gray-400 uppercase tracking-wider">
                Prompt Content
              </label>
              <span className="text-[11px] text-gray-400">
                Use {'{{variable}}'} for dynamic fill-in fields
              </span>
            </div>
            <textarea
              required
              rows={6}
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="e.g. Translate this {{topic}} text to {{language}}: {{text}}"
              className="w-full bg-[#1e1e24] border border-white/10 rounded-lg p-3 text-xs font-mono text-gray-200 placeholder-gray-500 focus:outline-none focus:border-emerald-500"
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
              type="submit"
              className="px-5 py-2 rounded-lg text-sm font-medium bg-emerald-600 hover:bg-emerald-500 text-white flex items-center gap-1.5 shadow-lg shadow-emerald-600/20 transition-colors"
            >
              <Check className="w-4 h-4" />
              Save Prompt
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
