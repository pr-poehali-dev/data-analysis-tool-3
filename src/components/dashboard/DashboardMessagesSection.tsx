import { useState, useEffect } from "react";
import { Chat, messagesStore } from "@/store/messagesStore";
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
  const [chats, setChats] = useState<Chat[]>([]);
  const [selectedChat, setSelectedChat] = useState<Chat | undefined>(undefined);

  useEffect(() => {
    const loadChats = () => {
      const userChats = messagesStore.getUserChats(user.email);
      setChats(userChats);
      
      if (selectedChat) {
        const updatedChat = userChats.find(c => c.id === selectedChat.id);
        setSelectedChat(updatedChat);
      }
    };

    loadChats();
    const unsubscribe = messagesStore.subscribe(loadChats);
    return unsubscribe;
  }, [user.email, selectedChat?.id]);

  const handleChatSelect = (chat: Chat) => {
    setSelectedChat(chat);
    messagesStore.markChatAsRead(chat.id, user.email);
  };

  return (
    <div>
      <h2 className="text-3xl font-bold text-foreground mb-6">Сообщения</h2>
      
      <div className="grid lg:grid-cols-3 gap-6 h-[calc(100vh-200px)]">
        <div className="lg:col-span-1 bg-gray-50 rounded-lg p-4 overflow-y-auto">
          <ChatsList
            chats={chats}
            selectedChatId={selectedChat?.id}
            onChatSelect={handleChatSelect}
            currentUserEmail={user.email}
          />
        </div>

        <div className="lg:col-span-2 bg-white border border-border rounded-lg overflow-hidden">
          {selectedChat ? (
            <ChatWindow
              chat={selectedChat}
              currentUserEmail={user.email}
              currentUserName={`${user.firstName} ${user.lastName}`}
              currentUserPhoto={user.photo}
            />
          ) : (
            <div className="flex items-center justify-center h-full">
              <div className="text-center">
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