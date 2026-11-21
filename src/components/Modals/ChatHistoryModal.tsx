import React, { useState } from 'react';
import {
  X,
  Search,
  MessageSquare,
  Trash2,
  Calendar,
  Clock,
  ArrowRight,
  Download,
  AlertTriangle,
  Check,
} from 'lucide-react';
import { Conversation } from '../../types/chat';

interface ChatHistoryModalProps {
  isOpen: boolean;
  onClose: () => void;
  conversations: Conversation[];
  selectedConversationId: string;
  onSelectConversation: (id: string) => void;
  onDeleteConversation: (id: string) => void;
  onClearAllConversations: () => void;
  onExportData: () => void;
}

export const ChatHistoryModal: React.FC<ChatHistoryModalProps> = ({
  isOpen,
  onClose,
  conversations,
  selectedConversationId,
  onSelectConversation,
  onDeleteConversation,
  onClearAllConversations,
  onExportData,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [showClearConfirm, setShowClearConfirm] = useState(false);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);

  if (!isOpen) return null;

  // Search through titles AND individual message contents
  const filtered = conversations.filter((c) => {
    const term = searchTerm.toLowerCase().trim();
    if (!term) return true;
    const matchesTitle = c.name.toLowerCase().includes(term);
    const matchesMessages = c.messages.some((m) =>
      m.content.toLowerCase().includes(term)
    );
    return matchesTitle || matchesMessages;
  });

  const formatDate = (timestamp?: number) => {
    if (!timestamp) return 'Recent';
    const date = new Date(timestamp);
    return date.toLocaleDateString(undefined, {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-xs p-4">
      <div className="bg-[#202123] border border-white/10 rounded-2xl shadow-2xl w-full max-w-3xl max-h-[85vh] flex flex-col overflow-hidden text-gray-100 animate-in fade-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-white/10 bg-[#2b2c2f]/50">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-emerald-500/10 flex items-center justify-center text-emerald-400 border border-emerald-500/20">
              <MessageSquare className="w-4 h-4" />
            </div>
            <div>
              <h2 className="font-semibold text-base text-white">Chat History Management</h2>
              <p className="text-xs text-gray-400">
                {conversations.length} total conversation{conversations.length === 1 ? '' : 's'} recorded
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-white p-1 rounded-lg hover:bg-white/5 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Search & Actions Bar */}
        <div className="p-4 border-b border-white/10 bg-[#25262b]/40 flex flex-wrap gap-2 items-center justify-between">
          <div className="relative flex-1 min-w-[240px]">
            <Search className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              autoFocus
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search conversations by title or message contents..."
              className="w-full bg-[#1e1e24] border border-white/10 focus:border-emerald-500/80 rounded-xl pl-9 pr-8 py-2 text-xs text-white placeholder-gray-400 focus:outline-none transition-colors"
            />
            {searchTerm && (
              <button
                onClick={() => setSearchTerm('')}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-white"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={onExportData}
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl border border-white/10 hover:bg-white/5 text-gray-300 hover:text-white text-xs font-medium transition-colors"
            >
              <Download className="w-3.5 h-3.5 text-gray-400" />
              <span>Export History</span>
            </button>

            {showClearConfirm ? (
              <div className="flex items-center gap-1 bg-rose-500/10 border border-rose-500/20 px-2.5 py-1.5 rounded-xl">
                <span className="text-xs text-rose-300 font-medium mr-1">
                  Delete all history?
                </span>
                <button
                  onClick={() => {
                    onClearAllConversations();
                    setShowClearConfirm(false);
                    onClose();
                  }}
                  className="px-2 py-1 bg-rose-600 hover:bg-rose-500 text-white rounded-lg text-xs font-medium"
                >
                  Yes, Delete All
                </button>
                <button
                  onClick={() => setShowClearConfirm(false)}
                  className="px-2 py-1 bg-white/10 hover:bg-white/20 text-gray-300 rounded-lg text-xs"
                >
                  Cancel
                </button>
              </div>
            ) : (
              <button
                onClick={() => setShowClearConfirm(true)}
                className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-rose-500/10 border border-rose-500/20 hover:bg-rose-500/20 text-rose-300 text-xs font-medium transition-colors"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Clear All History</span>
              </button>
            )}
          </div>
        </div>

        {/* Conversation List */}
        <div className="flex-1 overflow-y-auto p-4 space-y-2.5 custom-scrollbar">
          {filtered.length === 0 ? (
            <div className="text-center py-16 text-gray-400">
              <MessageSquare className="w-10 h-10 mx-auto text-gray-600 mb-2 stroke-1" />
              <div className="text-sm font-medium text-gray-300">
                {searchTerm ? 'No matching conversations found' : 'No conversations in history'}
              </div>
              <p className="text-xs text-gray-500 mt-1">
                {searchTerm
                  ? 'Try searching with different keywords.'
                  : 'Start a new chat to begin building your conversation history.'}
              </p>
            </div>
          ) : (
            filtered.map((conv) => {
              const isSelected = conv.id === selectedConversationId;
              const lastMessage =
                conv.messages.length > 0
                  ? conv.messages[conv.messages.length - 1].content
                  : 'No messages yet';

              const matchingMessagesCount = searchTerm.trim()
                ? conv.messages.filter((m) =>
                    m.content.toLowerCase().includes(searchTerm.toLowerCase().trim())
                  ).length
                : 0;

              return (
                <div
                  key={conv.id}
                  className={`p-3.5 rounded-xl border transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-3 ${
                    isSelected
                      ? 'bg-emerald-500/10 border-emerald-500/40 text-white shadow-xs'
                      : 'bg-[#2a2b32]/40 border-white/5 hover:border-white/15 hover:bg-[#2a2b32]/70 text-gray-300'
                  }`}
                >
                  <div
                    onClick={() => {
                      onSelectConversation(conv.id);
                      onClose();
                    }}
                    className="flex-1 min-w-0 cursor-pointer"
                  >
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-semibold text-sm text-white truncate">
                        {conv.name}
                      </span>
                      {isSelected && (
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-medium bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                          Active Chat
                        </span>
                      )}
                      {matchingMessagesCount > 0 && (
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-medium bg-amber-500/20 text-amber-300 border border-amber-500/30">
                          {matchingMessagesCount} match{matchingMessagesCount === 1 ? '' : 'es'} in messages
                        </span>
                      )}
                    </div>

                    <p className="text-xs text-gray-400 line-clamp-1 leading-relaxed">
                      {lastMessage}
                    </p>

                    <div className="flex items-center gap-4 mt-2 text-[11px] text-gray-500 font-mono">
                      <span className="flex items-center gap-1">
                        <Calendar className="w-3 h-3 text-gray-400" />
                        {formatDate(conv.updatedAt || conv.createdAt)}
                      </span>
                      <span>•</span>
                      <span>{conv.messages.length} message{conv.messages.length === 1 ? '' : 's'}</span>
                      <span>•</span>
                      <span className="text-gray-400 font-sans">{conv.model}</span>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-2 shrink-0 pt-2 sm:pt-0 border-t sm:border-t-0 border-white/5">
                    {deleteConfirmId === conv.id ? (
                      <div className="flex items-center gap-1 bg-rose-500/10 border border-rose-500/20 p-1 rounded-lg">
                        <button
                          onClick={() => {
                            onDeleteConversation(conv.id);
                            setDeleteConfirmId(null);
                          }}
                          className="px-2 py-1 bg-rose-600 hover:bg-rose-500 text-white rounded text-xs font-medium"
                          title="Confirm Delete"
                        >
                          Confirm
                        </button>
                        <button
                          onClick={() => setDeleteConfirmId(null)}
                          className="px-2 py-1 bg-white/10 hover:bg-white/20 text-gray-300 rounded text-xs"
                        >
                          Cancel
                        </button>
                      </div>
                    ) : (
                      <button
                        onClick={() => setDeleteConfirmId(conv.id)}
                        className="p-2 rounded-lg text-gray-400 hover:text-rose-400 hover:bg-rose-500/10 transition-colors"
                        title="Delete this conversation"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}

                    <button
                      onClick={() => {
                        onSelectConversation(conv.id);
                        onClose();
                      }}
                      className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-medium shadow-xs transition-colors"
                    >
                      <span>Open Chat</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-3 border-t border-white/10 bg-[#25262b]/30 flex justify-between items-center text-xs text-gray-400">
          <span>Conversations are persisted in local storage.</span>
          <button
            onClick={onClose}
            className="px-4 py-1.5 rounded-lg bg-white/10 hover:bg-white/15 text-white font-medium transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
