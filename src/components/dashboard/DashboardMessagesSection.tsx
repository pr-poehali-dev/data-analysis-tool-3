import { useState, useEffect, useRef } from "react";
import { useLocation } from "react-router-dom";
import { Chat, messagesStore } from "@/store/messagesStore";
import { authStore } from "@/store/authStore";
import { ChatsList } from "./messages/ChatsList";
import { ChatWindow } from "./messages/ChatWindow";
import Icon from "@/components/ui/icon";

interface DashboardMessagesSectionProps {
  user: {
    firstName: string;
    lastName: string;
    email: string;
    photo?: string;
  };
}

export const DashboardMessagesSection = ({ user }: DashboardMessagesSectionProps) => {
  const location = useLocation();
  const [chats, setChats] = useState<Chat[]>([]);
  const [selectedChat, setSelectedChat] = useState<Chat | undefined>(undefined);
  const selectedChatIdRef = useRef<string | undefined>(undefined);

  useEffect(() => {
    const loadChats = () => {
      const userChats = messagesStore.getUserChats(user.email);
      setChats(userChats);
      
      const currentId = selectedChatIdRef.current;
      if (currentId) {
        const updatedChat = userChats.find(c => c.id === currentId);
        if (updatedChat) {
          setSelectedChat(updatedChat);
        }
      }
    };

    const init = async () => {
      await authStore.restoreSession();
      await messagesStore.fetchUserChats();
      loadChats();
    };
    init();

    loadChats();
    const unsubscribe = messagesStore.subscribe(loadChats);
    return unsubscribe;
  }, [user.email]);

  useEffect(() => {
    const state = location.state as { chatId?: string } | null;
    if (state?.chatId) {
      const userChats = messagesStore.getUserChats(user.email);
      const targetChat = userChats.find(c => c.id === state.chatId);
      if (targetChat) {
        selectedChatIdRef.current = targetChat.id;
        setSelectedChat(targetChat);
        messagesStore.markChatAsRead(targetChat.id, user.email);
      }
    }
  }, [location.state, user.email]);

  const handleChatSelect = (chat: Chat) => {
    selectedChatIdRef.current = chat.id;
    setSelectedChat(chat);
    messagesStore.markChatAsRead(chat.id, user.email);
  };

  const handleBackToList = () => {
    selectedChatIdRef.current = undefined;
    setSelectedChat(undefined);
  };

  return (
    <div>
      <div className="flex items-center gap-2 mb-1">
        {selectedChat && (
          <button 
            onClick={handleBackToList}
            className="lg:hidden p-1 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <Icon name="ArrowLeft" size={18} className="text-foreground" />
          </button>
        )}
        <h2 className="text-lg font-bold text-foreground">Сообщения</h2>
      </div>
      
      <div className="grid lg:grid-cols-3 gap-3 h-[calc(100vh-110px)]">
        <div className={`lg:col-span-1 bg-gray-50 rounded-lg p-3 sm:p-4 overflow-y-auto ${
          selectedChat ? 'hidden lg:block' : 'block'
        }`}>
          <ChatsList
            chats={chats}
            selectedChatId={selectedChat?.id}
            onChatSelect={handleChatSelect}
            onChatDeleted={(chatId) => {
              if (selectedChat?.id === chatId) {
                selectedChatIdRef.current = undefined;
                setSelectedChat(undefined);
              }
            }}
            currentUserEmail={user.email}
          />
        </div>

        <div className={`lg:col-span-2 bg-white border border-border rounded-lg overflow-hidden ${
          selectedChat ? 'block' : 'hidden lg:block'
        }`}>
          {selectedChat ? (
            <ChatWindow
              chat={selectedChat}
              currentUserEmail={user.email}
              currentUserName={`${user.firstName} ${user.lastName}`}
              currentUserPhoto={user.photo}
            />
          ) : (
            <div className="flex items-center justify-center h-full">
              <div className="text-center p-6">
                <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mx-auto mb-4">
                  <Icon name="MessageSquare" size={32} className="text-muted-foreground" />
                </div>
                <h3 className="text-lg font-semibold text-foreground mb-2">
                  Выберите чат
                </h3>
                <p className="text-sm text-muted-foreground max-w-sm">
                  Выберите диалог из списка слева, чтобы начать общение
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};