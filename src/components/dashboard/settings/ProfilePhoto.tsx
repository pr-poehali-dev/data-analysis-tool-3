import { useRef } from "react";
import Icon from "@/components/ui/icon";

const AVATAR_MAX_SIZE = 400;
const AVATAR_QUALITY = 0.8;

function compressAvatar(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => {
      let { width, height } = img;
      if (width > AVATAR_MAX_SIZE || height > AVATAR_MAX_SIZE) {
        const ratio = Math.min(AVATAR_MAX_SIZE / width, AVATAR_MAX_SIZE / height);
        width = Math.round(width * ratio);
        height = Math.round(height * ratio);
      }
      const canvas = document.createElement("canvas");
      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext("2d");
      if (!ctx) {
        reject(new Error("Canvas не поддерживается"));
        return;
      }
      ctx.drawImage(img, 0, 0, width, height);
      resolve(canvas.toDataURL("image/jpeg", AVATAR_QUALITY));
    };
    img.onerror = () => reject(new Error("Не удалось загрузить изображение"));
    img.src = URL.createObjectURL(file);
  });
}

interface ProfilePhotoProps {
  photo: string;
  isEditing: boolean;
  onPhotoChange: (dataUrl: string) => void;
}

export const ProfilePhoto = ({ photo, isEditing, onPhotoChange }: ProfilePhotoProps) => {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      try {
        const compressed = await compressAvatar(file);
        onPhotoChange(compressed);
      } catch {
        onPhotoChange("");
      }
    }
  };

  return (
    <div className="flex flex-col sm:flex-row items-center sm:items-start gap-4 mb-6">
      <div className="relative">
        {photo ? (
          <img
            src={photo}
            alt="Фото профиля"
            className="w-20 h-20 sm:w-24 sm:h-24 rounded-full object-cover border-2 border-border"
          />
        ) : (
          <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-full bg-primary/20 flex items-center justify-center border-2 border-border">
            <Icon name="User" size={36} className="text-primary" />
          </div>
        )}
        {isEditing && (
          <button
            onClick={() => fileInputRef.current?.click()}
            className="absolute bottom-0 right-0 w-8 h-8 bg-primary text-white rounded-full flex items-center justify-center hover:bg-primary/90 transition-colors"
          >
            <Icon name="Camera" size={16} />
          </button>
        )}
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          onChange={handlePhotoUpload}
          className="hidden"
        />
      </div>
      
      {isEditing && (
        <div className="flex-1">
          <p className="text-sm text-muted-foreground mb-2">
            Нажмите на иконку камеры, чтобы загрузить фото профиля
          </p>
        </div>
      )}
    </div>
  );
};

export default ProfilePhoto;