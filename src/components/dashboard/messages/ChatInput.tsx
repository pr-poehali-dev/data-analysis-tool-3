import { useState, useRef } from "react";
import Icon from "@/components/ui/icon";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { messagesStore } from "@/store/messagesStore";

interface ChatInputProps {
  chatId: string;
  currentUserEmail: string;
  currentUserName: string;
  currentUserPhoto?: string;
}

export const ChatInput = ({
  chatId,
  currentUserEmail,
  currentUserName,
  currentUserPhoto,
}: ChatInputProps) => {
  const [newMessage, setNewMessage] = useState("");
  const [attachedPhotos, setAttachedPhotos] = useState<File[]>([]);
  const [previewUrls, setPreviewUrls] = useState<string[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);

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
      chatId,
      senderId: currentUserEmail,
      senderName: currentUserName,
      senderPhoto: currentUserPhoto,
      text: newMessage.trim() || '',
      photos: photoUrls.length > 0 ? photoUrls : undefined,
    });

    messagesStore.clearTyping(chatId, currentUserEmail);
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
    messagesStore.setTyping(chatId, currentUserEmail, currentUserName);

    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }

    typingTimeoutRef.current = setTimeout(() => {
      messagesStore.clearTyping(chatId, currentUserEmail);
    }, 3000);
  };

  return (
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
  );
};

export default ChatInput;
