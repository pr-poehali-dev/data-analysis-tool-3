import { useState, useEffect } from "react";
import Icon from "@/components/ui/icon";
import { Button } from "@/components/ui/button";

interface DashboardSettingsSectionProps {
  user: {
    firstName: string;
    lastName: string;
    email: string;
    phone: string;
    role: "tenant" | "recommender" | "landlord";
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
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    const settings = getSettings();
    setSoundEnabled(settings.messageNotifications);
  }, []);

  const handleSave = () => {
    const settings: SoundSettings = {
      messageNotifications: soundEnabled,
    };
    saveSettings(settings);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  return (
    <div>
      <h2 className="text-3xl font-bold text-foreground mb-6">Настройки профиля</h2>
      
      <div className="space-y-6">
        <div className="bg-white rounded-lg border border-border p-6">
          <h3 className="text-xl font-semibold text-foreground mb-4">Информация о пользователе</h3>
          <div className="space-y-3">
            <div className="flex items-center gap-3">
              <Icon name="User" size={18} className="text-muted-foreground" />
              <div>
                <p className="text-sm text-muted-foreground">Имя</p>
                <p className="font-medium">{user.firstName} {user.lastName}</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <Icon name="Mail" size={18} className="text-muted-foreground" />
              <div>
                <p className="text-sm text-muted-foreground">Email</p>
                <p className="font-medium">{user.email}</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <Icon name="Phone" size={18} className="text-muted-foreground" />
              <div>
                <p className="text-sm text-muted-foreground">Телефон</p>
                <p className="font-medium">{user.phone}</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <Icon name="Briefcase" size={18} className="text-muted-foreground" />
              <div>
                <p className="text-sm text-muted-foreground">Роль</p>
                <p className="font-medium">
                  {user.role === 'tenant' && 'Арендатор'}
                  {user.role === 'recommender' && 'Рекомендатель'}
                  {user.role === 'landlord' && 'Арендодатель'}
                </p>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg border border-border p-6">
          <h3 className="text-xl font-semibold text-foreground mb-4">Уведомления</h3>
          <div className="space-y-4">
            <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
              <div className="flex items-center gap-3">
                <Icon name="Volume2" size={20} className="text-primary" />
                <div>
                  <p className="font-medium text-foreground">Звук сообщений</p>
                  <p className="text-sm text-muted-foreground">
                    Воспроизводить звуковой сигнал при получении новых сообщений
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

            <Button onClick={handleSave} className="w-full">
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
