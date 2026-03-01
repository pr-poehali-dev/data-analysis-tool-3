import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import Icon from "@/components/ui/icon";

interface ResetRequestViewProps {
  email: string;
  onEmailChange: (value: string) => void;
  error: string | null;
  isLoading: boolean;
  onSubmit: (e: React.FormEvent) => void;
  onBack: () => void;
}

export const ResetRequestView = ({
  email,
  onEmailChange,
  error,
  isLoading,
  onSubmit,
  onBack,
}: ResetRequestViewProps) => {
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
        <h2 className="text-2xl font-bold text-foreground mb-2">Восстановление пароля</h2>
        <p className="text-sm text-muted-foreground">
          Введите email, на который зарегистрирован аккаунт
        </p>
      </div>

      <form onSubmit={onSubmit} className="space-y-4">
        {error && (
          <div className="text-sm text-destructive bg-destructive/10 p-3 rounded-md">{error}</div>
        )}

        <div className="space-y-2">
          <Label htmlFor="resetEmail">Email</Label>
          <Input
            id="resetEmail"
            type="email"
            placeholder="your@email.com"
            value={email}
            onChange={(e) => onEmailChange(e.target.value)}
            disabled={isLoading}
          />
        </div>

        <Button
          type="submit"
          disabled={isLoading || !email}
          className="w-full bg-[#155eef] hover:bg-[#155eef]/90 text-white"
        >
          {isLoading ? "Отправка..." : "Отправить код"}
        </Button>
      </form>
    </div>
  );
};

export default ResetRequestView;
