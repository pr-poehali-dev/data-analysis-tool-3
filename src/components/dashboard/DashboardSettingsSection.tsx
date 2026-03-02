import { useState } from "react";
import Icon from "@/components/ui/icon";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { authStore } from "@/store/authStore";
import { ProfilePhoto } from "./settings/ProfilePhoto";
import { ProfileFields } from "./settings/ProfileFields";
import { NotificationSettings } from "./settings/NotificationSettings";
import { EmailVerifyModal } from "./EmailVerifyModal";
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

export const DashboardSettingsSection = ({ user }: DashboardSettingsSectionProps) => {
  const [isEditing, setIsEditing] = useState(false);
  const [saved, setSaved] = useState(false);
  const [saving, setSaving] = useState(false);
  const [showEmailVerify, setShowEmailVerify] = useState(false);
  const [pendingEmail, setPendingEmail] = useState("");
  const { toast } = useToast();

  const isTelegramUser = !!user.telegramUsername || /^tg_\d+/.test(user.email);
  const realEmail = /^tg_\d+/.test(user.email) ? '' : user.email;

  const getAuthProvider = (): string => {
    if (localStorage.getItem("yandex_auth_access_token")) return "yandex";
    if (localStorage.getItem("vk_auth_access_token")) return "vk";
    if (localStorage.getItem("google_auth_access_token")) return "google";
    if (localStorage.getItem("telegram_auth_access_token")) return "telegram";
    if (localStorage.getItem("email_auth_access_token")) return "email";
    return "unknown";
  };
  const authProvider = getAuthProvider();
  const isOAuthUser = ["yandex", "vk", "google"].includes(authProvider);

  const [formData, setFormData] = useState({
    firstName: user.firstName,
    lastName: user.lastName,
    email: user.email,
    city: user.city || '',
    photo: user.photo || '',
    vkLink: user.vkLink || '',
  });

  const handleFieldChange = (field: string, value: string) => {
    setFormData({ ...formData, [field]: value });
  };

  const getToken = () => {
    return (
      localStorage.getItem("yandex_auth_access_token") ||
      localStorage.getItem("telegram_auth_access_token") ||
      localStorage.getItem("vk_auth_access_token") ||
      localStorage.getItem("google_auth_access_token") ||
      localStorage.getItem("email_auth_access_token") ||
      ""
    );
  };

  const saveProfileWithoutEmail = async (emailToSave?: string) => {
    setSaving(true);
    const token = getToken();

    if (token) {
      try {
        const body: Record<string, string> = {
          firstName: formData.firstName,
          lastName: formData.lastName,
          city: formData.city,
          vkLink: formData.vkLink,
          avatar_url: formData.photo,
        };
        if (emailToSave) {
          body.email = emailToSave;
        }

        const res = await fetch(PROFILE_URL, {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${token}`,
          },
          body: JSON.stringify(body),
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
          toast({ title: "Ошибка", description: data.error || "Не удалось сохранить профиль", variant: "destructive" });
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
        email: emailToSave || formData.email,
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

  const handleSaveProfile = async () => {
    if (!isOAuthUser) {
      const emailChanged = formData.email !== user.email && formData.email !== realEmail;
      const newEmailValid = formData.email && formData.email.includes("@") && !/^tg_\d+/.test(formData.email);

      if (emailChanged && newEmailValid) {
        setPendingEmail(formData.email);
        setShowEmailVerify(true);
        return;
      }
    }

    await saveProfileWithoutEmail();
  };

  const handleEmailVerified = async (verifiedEmail: string) => {
    setShowEmailVerify(false);
    setPendingEmail("");
    setFormData((prev) => ({ ...prev, email: verifiedEmail }));
    await saveProfileWithoutEmail();
    authStore.updateUser({ email: verifiedEmail });

    const isEmailAuthUser = !!localStorage.getItem("email_auth_access_token");
    toast({
      title: "Готово",
      description: isEmailAuthUser
        ? "Почта подтверждена. Теперь для входа используйте новый email и прежний пароль"
        : "Почта подтверждена и сохранена",
    });
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
            <ProfilePhoto
              photo={formData.photo}
              isEditing={isEditing}
              onPhotoChange={(dataUrl) => handleFieldChange("photo", dataUrl)}
            />

            <ProfileFields
              formData={formData}
              isEditing={isEditing}
              isTelegramUser={isTelegramUser}
              telegramUsername={user.telegramUsername}
              realEmail={realEmail}
              phone={user.phone}
              userCity={user.city}
              userVkLink={user.vkLink}
              userFirstName={user.firstName}
              userLastName={user.lastName}
              isOAuthUser={isOAuthUser}
              authProvider={authProvider}
              onFieldChange={handleFieldChange}
            />

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

        <NotificationSettings />
      </div>

      <EmailVerifyModal
        isOpen={showEmailVerify}
        email={pendingEmail}
        onClose={() => setShowEmailVerify(false)}
        onVerified={handleEmailVerified}
      />
    </div>
  );
};

export { getSettings as getSoundSettings } from "./settings/NotificationSettings";