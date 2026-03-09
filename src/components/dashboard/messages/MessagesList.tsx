import { useRef, useEffect, useState } from "react";
import { motion } from "framer-motion";
import Icon from "@/components/ui/icon";
import { Message } from "@/store/messagesStore";
import { format } from "date-fns";
import { ru } from "date-fns/locale";

interface MessagesListProps {
  messages: Message[];
  currentUserEmail: string;
  typingUsers: string[];
  onOpenViewer: (photos: string[], index: number) => void;
}

export const MessagesList = ({
  messages,
  currentUserEmail,
  typingUsers,
  onOpenViewer,
}: MessagesListProps) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const prevMessagesLengthRef = useRef(0);
  const [copiedMessageId, setCopiedMessageId] = useState<string | null>(null);

  useEffect(() => {
    if (messages.length > prevMessagesLengthRef.current && containerRef.current) {
      containerRef.current.scrollTop = containerRef.current.scrollHeight;
    }
    prevMessagesLengthRef.current = messages.length;
  }, [messages]);

  const copyToClipboard = async (text: string, messageId: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedMessageId(messageId);
      setTimeout(() => setCopiedMessageId(null), 2000);
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  };

  return (
    <div ref={containerRef} className="flex-1 overflow-y-auto p-3 sm:p-4 space-y-3 sm:space-y-4 bg-gray-50">
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
              
              {message.isSystemMessage ? (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="flex justify-center my-3"
                >
                  <div className="bg-blue-50 border border-blue-200 rounded-xl px-4 py-2 max-w-md">
                    <p className="text-sm text-blue-900 text-center">{message.text}</p>
                  </div>
                </motion.div>
              ) : (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className={`flex ${isOwn ? "justify-end" : "justify-start"} gap-2`}
                >
                  {!isOwn && (
                    <div className="flex-shrink-0">
                      {message.senderPhoto ? (
                        <img
                          src={message.senderPhoto}
                          alt={message.senderName}
                          className="w-8 h-8 rounded-full object-cover border border-border"
                          onError={(e) => {
                            (e.target as HTMLImageElement).style.display = "none";
                            (e.target as HTMLImageElement).nextElementSibling?.classList.remove("hidden");
                          }}
                        />
                      ) : null}
                      <div className={`w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center${message.senderPhoto ? " hidden" : ""}`}>
                        <Icon name="User" size={14} className="text-primary" />
                      </div>
                    </div>
                  )}
                  
                  <div className={`max-w-[70%] ${isOwn ? "items-end" : "items-start"} flex flex-col group`}>
                    <div className={`relative ${isOwn ? "flex flex-col items-end" : "flex flex-col items-start"}`}>
                      <div
                        className={`rounded-2xl px-4 py-2 ${
                          isOwn
                            ? "bg-primary text-white rounded-br-sm"
                            : "bg-white border border-border rounded-bl-sm"
                        }`}
                      >
                        {message.photos && message.photos.length > 0 && (
                          <div className={`grid gap-2 mb-2 ${
                            message.photos.length === 1 ? 'grid-cols-1' :
                            message.photos.length === 2 ? 'grid-cols-2' :
                            'grid-cols-2'
                          }`}>
                            {message.photos.map((photo, photoIndex) => (
                              <img
                                key={photoIndex}
                                src={photo}
                                alt={`Фото ${photoIndex + 1}`}
                                className="rounded-lg w-full h-32 object-cover cursor-pointer hover:opacity-90 transition-opacity"
                                onClick={() => onOpenViewer(message.photos || [], photoIndex)}
                              />
                            ))}
                          </div>
                        )}
                        {message.text && (
                          <p className="text-sm whitespace-pre-wrap break-words">
                            {message.text}
                          </p>
                        )}
                      </div>
                      
                      {message.text && (
                        <button
                          onClick={() => copyToClipboard(message.text, message.id)}
                          className={`opacity-0 group-hover:opacity-100 transition-opacity mt-1 px-2 py-1 rounded text-xs flex items-center gap-1 ${
                            isOwn 
                              ? "bg-primary/20 text-primary hover:bg-primary/30" 
                              : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                          }`}
                        >
                          <Icon name={copiedMessageId === message.id ? "Check" : "Copy"} size={12} />
                          <span>{copiedMessageId === message.id ? "Скопировано" : "Копировать"}</span>
                        </button>
                      )}
                    </div>
                    
                    <span className="text-xs text-muted-foreground mt-1 px-2">
                      {format(message.createdAt, "HH:mm", { locale: ru })}
                    </span>
                  </div>
                </motion.div>
              )}
            </div>
          );
        })
      )}
      
      {typingUsers.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 10 }}
          className="flex justify-start"
        >
          <div className="bg-white border border-border rounded-2xl rounded-bl-sm px-4 py-2 flex items-center gap-2">
            <span className="text-sm text-muted-foreground">
              {typingUsers.join(', ')} печатает
            </span>
            <div className="flex gap-1">
              <motion.span
                animate={{ opacity: [0.3, 1, 0.3] }}
                transition={{ duration: 1.5, repeat: Infinity, delay: 0 }}
                className="w-1.5 h-1.5 bg-muted-foreground rounded-full"
              />
              <motion.span
                animate={{ opacity: [0.3, 1, 0.3] }}
                transition={{ duration: 1.5, repeat: Infinity, delay: 0.2 }}
                className="w-1.5 h-1.5 bg-muted-foreground rounded-full"
              />
              <motion.span
                animate={{ opacity: [0.3, 1, 0.3] }}
                transition={{ duration: 1.5, repeat: Infinity, delay: 0.4 }}
                className="w-1.5 h-1.5 bg-muted-foreground rounded-full"
              />
            </div>
          </div>
        </motion.div>
      )}
      
      <div ref={messagesEndRef} />
    </div>
  );
};

export default MessagesList;