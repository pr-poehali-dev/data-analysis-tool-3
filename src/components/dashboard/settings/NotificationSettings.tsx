import { useState, useEffect } from "react";
import Icon from "@/components/ui/icon";
import { Button } from "@/components/ui/button";

const SOUND_SETTINGS_KEY = 'sovietpay_sound_settings';

export interface SoundSettings {
  messageNotifications: boolean;
}

export const getSettings = (): SoundSettings => {
  if (typeof window === 'undefined') return { messageNotifications: true };
  const stored = localStorage.getItem(SOUND_SETTINGS_KEY);
  if (!stored) return { messageNotifications: true };
  return JSON.parse(stored);
};

const saveSettings = (settings: SoundSettings) => {
  if (typeof window === 'undefined') return;
  localStorage.setItem(SOUND_SETTINGS_KEY, JSON.stringify(settings));
};

export const NotificationSettings = () => {
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    const settings = getSettings();
    setSoundEnabled(settings.messageNotifications);
  }, []);

  const handleSave = () => {
    saveSettings({ messageNotifications: soundEnabled });
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  return (
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

        <Button onClick={handleSave} className="w-full">
          <Icon name={saved ? "Check" : "Save"} size={18} />
          {saved ? "Сохранено!" : "Сохранить настройки"}
        </Button>
      </div>
    </div>
  );
};

export default NotificationSettings;
