import React, { useState } from 'react';
import {
  Plus,
  FolderPlus,
  Folder as FolderIcon,
  FolderOpen,
  MessageSquare,
  Search,
  Trash2,
  Edit2,
  Check,
  X,
  Download,
  Upload,
  Moon,
  Sun,
  Sliders,
  PanelLeftClose,
  History,
} from 'lucide-react';
import { AppSettings, Conversation, Folder } from '../../types/chat';
import { translations, Language } from '../../utils/translations';

interface ChatbarProps {
  conversations: Conversation[];
  selectedConversationId: string;
  onSelectConversation: (id: string) => void;
  onNewConversation: () => void;
  onDeleteConversation: (id: string) => void;
  onUpdateConversationName: (id: string, name: string) => void;
  onClearAllConversations: () => void;
  folders: Folder[];
  onCreateFolder: (name: string, type: 'chat' | 'prompt') => void;
  onDeleteFolder: (id: string) => void;
  onUpdateFolderName: (id: string, name: string) => void;
  onMoveConversationToFolder: (conversationId: string, folderId: string | null) => void;
  settings: AppSettings;
  onToggleTheme: () => void;
  onOpenSettings: () => void;
  onOpenHistoryModal: () => void;
  onExportData: () => void;
  onImportData: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onToggleSidebar: () => void;
  language: Language;
}

export const Chatbar: React.FC<ChatbarProps> = ({
  conversations,
  selectedConversationId,
  onSelectConversation,
  onNewConversation,
  onDeleteConversation,
  onUpdateConversationName,
  onClearAllConversations,
  folders,
  onCreateFolder,
  onDeleteFolder,
  onUpdateFolderName,
  onMoveConversationToFolder,
  settings,
  onToggleTheme,
  onOpenSettings,
  onOpenHistoryModal,
  onExportData,
  onImportData,
  onToggleSidebar,
  language,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [editingConvId, setEditingConvId] = useState<string | null>(null);
  const [editingConvName, setEditingConvName] = useState('');
  const [confirmDeleteConvId, setConfirmDeleteConvId] = useState<string | null>(null);

  const [openFolders, setOpenFolders] = useState<Record<string, boolean>>({
    'folder-general': true,
  });
  const [editingFolderId, setEditingFolderId] = useState<string | null>(null);
  const [editingFolderName, setEditingFolderName] = useState('');
  const [confirmDeleteFolderId, setConfirmDeleteFolderId] = useState<string | null>(null);

  const [isCreatingFolder, setIsCreatingFolder] = useState(false);
  const [newFolderName, setNewFolderName] = useState('');
  const [showClearConfirm, setShowClearConfirm] = useState(false);

  const fileInputRef = React.useRef<HTMLInputElement>(null);

  const t = translations[language];
  const isRtl = language === 'fa';
  const chatFolders = folders.filter((f) => f.type === 'chat');

  // Deep search: filter conversations by title OR any message contents!
  const filteredConversations = conversations.filter((c) => {
    const term = searchTerm.toLowerCase().trim();
    if (!term) return true;
    const nameMatch = c.name.toLowerCase().includes(term);
    const messageMatch = c.messages.some((m) =>
      m.content.toLowerCase().includes(term)
    );
    return nameMatch || messageMatch;
  });

  const toggleFolder = (folderId: string) => {
    setOpenFolders((prev) => ({
      ...prev,
      [folderId]: !prev[folderId],
    }));
  };

  const handleStartRenameConv = (conv: Conversation) => {
    setEditingConvId(conv.id);
    setEditingConvName(conv.name);
  };

  const handleSaveRenameConv = (id: string) => {
    if (editingConvName.trim()) {
      onUpdateConversationName(id, editingConvName.trim());
    }
    setEditingConvId(null);
  };

  const handleCreateFolder = (e: React.FormEvent) => {
    e.preventDefault();
    if (newFolderName.trim()) {
      onCreateFolder(newFolderName.trim(), 'chat');
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

  // Group root conversations by date
  const rootConversations = filteredConversations.filter(
    (c) => !c.folderId || !folders.some((f) => f.id === c.folderId)
  );

  const now = Date.now();
  const oneDayMs = 24 * 60 * 60 * 1000;
  const sevenDaysMs = 7 * oneDayMs;

  const todayChats = rootConversations.filter((c) => {
    const time = c.updatedAt || c.createdAt || now;
    return now - time < oneDayMs;
  });

  const previous7DaysChats = rootConversations.filter((c) => {
    const time = c.updatedAt || c.createdAt || now;
    const diff = now - time;
    return diff >= oneDayMs && diff < sevenDaysMs;
  });

  const olderChats = rootConversations.filter((c) => {
    const time = c.updatedAt || c.createdAt || now;
    return now - time >= sevenDaysMs;
  });

  return (
    <aside
      dir={isRtl ? 'rtl' : 'ltr'}
      className={`w-64 h-full bg-[#202123] ${
        isRtl ? 'border-l' : 'border-r'
      } border-white/10 flex flex-col shrink-0 select-none text-gray-200`}
    >
      {/* Top Action Buttons */}
      <div className="p-2 space-y-2">
        <div className="flex gap-1.5">
          <button
            onClick={onNewConversation}
            className="flex-1 flex items-center gap-2 px-3 py-2.5 rounded-xl border border-white/20 hover:bg-white/5 transition-colors text-xs font-semibold text-white shadow-xs"
          >
            <Plus className="w-4 h-4 text-emerald-400" />
            <span>{t.newChat}</span>
          </button>
          <button
            onClick={() => setIsCreatingFolder(true)}
            title={t.newFolder}
            className="flex items-center justify-center px-3 py-2.5 rounded-xl border border-white/20 hover:bg-white/5 text-gray-300 hover:text-white transition-colors"
          >
            <FolderPlus className="w-4 h-4" />
          </button>
          <button
            onClick={onToggleSidebar}
            title="Close sidebar"
            className="flex items-center justify-center px-2 py-2.5 rounded-xl border border-white/10 hover:bg-white/5 text-gray-400 hover:text-white transition-colors"
          >
            <PanelLeftClose className={`w-4 h-4 ${isRtl ? 'rotate-180' : ''}`} />
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

        {/* Search Within Conversations */}
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
            placeholder={t.searchChats}
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

      {/* Middle Scrollable Section: Folders & Grouped Conversations */}
      <div className="flex-1 overflow-y-auto px-2 space-y-2 py-1 custom-scrollbar">
        {/* Folders */}
        {chatFolders.length > 0 && (
          <div className="space-y-0.5">
            {chatFolders.map((folder) => {
              const isOpen = openFolders[folder.id];
              const folderChats = filteredConversations.filter(
                (c) => c.folderId === folder.id
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
                            ({folderChats.length})
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

                  {/* Inside Folder Chats */}
                  {isOpen && (
                    <div
                      className={`pl-3 ${
                        isRtl ? 'border-r pr-3 pl-0 mr-2.5' : 'border-l pl-3 pr-0 ml-2.5'
                      } border-white/5 space-y-0.5`}
                    >
                      {folderChats.length === 0 ? (
                        <div className="text-[11px] text-gray-500 py-1 pl-2">
                          {t.emptyFolder}
                        </div>
                      ) : (
                        folderChats.map((c) => renderConversationItem(c))
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}

        {/* Group: Today */}
        {todayChats.length > 0 && (
          <div className="space-y-0.5">
            <div className="px-2 pt-2 pb-1 text-[10px] font-semibold text-gray-500 uppercase tracking-wider">
              {t.today}
            </div>
            {todayChats.map((c) => renderConversationItem(c))}
          </div>
        )}

        {/* Group: Previous 7 Days */}
        {previous7DaysChats.length > 0 && (
          <div className="space-y-0.5">
            <div className="px-2 pt-2 pb-1 text-[10px] font-semibold text-gray-500 uppercase tracking-wider">
              {t.previous7Days}
            </div>
            {previous7DaysChats.map((c) => renderConversationItem(c))}
          </div>
        )}

        {/* Group: Older */}
        {olderChats.length > 0 && (
          <div className="space-y-0.5">
            <div className="px-2 pt-2 pb-1 text-[10px] font-semibold text-gray-500 uppercase tracking-wider">
              {t.older}
            </div>
            {olderChats.map((c) => renderConversationItem(c))}
          </div>
        )}

        {filteredConversations.length === 0 && (
          <div className="text-center py-8 text-xs text-gray-500">
            {searchTerm ? t.noMatchingChats : t.noChatsYet}
          </div>
        )}
      </div>

      {/* Bottom Controls */}
      <div className="p-2 border-t border-white/10 bg-[#1e1e22]/60 space-y-0.5 text-xs">
        {/* Chat History Manager button */}
        <button
          onClick={onOpenHistoryModal}
          className="w-full flex items-center justify-between px-3 py-2 rounded-xl hover:bg-white/5 text-gray-300 hover:text-white transition-colors group"
        >
          <div className="flex items-center gap-2.5">
            <History className="w-3.5 h-3.5 text-emerald-400" />
            <span className="font-medium">{t.chatHistory}</span>
          </div>
          <span className="text-[10px] font-mono text-gray-500 group-hover:text-gray-400">
            {conversations.length}
          </span>
        </button>

        {/* Clear conversations */}
        {showClearConfirm ? (
          <div className="flex items-center justify-between p-2 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-300">
            <span className="text-[11px]">{t.deleteAllHistoryConfirm}</span>
            <div className="flex items-center gap-1">
              <button
                onClick={() => {
                  onClearAllConversations();
                  setShowClearConfirm(false);
                }}
                className="px-2 py-0.5 bg-rose-600 hover:bg-rose-500 text-white rounded text-[11px]"
              >
                {t.yes}
              </button>
              <button
                onClick={() => setShowClearConfirm(false)}
                className="px-2 py-0.5 bg-white/10 hover:bg-white/20 text-gray-300 rounded text-[11px]"
              >
                {t.no}
              </button>
            </div>
          </div>
        ) : (
          <button
            onClick={() => setShowClearConfirm(true)}
            className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl hover:bg-white/5 text-gray-300 hover:text-white transition-colors"
          >
            <Trash2 className="w-3.5 h-3.5 text-gray-400" />
            <span>{t.clearConversations}</span>
          </button>
        )}

        {/* Import / Export */}
        <input
          type="file"
          ref={fileInputRef}
          onChange={onImportData}
          accept=".json"
          className="hidden"
        />
        <button
          onClick={() => fileInputRef.current?.click()}
          className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl hover:bg-white/5 text-gray-300 hover:text-white transition-colors"
        >
          <Upload className="w-3.5 h-3.5 text-gray-400" />
          <span>{t.importData}</span>
        </button>

        <button
          onClick={onExportData}
          className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl hover:bg-white/5 text-gray-300 hover:text-white transition-colors"
        >
          <Download className="w-3.5 h-3.5 text-gray-400" />
          <span>{t.exportData}</span>
        </button>

        {/* Theme toggle */}
        <button
          onClick={onToggleTheme}
          className="w-full flex items-center justify-between px-3 py-2 rounded-xl hover:bg-white/5 text-gray-300 hover:text-white transition-colors"
        >
          <div className="flex items-center gap-2.5">
            {settings.theme === 'dark' ? (
              <Moon className="w-3.5 h-3.5 text-gray-400" />
            ) : (
              <Sun className="w-3.5 h-3.5 text-amber-400" />
            )}
            <span>{settings.theme === 'dark' ? t.darkMode : t.lightMode}</span>
          </div>
        </button>

        {/* Settings button */}
        <button
          onClick={onOpenSettings}
          className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl hover:bg-white/5 text-gray-300 hover:text-white transition-colors"
        >
          <Sliders className="w-3.5 h-3.5 text-gray-400" />
          <span>{t.settings}</span>
        </button>
      </div>
    </aside>
  );

  function renderConversationItem(conv: Conversation) {
    const isSelected = selectedConversationId === conv.id;

    if (editingConvId === conv.id) {
      return (
        <div
          key={conv.id}
          className="flex items-center gap-1 p-1 bg-[#2a2b32] rounded-xl border border-emerald-500/50"
        >
          <input
            type="text"
            autoFocus
            value={editingConvName}
            onChange={(e) => setEditingConvName(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') handleSaveRenameConv(conv.id);
              if (e.key === 'Escape') setEditingConvId(null);
            }}
            className="flex-1 bg-transparent px-1.5 py-0.5 text-xs text-white focus:outline-none"
          />
          <button
            onClick={() => handleSaveRenameConv(conv.id)}
            className="p-1 hover:text-emerald-400 text-gray-300"
          >
            <Check className="w-3 h-3" />
          </button>
          <button
            onClick={() => setEditingConvId(null)}
            className="p-1 hover:text-rose-400 text-gray-400"
          >
            <X className="w-3 h-3" />
          </button>
        </div>
      );
    }

    return (
      <div
        key={conv.id}
        onClick={() => onSelectConversation(conv.id)}
        className={`group relative flex items-center justify-between px-2.5 py-2 rounded-xl cursor-pointer text-xs transition-colors ${
          isSelected
            ? 'bg-[#343541] text-white font-medium border border-white/10 shadow-xs'
            : 'text-gray-300 hover:bg-[#2a2b32]/60 hover:text-white'
        }`}
      >
        <div className="flex items-center gap-2.5 truncate flex-1 pr-2">
          <MessageSquare
            className={`w-3.5 h-3.5 shrink-0 ${
              isSelected ? 'text-emerald-400' : 'text-gray-400'
            }`}
          />
          <span className="truncate">{conv.name}</span>
        </div>

        {/* Hover / Action buttons */}
        <div
          className={`items-center gap-1 text-gray-400 shrink-0 ${
            isSelected ? 'flex' : 'hidden group-hover:flex'
          }`}
          onClick={(e) => e.stopPropagation()}
        >
          {confirmDeleteConvId === conv.id ? (
            <>
              <button
                onClick={() => onDeleteConversation(conv.id)}
                className="p-1 hover:text-emerald-400"
                title="Confirm delete"
              >
                <Check className="w-3 h-3" />
              </button>
              <button
                onClick={() => setConfirmDeleteConvId(null)}
                className="p-1 hover:text-rose-400"
              >
                <X className="w-3 h-3" />
              </button>
            </>
          ) : (
            <>
              <button
                onClick={() => handleStartRenameConv(conv)}
                className="p-1 hover:text-white"
                title="Rename chat"
              >
                <Edit2 className="w-3 h-3" />
              </button>
              <button
                onClick={() => setConfirmDeleteConvId(conv.id)}
                className="p-1 hover:text-rose-400"
                title="Delete chat"
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
