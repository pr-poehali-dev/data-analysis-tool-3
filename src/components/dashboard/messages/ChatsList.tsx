import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Icon from "@/components/ui/icon";
import { Chat, messagesStore } from "@/store/messagesStore";
import { formatDistanceToNow } from "date-fns";
import { ru } from "date-fns/locale";

interface ChatsListProps {
  chats: Chat[];
  selectedChatId?: string;
  onChatSelect: (chat: Chat) => void;
  onChatDeleted?: (chatId: string) => void;
  currentUserEmail: string;
}

export const ChatsList = ({ chats, selectedChatId, onChatSelect, onChatDeleted, currentUserEmail }: ChatsListProps) => {
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const handleDelete = async (e: React.MouseEvent, chat: Chat) => {
    e.stopPropagation();
    const confirmed = window.confirm('Удалить этот чат и все сообщения?');
    if (!confirmed) return;

    setDeletingId(chat.id);
    const result = await messagesStore.deleteChat(chat.id);
    setDeletingId(null);

    if (!result.success) {
      if (result.error?.includes('эскроу')) {
        alert('Нельзя удалить чат — по нему есть активная эскроу-сделка. Дождитесь завершения или отмены сделки.');
      } else {
        alert(result.error || 'Ошибка удаления');
      }
      return;
    }

    onChatDeleted?.(chat.id);
  };

  if (chats.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-full text-center p-8">
        <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mb-4">
          <Icon name="MessageSquare" size={32} className="text-muted-foreground" />
        </div>
        <h3 className="text-lg font-semibold text-foreground mb-2">Нет сообщений</h3>
        <p className="text-sm text-muted-foreground max-w-xs">
          Чаты появятся после того, как вы предложите варианты арендаторам
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      <AnimatePresence>
        {chats.map((chat, index) => {
          const isRecommender = chat.recommenderEmail === currentUserEmail;
          const otherUserName = isRecommender ? chat.tenantName : chat.recommenderName;
          const otherUserPhoto = isRecommender ? chat.tenantPhoto : chat.recommenderPhoto;
          const unreadCount = chat.unreadCount || 0;
          const isDeleting = deletingId === chat.id;

          return (
            <motion.div
              key={chat.id}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, height: 0, marginBottom: 0 }}
              transition={{ delay: index * 0.05 }}
              className="relative group"
            >
              <button
                onClick={() => onChatSelect(chat)}
                disabled={isDeleting}
                className={`w-full text-left p-4 rounded-lg transition-all ${
                  selectedChatId === chat.id
                    ? "bg-primary/10 border-2 border-primary"
                    : "bg-white border border-border hover:bg-gray-50"
                } ${isDeleting ? 'opacity-50' : ''}`}
              >
                <div className="flex items-start gap-3">
                  {otherUserPhoto ? (
                    <img
                      src={otherUserPhoto}
                      alt={otherUserName}
                      className="w-12 h-12 rounded-full object-cover flex-shrink-0 border-2 border-primary/20"
                      onError={(e) => {
                        (e.target as HTMLImageElement).style.display = "none";
                        (e.target as HTMLImageElement).nextElementSibling?.classList.remove("hidden");
                      }}
                    />
                  ) : null}
                  <div className={`w-12 h-12 bg-primary/20 rounded-full flex items-center justify-center flex-shrink-0${otherUserPhoto ? " hidden" : ""}`}>
                    <Icon name="User" size={20} className="text-primary" />
                  </div>
                  
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-1">
                      <h3 className="font-semibold text-foreground truncate pr-6">
                        {otherUserName}
                      </h3>
                      {unreadCount > 0 && (
                        <span className="ml-2 px-2 py-0.5 bg-primary text-white text-xs font-bold rounded-full">
                          {unreadCount}
                        </span>
                      )}
                    </div>
                    
                    <p className="text-xs text-muted-foreground mb-1 truncate">
                      {chat.requestName}
                    </p>
                    
                    {chat.lastMessage && (
                      <div className="flex items-center justify-between gap-2">
                        <p className="text-sm text-muted-foreground truncate flex-1">
                          {chat.lastMessage}
                        </p>
                        {chat.lastMessageTime && (
                          <span className="text-xs text-muted-foreground flex-shrink-0">
                            {formatDistanceToNow(chat.lastMessageTime, { locale: ru, addSuffix: true })}
                          </span>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              </button>

              <button
                onClick={(e) => handleDelete(e, chat)}
                disabled={isDeleting}
                className="absolute top-3 right-3 opacity-0 group-hover:opacity-100 transition-opacity p-1.5 rounded-md hover:bg-red-50 text-muted-foreground hover:text-red-500"
                title="Удалить чат"
              >
                {isDeleting ? (
                  <Icon name="Loader2" size={16} className="animate-spin" />
                ) : (
                  <Icon name="Trash2" size={16} />
                )}
              </button>
            </motion.div>
          );
        })}
      </AnimatePresence>
    </div>
  );
};