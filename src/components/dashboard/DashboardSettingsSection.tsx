import { useState, useEffect, useRef } from "react";
import Icon from "@/components/ui/icon";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { authStore } from "@/store/authStore";
import funcUrls from "../../../backend/func2url.json";

const PROFILE_URL = funcUrls["profile-update"];

interface DashboardSettingsSectionProps {
  user: {
    firstName: string;
    lastName: string;
    email: string;
    phone: string;
    role: "tenant" | "recommender" | "landlord";
    city?: string;
    photo?: string;
    vkLink?: string;
    telegramUsername?: string;
  };
}

const SOUND_SETTINGS_KEY = 'sovietpay_sound_settings';

interface SoundSettings {
  messageNotifications: boolean;
}

const getSettings = (): SoundSettings => {
  if (typeof window === 'undefined') return { messageNotifications: true };
  const stored = localStorage.getItem(SOUND_SETTINGS_KEY);
  if (!stored) return { messageNotifications: true };
  return JSON.parse(stored);
};

const saveSettings = (settings: SoundSettings) => {
  if (typeof window === 'undefined') return;
  localStorage.setItem(SOUND_SETTINGS_KEY, JSON.stringify(settings));
};

export const DashboardSettingsSection = ({ user }: DashboardSettingsSectionProps) => {
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [saved, setSaved] = useState(false);
  const [saving, setSaving] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  const isTelegramUser = !!user.telegramUsername || /^tg_\d+/.test(user.email);
  const realEmail = /^tg_\d+/.test(user.email) ? '' : user.email;

  const [formData, setFormData] = useState({
    firstName: user.firstName,
    lastName: user.lastName,
    email: user.email,
    city: user.city || '',
    photo: user.photo || '',
    vkLink: user.vkLink || '',
  });

  useEffect(() => {
    const settings = getSettings();
    setSoundEnabled(settings.messageNotifications);
  }, []);

  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setFormData({ ...formData, photo: reader.result as string });
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSaveProfile = async () => {
    setSaving(true);
    const token = localStorage.getItem("yandex_auth_access_token") || localStorage.getItem("telegram_auth_access_token");

    if (token) {
      try {
        const res = await fetch(PROFILE_URL, {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${token}`,
          },
          body: JSON.stringify({
            firstName: formData.firstName,
            lastName: formData.lastName,
            email: formData.email,
            city: formData.city,
            vkLink: formData.vkLink,
            avatar_url: formData.photo,
          }),
        });

        const data = await res.json();
        if (res.ok && data.user) {
          authStore.updateUser({
            firstName: data.user.firstName,
            lastName: data.user.lastName,
            email: data.user.email,
            city: data.user.city,
            photo: data.user.avatar_url || formData.photo,
            vkLink: data.user.vkLink,
          });
        } else {
          toast({ title: "Ошибка", description: "Не удалось сохранить профиль", variant: "destructive" });
          setSaving(false);
          return;
        }
      } catch {
        toast({ title: "Ошибка сети", description: "Попробуйте позже", variant: "destructive" });
        setSaving(false);
        return;
      }
    } else {
      authStore.updateUser({
        firstName: formData.firstName,
        lastName: formData.lastName,
        email: formData.email,
        city: formData.city,
        photo: formData.photo,
        vkLink: formData.vkLink,
      });
    }

    setSaving(false);
    setIsEditing(false);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  const handleSoundSettings = () => {
    const settings: SoundSettings = {
      messageNotifications: soundEnabled,
    };
    saveSettings(settings);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  const handleCancel = () => {
    setFormData({
      firstName: user.firstName,
      lastName: user.lastName,
      email: user.email,
      city: user.city || '',
      photo: user.photo || '',
      vkLink: user.vkLink || '',
    });
    setIsEditing(false);
  };

  return (
    <div>
      <h2 className="text-2xl sm:text-3xl font-bold text-foreground mb-4 sm:mb-6">Настройки профиля</h2>
      
      <div className="space-y-4 sm:space-y-6">
        <div className="bg-white rounded-lg border border-border p-4 sm:p-6">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 mb-4">
            <h3 className="text-lg sm:text-xl font-semibold text-foreground">Информация о пользователе</h3>
            {!isEditing && (
              <Button variant="outline" onClick={() => setIsEditing(true)}>
                <Icon name="Edit" size={16} />
                Редактировать
              </Button>
            )}
          </div>

          <div className="space-y-4">
            <div className="flex flex-col sm:flex-row items-center sm:items-start gap-4 mb-6">
              <div className="relative">
                {formData.photo ? (
                  <img
                    src={formData.photo}
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

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-foreground mb-2">
                  <Icon name="User" size={16} className="inline mr-2" />
                  Имя
                </label>
                {isEditing ? (
                  <Input
                    value={formData.firstName}
                    onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                    placeholder="Введите имя"
                  />
                ) : (
                  <p className="font-medium text-foreground">{user.firstName}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-foreground mb-2">
                  <Icon name="User" size={16} className="inline mr-2" />
                  Фамилия
                </label>
                {isEditing ? (
                  <Input
                    value={formData.lastName}
                    onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                    placeholder="Введите фамилию"
                  />
                ) : (
                  <p className="font-medium text-foreground">{user.lastName}</p>
                )}
              </div>
            </div>

            {isTelegramUser && (
              <div>
                <label className="block text-sm font-medium text-foreground mb-2">
                  <svg className="inline w-4 h-4 mr-2" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M11.944 0A12 12 0 0 0 0 12a12 12 0 0 0 12 12 12 12 0 0 0 12-12A12 12 0 0 0 12 0a12 12 0 0 0-.056 0zm4.962 7.224c.1-.002.321.023.465.14a.506.506 0 0 1 .171.325c.016.093.036.306.02.472-.18 1.898-.962 6.502-1.36 8.627-.168.9-.499 1.201-.82 1.23-.696.065-1.225-.46-1.9-.902-1.056-.693-1.653-1.124-2.678-1.8-1.185-.78-.417-1.21.258-1.91.177-.184 3.247-2.977 3.307-3.23.007-.032.014-.15-.056-.212s-.174-.041-.249-.024c-.106.024-1.793 1.14-5.061 3.345-.48.33-.913.49-1.302.48-.428-.008-1.252-.241-1.865-.44-.752-.245-1.349-.374-1.297-.789.027-.216.325-.437.893-.663 3.498-1.524 5.83-2.529 6.998-3.014 3.332-1.386 4.025-1.627 4.476-1.635z" fill="#0088cc"/>
                  </svg>
                  Telegram
                </label>
                <p className="font-medium text-foreground">
                  {user.telegramUsername ? `@${user.telegramUsername}` : 'Подключён'}
                </p>
              </div>
            )}

            <div>
              <label className="block text-sm font-medium text-foreground mb-2">
                <Icon name="Mail" size={16} className="inline mr-2" />
                Email
              </label>
              {isEditing ? (
                <Input
                  type="email"
                  value={isTelegramUser ? formData.email.replace(/^tg_\d+$/, '') : formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  placeholder="Введите email"
                />
              ) : (
                <p className="font-medium text-foreground">
                  {realEmail || <span className="text-muted-foreground">Не указан</span>}
                </p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-foreground mb-2">
                <Icon name="Phone" size={16} className="inline mr-2" />
                Телефон
              </label>
              <p className="font-medium text-muted-foreground">{user.phone} (нельзя изменить)</p>
            </div>

            <div>
              <label className="block text-sm font-medium text-foreground mb-2">
                <Icon name="MapPin" size={16} className="inline mr-2" />
                Город
              </label>
              {isEditing ? (
                <Input
                  value={formData.city}
                  onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                  placeholder="Введите город"
                />
              ) : (
                <p className="font-medium text-foreground">{user.city || 'Не указан'}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-foreground mb-2">
                <svg className="inline w-4 h-4 mr-2" viewBox="0 0 48 48" fill="currentColor">
                  <path d="M0 23.04C0 12.1788 0 6.74826 3.37413 3.37413C6.74826 0 12.1788 0 23.04 0H24.96C35.8212 0 41.2517 0 44.6259 3.37413C48 6.74826 48 12.1788 48 23.04V24.96C48 35.8212 48 41.2517 44.6259 44.6259C41.2517 48 35.8212 48 24.96 48H23.04C12.1788 48 6.74826 48 3.37413 44.6259C0 41.2517 0 35.8212 0 24.96V23.04Z" fill="#0077FF"/>
                  <path d="M25.54 34.5801C14.6 34.5801 8.3601 27.0801 8.1001 14.6001H13.5801C13.7601 23.7601 17.8 27.6401 21.2 28.4401V14.6001H26.1801V22.5001C29.5401 22.1601 32.9601 18.5601 34.1001 14.6001H39.0801C38.2601 19.4801 34.4601 23.0801 31.8 24.5601C34.4601 25.7401 38.7801 28.9201 40.5001 34.5801H35.0601C33.7001 30.6801 30.5601 27.6601 26.1801 27.2401V34.5801H25.54Z" fill="white"/>
                </svg>
                ВКонтакте
              </label>
              {isEditing ? (
                <Input
                  value={formData.vkLink}
                  onChange={(e) => setFormData({ ...formData, vkLink: e.target.value })}
                  placeholder="https://vk.com/username"
                />
              ) : (
                <div>
                  {user.vkLink ? (
                    <a
                      href={user.vkLink}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="font-medium text-primary hover:underline"
                    >
                      {user.vkLink}
                    </a>
                  ) : (
                    <p className="font-medium text-muted-foreground">Не указана</p>
                  )}
                </div>
              )}
            </div>

            {isEditing && (
              <div className="flex flex-col sm:flex-row gap-3 pt-4">
                <Button onClick={handleSaveProfile} disabled={saving} className="flex-1">
                  <Icon name="Check" size={18} />
                  {saving ? "Сохранение..." : "Сохранить изменения"}
                </Button>
                <Button variant="outline" onClick={handleCancel} className="flex-1">
                  <Icon name="X" size={18} />
                  Отмена
                </Button>
              </div>
            )}
          </div>
        </div>

        <div className="bg-white rounded-lg border border-border p-4 sm:p-6">
          <h3 className="text-lg sm:text-xl font-semibold text-foreground mb-4">Уведомления</h3>
          <div className="space-y-4">
            <div className="flex items-center justify-between gap-3 p-3 sm:p-4 bg-gray-50 rounded-lg">
              <div className="flex items-center gap-3 min-w-0">
                <Icon name="Volume2" size={20} className="text-primary flex-shrink-0" />
                <div className="min-w-0">
                  <p className="font-medium text-foreground text-sm sm:text-base">Звук сообщений</p>
                  <p className="text-xs sm:text-sm text-muted-foreground">
                    Звуковой сигнал при новых сообщениях
                  </p>
                </div>
              </div>
              <button
                onClick={() => setSoundEnabled(!soundEnabled)}
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                  soundEnabled ? 'bg-primary' : 'bg-gray-300'
                }`}
              >
                <span
                  className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                    soundEnabled ? 'translate-x-6' : 'translate-x-1'
                  }`}
                />
              </button>
            </div>

            <Button onClick={handleSoundSettings} className="w-full">
              <Icon name={saved ? "Check" : "Save"} size={18} />
              {saved ? "Сохранено!" : "Сохранить настройки"}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export const getSoundSettings = getSettings;