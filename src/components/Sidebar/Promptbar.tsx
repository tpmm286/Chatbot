import React, { useState } from 'react';
import {
  Plus,
  FolderPlus,
  Folder as FolderIcon,
  FolderOpen,
  FileText,
  Search,
  Trash2,
  Edit2,
  Check,
  X,
  PanelRightClose,
  Sparkles,
} from 'lucide-react';
import { Folder, Prompt } from '../../types/chat';
import { translations, Language } from '../../utils/translations';

interface PromptbarProps {
  prompts: Prompt[];
  onSelectPrompt: (prompt: Prompt) => void;
  onNewPrompt: () => void;
  onEditPrompt: (prompt: Prompt) => void;
  onDeletePrompt: (id: string) => void;
  folders: Folder[];
  onCreateFolder: (name: string, type: 'chat' | 'prompt') => void;
  onDeleteFolder: (id: string) => void;
  onUpdateFolderName: (id: string, name: string) => void;
  onTogglePromptbar: () => void;
  language: Language;
}

export const Promptbar: React.FC<PromptbarProps> = ({
  prompts,
  onSelectPrompt,
  onNewPrompt,
  onEditPrompt,
  onDeletePrompt,
  folders,
  onCreateFolder,
  onDeleteFolder,
  onUpdateFolderName,
  onTogglePromptbar,
  language,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [openFolders, setOpenFolders] = useState<Record<string, boolean>>({
    'folder-prompts': true,
  });
  const [isCreatingFolder, setIsCreatingFolder] = useState(false);
  const [newFolderName, setNewFolderName] = useState('');

  const [editingFolderId, setEditingFolderId] = useState<string | null>(null);
  const [editingFolderName, setEditingFolderName] = useState('');
  const [confirmDeleteFolderId, setConfirmDeleteFolderId] = useState<string | null>(null);
  const [confirmDeletePromptId, setConfirmDeletePromptId] = useState<string | null>(null);

  const t = translations[language];
  const isRtl = language === 'fa';
  const promptFolders = folders.filter((f) => f.type === 'prompt');

  const filteredPrompts = prompts.filter(
    (p) =>
      p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (p.description && p.description.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  const toggleFolder = (folderId: string) => {
    setOpenFolders((prev) => ({
      ...prev,
      [folderId]: !prev[folderId],
    }));
  };

  const handleCreateFolder = (e: React.FormEvent) => {
    e.preventDefault();
    if (newFolderName.trim()) {
      onCreateFolder(newFolderName.trim(), 'prompt');
      setNewFolderName('');
      setIsCreatingFolder(false);
    }
  };

  const handleSaveRenameFolder = (id: string) => {
    if (editingFolderName.trim()) {
      onUpdateFolderName(id, editingFolderName.trim());
    }
    setEditingFolderId(null);
  };

  return (
    <aside
      dir={isRtl ? 'rtl' : 'ltr'}
      className={`w-64 h-full bg-[#202123] ${
        isRtl ? 'border-r' : 'border-l'
      } border-white/10 flex flex-col shrink-0 select-none text-gray-200`}
    >
      {/* Top Action Buttons */}
      <div className="p-2 space-y-2">
        <div className="flex gap-1.5">
          <button
            onClick={onTogglePromptbar}
            title="Close prompts panel"
            className="flex items-center justify-center px-2 py-2.5 rounded-xl border border-white/10 hover:bg-white/5 text-gray-400 hover:text-white transition-colors"
          >
            <PanelRightClose className={`w-4 h-4 ${isRtl ? 'rotate-180' : ''}`} />
          </button>
          <button
            onClick={() => setIsCreatingFolder(true)}
            title={t.newFolder}
            className="flex items-center justify-center px-3 py-2.5 rounded-xl border border-white/20 hover:bg-white/5 text-gray-300 hover:text-white transition-colors"
          >
            <FolderPlus className="w-4 h-4" />
          </button>
          <button
            onClick={onNewPrompt}
            className="flex-1 flex items-center justify-center gap-2 px-3 py-2.5 rounded-xl border border-white/20 hover:bg-white/5 transition-colors text-xs font-semibold text-white shadow-xs"
          >
            <Plus className="w-4 h-4 text-emerald-400" />
            <span>{t.newPrompt}</span>
          </button>
        </div>

        {/* New Folder Inline Form */}
        {isCreatingFolder && (
          <form
            onSubmit={handleCreateFolder}
            className="flex items-center gap-1 p-1 bg-[#2a2b32] rounded-xl border border-white/10"
          >
            <input
              type="text"
              autoFocus
              value={newFolderName}
              onChange={(e) => setNewFolderName(e.target.value)}
              placeholder="Folder name..."
              className="flex-1 bg-transparent px-2 py-1 text-xs text-white focus:outline-none"
            />
            <button
              type="submit"
              className="p-1 hover:text-emerald-400 text-gray-300"
            >
              <Check className="w-3.5 h-3.5" />
            </button>
            <button
              type="button"
              onClick={() => setIsCreatingFolder(false)}
              className="p-1 hover:text-rose-400 text-gray-400"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </form>
        )}

        {/* Search */}
        <div className="relative">
          <Search
            className={`w-3.5 h-3.5 text-gray-400 absolute ${
              isRtl ? 'right-2.5' : 'left-2.5'
            } top-1/2 -translate-y-1/2`}
          />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder={t.searchPrompts}
            className={`w-full bg-[#2a2b32] border border-transparent focus:border-white/20 rounded-xl ${
              isRtl ? 'pr-8 pl-7' : 'pl-8 pr-7'
            } py-1.5 text-xs text-white placeholder-gray-400 focus:outline-none transition-colors`}
          />
          {searchTerm && (
            <button
              onClick={() => setSearchTerm('')}
              className={`absolute ${
                isRtl ? 'left-2' : 'right-2'
              } top-1/2 -translate-y-1/2 text-gray-400 hover:text-white`}
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>

      {/* Middle Scrollable Section: Folders & Prompts */}
      <div className="flex-1 overflow-y-auto px-2 space-y-1 py-1 custom-scrollbar">
        {/* Folders */}
        {promptFolders.map((folder) => {
          const isOpen = openFolders[folder.id];
          const folderPrompts = filteredPrompts.filter(
            (p) => p.folderId === folder.id
          );

          return (
            <div key={folder.id} className="space-y-0.5">
              <div className="group flex items-center justify-between px-2.5 py-1.5 rounded-lg hover:bg-white/5 text-xs text-gray-300 transition-colors">
                {editingFolderId === folder.id ? (
                  <div className="flex items-center gap-1 flex-1">
                    <input
                      type="text"
                      autoFocus
                      value={editingFolderName}
                      onChange={(e) => setEditingFolderName(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') handleSaveRenameFolder(folder.id);
                        if (e.key === 'Escape') setEditingFolderId(null);
                      }}
                      className="flex-1 bg-[#1e1e24] px-1.5 py-0.5 rounded text-white text-xs border border-emerald-500 focus:outline-none"
                    />
                    <button
                      onClick={() => handleSaveRenameFolder(folder.id)}
                      className="p-1 hover:text-emerald-400"
                    >
                      <Check className="w-3 h-3" />
                    </button>
                    <button
                      onClick={() => setEditingFolderId(null)}
                      className="p-1 hover:text-rose-400"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </div>
                ) : (
                  <>
                    <button
                      onClick={() => toggleFolder(folder.id)}
                      className="flex items-center gap-2 flex-1 text-left truncate font-medium"
                    >
                      {isOpen ? (
                        <FolderOpen className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                      ) : (
                        <FolderIcon className="w-3.5 h-3.5 text-gray-400 shrink-0" />
                      )}
                      <span className="truncate">{folder.name}</span>
                      <span className="text-[10px] text-gray-500 font-mono">
                        ({folderPrompts.length})
                      </span>
                    </button>

                    <div className="hidden group-hover:flex items-center gap-1 text-gray-400">
                      {confirmDeleteFolderId === folder.id ? (
                        <>
                          <button
                            onClick={() => onDeleteFolder(folder.id)}
                            className="p-1 hover:text-emerald-400"
                            title="Confirm delete"
                          >
                            <Check className="w-3 h-3" />
                          </button>
                          <button
                            onClick={() => setConfirmDeleteFolderId(null)}
                            className="p-1 hover:text-rose-400"
                          >
                            <X className="w-3 h-3" />
                          </button>
                        </>
                      ) : (
                        <>
                          <button
                            onClick={() => {
                              setEditingFolderId(folder.id);
                              setEditingFolderName(folder.name);
                            }}
                            className="p-1 hover:text-white"
                            title="Rename folder"
                          >
                            <Edit2 className="w-3 h-3" />
                          </button>
                          <button
                            onClick={() => setConfirmDeleteFolderId(folder.id)}
                            className="p-1 hover:text-rose-400"
                            title="Delete folder"
                          >
                            <Trash2 className="w-3 h-3" />
                          </button>
                        </>
                      )}
                    </div>
                  </>
                )}
              </div>

              {/* Inside Folder Prompts */}
              {isOpen && (
                <div
                  className={`pl-3 ${
                    isRtl ? 'border-r pr-3 pl-0 mr-2.5' : 'border-l pl-3 pr-0 ml-2.5'
                  } border-white/5 space-y-0.5`}
                >
                  {folderPrompts.length === 0 ? (
                    <div className="text-[11px] text-gray-500 py-1 pl-2">
                      {t.emptyFolder}
                    </div>
                  ) : (
                    folderPrompts.map((p) => renderPromptItem(p))
                  )}
                </div>
              )}
            </div>
          );
        })}

        {/* Root Prompts (Not in folder) */}
        {filteredPrompts
          .filter((p) => !p.folderId || !folders.some((f) => f.id === p.folderId))
          .map((p) => renderPromptItem(p))}

        {filteredPrompts.length === 0 && (
          <div className="text-center py-6 text-xs text-gray-500">
            {searchTerm ? t.noMatchingPrompts : t.noPromptsYet}
          </div>
        )}
      </div>

      {/* Bottom Hint */}
      <div className="p-3 border-t border-white/10 bg-[#1e1e22]/60 text-[11px] text-gray-400 flex items-center gap-2">
        <Sparkles className="w-4 h-4 text-emerald-400 shrink-0" />
        <span>{t.promptHint}</span>
      </div>
    </aside>
  );

  function renderPromptItem(prompt: Prompt) {
    return (
      <div
        key={prompt.id}
        onClick={() => onSelectPrompt(prompt)}
        className="group relative flex items-start justify-between px-2.5 py-2 rounded-xl cursor-pointer text-xs text-gray-300 hover:bg-[#2a2b32]/60 hover:text-white transition-colors"
      >
        <div className="flex items-start gap-2 truncate flex-1 pr-2">
          <FileText className="w-3.5 h-3.5 text-emerald-400 shrink-0 mt-0.5" />
          <div className="truncate">
            <div className="font-medium text-white truncate text-xs">
              {prompt.name}
            </div>
            {prompt.description && (
              <div className="text-[11px] text-gray-400 truncate mt-0.5">
                {prompt.description}
              </div>
            )}
          </div>
        </div>

        {/* Hover / Action buttons */}
        <div
          className="hidden group-hover:flex items-center gap-1 text-gray-400 shrink-0 pt-0.5"
          onClick={(e) => e.stopPropagation()}
        >
          {confirmDeletePromptId === prompt.id ? (
            <>
              <button
                onClick={() => onDeletePrompt(prompt.id)}
                className="p-1 hover:text-emerald-400"
                title="Confirm delete"
              >
                <Check className="w-3 h-3" />
              </button>
              <button
                onClick={() => setConfirmDeletePromptId(null)}
                className="p-1 hover:text-rose-400"
              >
                <X className="w-3 h-3" />
              </button>
            </>
          ) : (
            <>
              <button
                onClick={() => onEditPrompt(prompt)}
                className="p-1 hover:text-white"
                title="Edit prompt"
              >
                <Edit2 className="w-3 h-3" />
              </button>
              <button
                onClick={() => setConfirmDeletePromptId(prompt.id)}
                className="p-1 hover:text-rose-400"
                title="Delete prompt"
              >
                <Trash2 className="w-3 h-3" />
              </button>
            </>
          )}
        </div>
      </div>
    );
  }
};
