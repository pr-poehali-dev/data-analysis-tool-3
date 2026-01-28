import { useState, useEffect, useRef } from "react";
import { motion } from "framer-motion";
import Icon from "@/components/ui/icon";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Chat, Message, messagesStore } from "@/store/messagesStore";
import { format } from "date-fns";
import { ru } from "date-fns/locale";

interface ChatWindowProps {
  chat: Chat;
  currentUserEmail: string;
  currentUserName: string;
}

export const ChatWindow = ({ chat, currentUserEmail, currentUserName }: ChatWindowProps) => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const isRecommender = chat.recommenderEmail === currentUserEmail;
  const otherUserName = isRecommender ? chat.tenantName : chat.recommenderName;

  useEffect(() => {
    const loadMessages = () => {
      const chatMessages = messagesStore.getMessages(chat.id);
      setMessages(chatMessages);
    };

    loadMessages();
    messagesStore.markChatAsRead(chat.id, currentUserEmail);

    const unsubscribe = messagesStore.subscribe(loadMessages);
    return unsubscribe;
  }, [chat.id, currentUserEmail]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSendMessage = () => {
    if (!newMessage.trim()) return;

    messagesStore.sendMessage({
      chatId: chat.id,
      senderId: currentUserEmail,
      senderName: currentUserName,
      text: newMessage.trim(),
    });

    setNewMessage("");
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  return (
    <div className="flex flex-col h-full">
      <div className="bg-white border-b border-border p-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-primary/20 rounded-full flex items-center justify-center">
            <Icon name="User" size={18} className="text-primary" />
          </div>
          <div>
            <h3 className="font-semibold text-foreground">{otherUserName}</h3>
            <p className="text-xs text-muted-foreground">{chat.requestName}</p>
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-gray-50">
        {messages.length === 0 ? (
          <div className="flex items-center justify-center h-full">
            <div className="text-center">
              <div className="w-12 h-12 bg-muted rounded-full flex items-center justify-center mx-auto mb-3">
                <Icon name="MessageCircle" size={24} className="text-muted-foreground" />
              </div>
              <p className="text-sm text-muted-foreground">
                Начните диалог с арендатором
              </p>
            </div>
          </div>
        ) : (
          messages.map((message, index) => {
            const isOwn = message.senderId === currentUserEmail;
            const showDate = index === 0 || 
              format(messages[index - 1].createdAt, "d MMMM yyyy", { locale: ru }) !== 
              format(message.createdAt, "d MMMM yyyy", { locale: ru });

            return (
              <div key={message.id}>
                {showDate && (
                  <div className="flex items-center justify-center my-4">
                    <span className="px-3 py-1 bg-white border border-border rounded-full text-xs text-muted-foreground">
                      {format(message.createdAt, "d MMMM yyyy", { locale: ru })}
                    </span>
                  </div>
                )}
                
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className={`flex ${isOwn ? "justify-end" : "justify-start"}`}
                >
                  <div className={`max-w-[70%] ${isOwn ? "items-end" : "items-start"} flex flex-col`}>
                    <div
                      className={`rounded-2xl px-4 py-2 ${
                        isOwn
                          ? "bg-primary text-white rounded-br-sm"
                          : "bg-white border border-border rounded-bl-sm"
                      }`}
                    >
                      <p className="text-sm whitespace-pre-wrap break-words">
                        {message.text}
                      </p>
                    </div>
                    <span className="text-xs text-muted-foreground mt-1 px-2">
                      {format(message.createdAt, "HH:mm", { locale: ru })}
                    </span>
                  </div>
                </motion.div>
              </div>
            );
          })
        )}
        <div ref={messagesEndRef} />
      </div>

      <div className="bg-white border-t border-border p-4">
        <div className="flex gap-2">
          <Textarea
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            onKeyDown={handleKeyPress}
            placeholder="Напишите сообщение..."
            className="resize-none"
            rows={2}
          />
          <Button
            onClick={handleSendMessage}
            disabled={!newMessage.trim()}
            className="self-end"
          >
            <Icon name="Send" size={18} />
          </Button>
        </div>
        <p className="text-xs text-muted-foreground mt-2">
          Нажмите Enter для отправки, Shift+Enter для новой строки
        </p>
      </div>
    </div>
  );
};
