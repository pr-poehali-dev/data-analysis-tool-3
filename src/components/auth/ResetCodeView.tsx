import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  InputOTP,
  InputOTPGroup,
  InputOTPSlot,
} from "@/components/ui/input-otp";
import Icon from "@/components/ui/icon";

interface ResetCodeViewProps {
  email: string;
  code: string;
  onCodeChange: (value: string) => void;
  newPassword: string;
  onNewPasswordChange: (value: string) => void;
  confirmPassword: string;
  onConfirmPasswordChange: (value: string) => void;
  error: string | null;
  message: string | null;
  isLoading: boolean;
  onSubmit: (e: React.FormEvent) => void;
  onResend: () => void;
  onBack: () => void;
}

interface ResetSuccessViewProps {
  onBackToLogin: () => void;
}

export const ResetSuccessView = ({ onBackToLogin }: ResetSuccessViewProps) => {
  return (
    <div className="space-y-6">
      <div className="text-center">
        <div className="w-16 h-16 rounded-full bg-green-100 flex items-center justify-center mx-auto mb-4">
          <Icon name="Check" className="text-green-600" size={32} />
        </div>
        <h2 className="text-2xl font-bold text-foreground mb-2">Пароль изменён</h2>
        <p className="text-muted-foreground">
          Теперь вы можете войти с новым паролем
        </p>
      </div>
      <Button onClick={onBackToLogin} className="w-full bg-[#155eef] hover:bg-[#155eef]/90 text-white">
        Войти
      </Button>
    </div>
  );
};

export const ResetCodeView = ({
  email,
  code,
  onCodeChange,
  newPassword,
  onNewPasswordChange,
  confirmPassword,
  onConfirmPasswordChange,
  error,
  message,
  isLoading,
  onSubmit,
  onResend,
  onBack,
}: ResetCodeViewProps) => {
  return (
    <div className="space-y-6">
      <button
        onClick={onBack}
        className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors"
      >
        <Icon name="ChevronLeft" size={20} />
        <span>Назад</span>
      </button>

      <div className="text-center">
        <h2 className="text-2xl font-bold text-foreground mb-2">Новый пароль</h2>
        <p className="text-sm text-muted-foreground">
          Введите код с почты и новый пароль для {email}
        </p>
      </div>

      <form onSubmit={onSubmit} className="space-y-4">
        {message && (
          <div className="text-sm text-green-600 bg-green-50 p-3 rounded-md">{message}</div>
        )}
        {error && (
          <div className="text-sm text-destructive bg-destructive/10 p-3 rounded-md">{error}</div>
        )}

        <div className="space-y-2">
          <Label>Код подтверждения</Label>
          <div className="flex justify-center py-2">
            <InputOTP maxLength={6} value={code} onChange={onCodeChange} disabled={isLoading}>
              <InputOTPGroup>
                <InputOTPSlot index={0} />
                <InputOTPSlot index={1} />
                <InputOTPSlot index={2} />
                <InputOTPSlot index={3} />
                <InputOTPSlot index={4} />
                <InputOTPSlot index={5} />
              </InputOTPGroup>
            </InputOTP>
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="newPassword">Новый пароль</Label>
          <Input
            id="newPassword"
            type="text"
            placeholder="Минимум 8 символов"
            value={newPassword}
            onChange={(e) => onNewPasswordChange(e.target.value)}
            disabled={isLoading}
          />
          <p className="text-xs text-muted-foreground">Минимум 8 символов, буквы и цифры</p>
        </div>

        <div className="space-y-2">
          <Label htmlFor="confirmPassword">Подтвердите пароль</Label>
          <Input
            id="confirmPassword"
            type="text"
            placeholder="Повторите пароль"
            value={confirmPassword}
            onChange={(e) => onConfirmPasswordChange(e.target.value)}
            disabled={isLoading}
          />
        </div>

        <Button
          type="submit"
          disabled={isLoading || code.length !== 6}
          className="w-full bg-[#155eef] hover:bg-[#155eef]/90 text-white"
        >
          {isLoading ? "Сохранение..." : "Сохранить пароль"}
        </Button>

        <div className="text-center">
          <button
            type="button"
            onClick={onResend}
            disabled={isLoading}
            className="text-sm text-primary hover:underline disabled:opacity-50"
          >
            Отправить код повторно
          </button>
        </div>
      </form>
    </div>
  );
};

export default ResetCodeView;
