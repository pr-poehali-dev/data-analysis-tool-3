import Icon from "@/components/ui/icon";
import { Input } from "@/components/ui/input";

interface ProfileFormData {
  firstName: string;
  lastName: string;
  email: string;
  city: string;
  vkLink: string;
}

interface ProfileFieldsProps {
  formData: ProfileFormData;
  isEditing: boolean;
  isTelegramUser: boolean;
  telegramUsername?: string;
  realEmail: string;
  phone: string;
  userCity?: string;
  userVkLink?: string;
  userFirstName: string;
  userLastName: string;
  isOAuthUser?: boolean;
  authProvider?: string;
  onFieldChange: (field: keyof ProfileFormData, value: string) => void;
}

const providerLabels: Record<string, string> = {
  yandex: "Яндекс",
  vk: "ВКонтакте",
  google: "Google",
};

export const ProfileFields = ({
  formData,
  isEditing,
  isTelegramUser,
  telegramUsername,
  realEmail,
  phone,
  userCity,
  userVkLink,
  userFirstName,
  userLastName,
  isOAuthUser,
  authProvider,
  onFieldChange,
}: ProfileFieldsProps) => {
  return (
    <>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-foreground mb-2">
            <Icon name="User" size={16} className="inline mr-2" />
            Имя
          </label>
          {isEditing ? (
            <Input
              value={formData.firstName}
              onChange={(e) => onFieldChange("firstName", e.target.value)}
              placeholder="Введите имя"
            />
          ) : (
            <p className="font-medium text-foreground">{userFirstName}</p>
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
              onChange={(e) => onFieldChange("lastName", e.target.value)}
              placeholder="Введите фамилию"
            />
          ) : (
            <p className="font-medium text-foreground">{userLastName}</p>
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
            {telegramUsername ? `@${telegramUsername}` : 'Подключён'}
          </p>
        </div>
      )}

      <div>
        <label className="block text-sm font-medium text-foreground mb-2">
          <Icon name="Mail" size={16} className="inline mr-2" />
          Email
        </label>
        {isEditing && !isOAuthUser ? (
          <Input
            type="email"
            value={isTelegramUser ? formData.email.replace(/^tg_\d+$/, '') : formData.email}
            onChange={(e) => onFieldChange("email", e.target.value)}
            placeholder="Введите email"
          />
        ) : (
          <p className="font-medium text-foreground">
            {realEmail || <span className="text-muted-foreground">Не указан</span>}
            {isEditing && isOAuthUser && authProvider && (
              <span className="block text-xs text-muted-foreground mt-1">
                <Icon name="Lock" size={12} className="inline mr-1" />
                Привязан через {providerLabels[authProvider] || authProvider}, изменение недоступно
              </span>
            )}
          </p>
        )}
      </div>

      <div>
        <label className="block text-sm font-medium text-foreground mb-2">
          <Icon name="Phone" size={16} className="inline mr-2" />
          Телефон
        </label>
        <p className="font-medium text-muted-foreground">{phone} (нельзя изменить)</p>
      </div>

      <div>
        <label className="block text-sm font-medium text-foreground mb-2">
          <Icon name="MapPin" size={16} className="inline mr-2" />
          Город
        </label>
        {isEditing ? (
          <Input
            value={formData.city}
            onChange={(e) => onFieldChange("city", e.target.value)}
            placeholder="Введите город"
          />
        ) : (
          <p className="font-medium text-foreground">{userCity || 'Не указан'}</p>
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
            onChange={(e) => onFieldChange("vkLink", e.target.value)}
            placeholder="https://vk.com/username"
          />
        ) : (
          <div>
            {userVkLink ? (
              <a
                href={userVkLink}
                target="_blank"
                rel="noopener noreferrer"
                className="font-medium text-primary hover:underline"
              >
                {userVkLink}
              </a>
            ) : (
              <p className="font-medium text-muted-foreground">Не указана</p>
            )}
          </div>
        )}
      </div>
    </>
  );
};

export default ProfileFields;