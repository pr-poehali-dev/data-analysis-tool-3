import { useState, useEffect, useRef } from "react";
import { motion } from "framer-motion";
import Icon from "@/components/ui/icon";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { ImageViewer } from "@/components/ui/image-viewer";
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
  const [attachedPhotos, setAttachedPhotos] = useState<File[]>([]);
  const [previewUrls, setPreviewUrls] = useState<string[]>([]);
  const [viewerImages, setViewerImages] = useState<string[]>([]);
  const [viewerIndex, setViewerIndex] = useState(0);
  const [showViewer, setShowViewer] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
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

  const handlePhotoAttach = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (attachedPhotos.length + files.length > 5) {
      alert('Максимум 5 фотографий за раз');
      return;
    }
    
    setAttachedPhotos([...attachedPhotos, ...files]);
    
    const urls = files.map(file => URL.createObjectURL(file));
    setPreviewUrls([...previewUrls, ...urls]);
  };

  const removePhoto = (index: number) => {
    URL.revokeObjectURL(previewUrls[index]);
    setAttachedPhotos(attachedPhotos.filter((_, i) => i !== index));
    setPreviewUrls(previewUrls.filter((_, i) => i !== index));
  };

  const handleSendMessage = () => {
    if (!newMessage.trim() && attachedPhotos.length === 0) return;

    const photoUrls = attachedPhotos.map(photo => URL.createObjectURL(photo));

    messagesStore.sendMessage({
      chatId: chat.id,
      senderId: currentUserEmail,
      senderName: currentUserName,
      text: newMessage.trim() || '',
      photos: photoUrls.length > 0 ? photoUrls : undefined,
    });

    setNewMessage("");
    setAttachedPhotos([]);
    previewUrls.forEach(url => URL.revokeObjectURL(url));
    setPreviewUrls([]);
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
                              onClick={() => {
                                setViewerImages(message.photos || []);
                                setViewerIndex(photoIndex);
                                setShowViewer(true);
                              }}
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
        {previewUrls.length > 0 && (
          <div className="flex gap-2 mb-3 flex-wrap">
            {previewUrls.map((url, index) => (
              <div key={index} className="relative">
                <img
                  src={url}
                  alt={`Превью ${index + 1}`}
                  className="w-20 h-20 object-cover rounded-lg border border-border"
                />
                <button
                  onClick={() => removePhoto(index)}
                  className="absolute -top-2 -right-2 w-6 h-6 bg-red-500 text-white rounded-full flex items-center justify-center hover:bg-red-600 transition-colors"
                >
                  <Icon name="X" size={14} />
                </button>
              </div>
            ))}
          </div>
        )}
        
        <div className="flex gap-2">
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            multiple
            onChange={handlePhotoAttach}
            className="hidden"
          />
          
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => fileInputRef.current?.click()}
            className="self-end"
          >
            <Icon name="Image" size={18} />
          </Button>
          
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
            disabled={!newMessage.trim() && attachedPhotos.length === 0}
            className="self-end"
          >
            <Icon name="Send" size={18} />
          </Button>
        </div>
        <p className="text-xs text-muted-foreground mt-2">
          Нажмите Enter для отправки, Shift+Enter для новой строки. Можно прикрепить до 5 фото
        </p>
      </div>

      {showViewer && (
        <ImageViewer
          images={viewerImages}
          currentIndex={viewerIndex}
          onClose={() => setShowViewer(false)}
          onNext={() => setViewerIndex((viewerIndex + 1) % viewerImages.length)}
          onPrev={() => setViewerIndex((viewerIndex - 1 + viewerImages.length) % viewerImages.length)}
        />
      )}
    </div>
  );
};