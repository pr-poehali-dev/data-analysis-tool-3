import { useState, useRef } from "react";
import Icon from "@/components/ui/icon";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { messagesStore } from "@/store/messagesStore";

const MAX_PHOTOS = 4;
const MAX_SIZE = 1200;
const QUALITY = 0.7;

interface ChatInputProps {
  chatId: string;
  currentUserEmail: string;
  currentUserName: string;
  currentUserPhoto?: string;
}

function compressImage(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => {
      let { width, height } = img;
      if (width > MAX_SIZE || height > MAX_SIZE) {
        const ratio = Math.min(MAX_SIZE / width, MAX_SIZE / height);
        width = Math.round(width * ratio);
        height = Math.round(height * ratio);
      }
      const canvas = document.createElement("canvas");
      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext("2d");
      if (!ctx) return reject(new Error("Canvas не поддерживается"));
      ctx.drawImage(img, 0, 0, width, height);
      const dataUrl = canvas.toDataURL("image/jpeg", QUALITY);
      resolve(dataUrl);
    };
    img.onerror = () => reject(new Error("Не удалось загрузить изображение"));
    img.src = URL.createObjectURL(file);
  });
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
  const [isSending, setIsSending] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const handlePhotoAttach = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    const allowed = files.slice(0, MAX_PHOTOS - attachedPhotos.length);
    if (allowed.length === 0) return;

    setAttachedPhotos((prev) => [...prev, ...allowed]);
    const urls = allowed.map((file) => URL.createObjectURL(file));
    setPreviewUrls((prev) => [...prev, ...urls]);

    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const removePhoto = (index: number) => {
    URL.revokeObjectURL(previewUrls[index]);
    setAttachedPhotos((prev) => prev.filter((_, i) => i !== index));
    setPreviewUrls((prev) => prev.filter((_, i) => i !== index));
  };

  const handleSendMessage = async () => {
    if ((!newMessage.trim() && attachedPhotos.length === 0) || isSending) return;

    const text = newMessage.trim();
    const photosToSend = [...attachedPhotos];

    setNewMessage("");
    setAttachedPhotos([]);
    previewUrls.forEach((url) => URL.revokeObjectURL(url));
    setPreviewUrls([]);
    setIsSending(true);

    try {
      let compressedPhotos: string[] = [];
      if (photosToSend.length > 0) {
        compressedPhotos = await Promise.all(photosToSend.map(compressImage));
      }

      await messagesStore.sendMessage({
        chatId,
        senderId: currentUserEmail,
        senderName: currentUserName,
        senderPhoto: currentUserPhoto,
        text: text || "",
        photos: compressedPhotos.length > 0 ? compressedPhotos : undefined,
      });

      messagesStore.clearTyping(chatId, currentUserEmail);
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
        typingTimeoutRef.current = null;
      }
    } catch {
      setNewMessage(text);
      alert("Ошибка при отправке. Попробуйте ещё раз.");
    } finally {
      setIsSending(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const handleTyping = () => {
    messagesStore.setTyping(chatId, currentUserEmail, currentUserName);
    if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
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
                disabled={isSending}
                className="absolute -top-1.5 -right-1.5 sm:-top-2 sm:-right-2 w-5 h-5 sm:w-6 sm:h-6 bg-red-500 text-white rounded-full flex items-center justify-center hover:bg-red-600 transition-colors disabled:opacity-50"
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
          disabled={isSending || attachedPhotos.length >= MAX_PHOTOS}
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
          disabled={isSending}
        />

        <Button
          onClick={handleSendMessage}
          disabled={(!newMessage.trim() && attachedPhotos.length === 0) || isSending}
          className="self-end flex-shrink-0"
        >
          <Icon
            name={isSending ? "Loader2" : "Send"}
            size={16}
            className={`sm:w-[18px] sm:h-[18px] ${isSending ? "animate-spin" : ""}`}
          />
        </Button>
      </div>
      <p className="text-xs text-muted-foreground mt-1.5 sm:mt-2">
        Enter — отправить. <span className="hidden sm:inline">Shift+Enter — новая строка. </span>
        {attachedPhotos.length > 0
          ? `Фото: ${attachedPhotos.length}/${MAX_PHOTOS}`
          : `До ${MAX_PHOTOS} фото`}
      </p>
    </div>
  );
};

export default ChatInput;
