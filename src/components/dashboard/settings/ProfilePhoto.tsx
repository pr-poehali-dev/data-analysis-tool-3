import { useRef } from "react";
import Icon from "@/components/ui/icon";

interface ProfilePhotoProps {
  photo: string;
  isEditing: boolean;
  onPhotoChange: (dataUrl: string) => void;
}

export const ProfilePhoto = ({ photo, isEditing, onPhotoChange }: ProfilePhotoProps) => {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        onPhotoChange(reader.result as string);
      };
      reader.readAsDataURL(file);
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
