import { useState, useEffect, useRef } from "react";
import { motion } from "framer-motion";
import Icon from "@/components/ui/icon";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { ImageViewer } from "@/components/ui/image-viewer";
import { UserProfileModal } from "./UserProfileModal";
import { ReviewModal } from "./ReviewModal";
import { EscrowModal } from "./EscrowModal";
import { recommendationsStore } from "@/store/recommendationsStore";
import { requestsStore } from "@/store/requestsStore";
import { Chat, Message, messagesStore } from "@/store/messagesStore";
import { format } from "date-fns";
import { ru } from "date-fns/locale";

interface ChatWindowProps {
  chat: Chat;
  currentUserEmail: string;
  currentUserName: string;
  currentUserPhoto?: string;
}

export const ChatWindow = ({ chat, currentUserEmail, currentUserName, currentUserPhoto }: ChatWindowProps) => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [attachedPhotos, setAttachedPhotos] = useState<File[]>([]);
  const [previewUrls, setPreviewUrls] = useState<string[]>([]);
  const [viewerImages, setViewerImages] = useState<string[]>([]);
  const [viewerIndex, setViewerIndex] = useState(0);
  const [showViewer, setShowViewer] = useState(false);
  const [copiedMessageId, setCopiedMessageId] = useState<string | null>(null);
  const [typingUsers, setTypingUsers] = useState<string[]>([]);
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [showReviewModal, setShowReviewModal] = useState(false);
  const [showEscrowModal, setShowEscrowModal] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const prevMessagesLengthRef = useRef(0);
  const isRecommender = chat.recommenderEmail === currentUserEmail;
  const isTenant = chat.tenantEmail === currentUserEmail;
  const otherUserName = isRecommender ? chat.tenantName : chat.recommenderName;
  const otherUserPhoto = isRecommender ? chat.tenantPhoto : chat.recommenderPhoto;
  const otherUserEmail = isRecommender ? chat.tenantEmail : chat.recommenderEmail;
  const otherUserVkLink = isRecommender ? chat.tenantVkLink : chat.recommenderVkLink;

  useEffect(() => {
    const loadMessages = () => {
      const chatMessages = messagesStore.getMessages(chat.id);
      setMessages(chatMessages);
      
      const typing = messagesStore.getTypingUsers(chat.id, currentUserEmail);
      setTypingUsers(typing);
    };

    loadMessages();
    messagesStore.markChatAsRead(chat.id, currentUserEmail);

    const cleanupInterval = setInterval(() => {
      messagesStore.cleanupOldTypingStatuses();
      loadMessages();
    }, 2000);

    const unsubscribe = messagesStore.subscribe(loadMessages);
    return () => {
      unsubscribe();
      clearInterval(cleanupInterval);
    };
  }, [chat.id, currentUserEmail]);

  useEffect(() => {
    if (messages.length > prevMessagesLengthRef.current) {
      messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }
    prevMessagesLengthRef.current = messages.length;
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
      senderPhoto: currentUserPhoto,
      text: newMessage.trim() || '',
      photos: photoUrls.length > 0 ? photoUrls : undefined,
    });

    messagesStore.clearTyping(chat.id, currentUserEmail);
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
      typingTimeoutRef.current = null;
    }

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

  const handleTyping = () => {
    messagesStore.setTyping(chat.id, currentUserEmail, currentUserName);

    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }

    typingTimeoutRef.current = setTimeout(() => {
      messagesStore.clearTyping(chat.id, currentUserEmail);
    }, 3000);
  };

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
    <div className="flex flex-col h-full">
      <div className="bg-white border-b border-border p-3 sm:p-4">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 sm:gap-3">
          <div className="flex items-center gap-2 sm:gap-3 flex-1 min-w-0 w-full sm:w-auto">
          <button
            onClick={() => setShowProfileModal(true)}
            className="flex-shrink-0 hover:opacity-80 transition-opacity"
          >
            {otherUserPhoto ? (
              <img
                src={otherUserPhoto}
                alt={otherUserName}
                className="w-10 h-10 rounded-full object-cover border-2 border-primary/20 cursor-pointer"
              />
            ) : (
              <div className="w-10 h-10 bg-primary/20 rounded-full flex items-center justify-center cursor-pointer">
                <Icon name="User" size={18} className="text-primary" />
              </div>
            )}
          </button>
          <button
            onClick={() => setShowProfileModal(true)}
            className="flex-1 text-left hover:opacity-80 transition-opacity"
          >
            <h3 className="font-semibold text-foreground">{otherUserName}</h3>
            <p className="text-xs text-muted-foreground">{chat.requestName}</p>
          </button>
          </div>
          <div className="flex gap-1.5 sm:gap-2 w-full sm:w-auto">
            {isTenant && (
              <Button
                variant="default"
                size="sm"
                onClick={() => {
                  messagesStore.sendSystemMessage(
                    chat.id,
                    '🤝 Стороны договорились о сделке и переходят к оформлению через эскроу'
                  );
                  setShowEscrowModal(true);
                }}
                className="flex-1 sm:flex-none flex items-center justify-center gap-1.5 sm:gap-2 text-xs sm:text-sm bg-primary hover:bg-primary/90 px-2 sm:px-3"
              >
                <Icon name="Handshake" size={14} className="sm:w-4 sm:h-4" />
                <span className="hidden sm:inline">Мы договорились</span>
                <span className="sm:hidden">Договор</span>
              </Button>
            )}
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowReviewModal(true)}
              className="flex-1 sm:flex-none flex items-center justify-center gap-1.5 sm:gap-2 text-xs sm:text-sm px-2 sm:px-3"
            >
              <Icon name="Star" size={14} className="sm:w-4 sm:h-4" />
              <span className="hidden sm:inline">Оставить отзыв</span>
              <span className="sm:hidden">Отзыв</span>
            </Button>
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-3 sm:p-4 space-y-3 sm:space-y-4 bg-gray-50">
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
                    message.senderPhoto ? (
                      <img
                        src={message.senderPhoto}
                        alt={message.senderName}
                        className="w-8 h-8 rounded-full object-cover flex-shrink-0 border border-border"
                      />
                    ) : (
                      <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center flex-shrink-0">
                        <Icon name="User" size={14} className="text-primary" />
                      </div>
                    )
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

      <div className="bg-white border-t border-border p-3 sm:p-4">
        {previewUrls.length > 0 && (
          <div className="flex gap-2 mb-2 sm:mb-3 flex-wrap">
            {previewUrls.map((url, index) => (
              <div key={index} className="relative">
                <img
                  src={url}
                  alt={`Превью ${index + 1}`}
                  className="w-16 h-16 sm:w-20 sm:h-20 object-cover rounded-lg border border-border"
                />
                <button
                  onClick={() => removePhoto(index)}
                  className="absolute -top-1.5 -right-1.5 sm:-top-2 sm:-right-2 w-5 h-5 sm:w-6 sm:h-6 bg-red-500 text-white rounded-full flex items-center justify-center hover:bg-red-600 transition-colors"
                >
                  <Icon name="X" size={12} className="sm:w-[14px] sm:h-[14px]" />
                </button>
              </div>
            ))}
          </div>
        )}
        
        <div className="flex gap-1.5 sm:gap-2">
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
            className="self-end flex-shrink-0"
          >
            <Icon name="Image" size={16} className="sm:w-[18px] sm:h-[18px]" />
          </Button>
          
          <Textarea
            value={newMessage}
            onChange={(e) => {
              setNewMessage(e.target.value);
              handleTyping();
            }}
            onKeyDown={handleKeyPress}
            placeholder="Напишите сообщение..."
            className="resize-none text-sm sm:text-base"
            rows={2}
          />
          
          <Button
            onClick={handleSendMessage}
            disabled={!newMessage.trim() && attachedPhotos.length === 0}
            className="self-end flex-shrink-0"
          >
            <Icon name="Send" size={16} className="sm:w-[18px] sm:h-[18px]" />
          </Button>
        </div>
        <p className="text-xs text-muted-foreground mt-1.5 sm:mt-2">
          Нажмите Enter для отправки. <span className="hidden sm:inline">Shift+Enter для новой строки.</span> Можно прикрепить до 5 фото
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

      <UserProfileModal
        isOpen={showProfileModal}
        onClose={() => setShowProfileModal(false)}
        user={{
          name: otherUserName,
          email: otherUserEmail,
          photo: otherUserPhoto,
          vkLink: otherUserVkLink,
        }}
      />

      {showReviewModal && (
        <ReviewModal
          chatId={chat.id}
          recommendationId={chat.recommendationId}
          reviewerEmail={currentUserEmail}
          reviewerName={currentUserName}
          revieweeEmail={otherUserEmail}
          revieweeName={otherUserName}
          onClose={() => setShowReviewModal(false)}
          onSuccess={() => {
            console.log('Отзыв успешно отправлен');
          }}
        />
      )}

      <EscrowModal
        isOpen={showEscrowModal}
        onClose={() => setShowEscrowModal(false)}
        rentAmount={recommendationsStore.getRecommendationById(chat.recommendationId)?.propertyData.rent || '0'}
        rewardAmount={requestsStore.getRequestById(chat.requestId)?.reward || '0'}
        chatId={chat.id}
        recommendationId={chat.recommendationId}
        requestName={chat.requestName}
        tenantEmail={chat.tenantEmail}
        tenantName={chat.tenantName}
        recommenderEmail={chat.recommenderEmail}
        recommenderName={chat.recommenderName}
      />
    </div>
  );
};