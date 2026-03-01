import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { authStore } from "@/store/authStore";
import { YandexLoginButton } from "@/components/extensions/yandex-auth/YandexLoginButton";
import { TelegramLoginButton } from "@/components/extensions/telegram-bot/TelegramLoginButton";
import { VkLoginButton } from "@/components/extensions/vk-auth/VkLoginButton";
import { GoogleLoginButton } from "@/components/extensions/google-auth/GoogleLoginButton";
import {
  InputOTP,
  InputOTPGroup,
  InputOTPSlot,
} from "@/components/ui/input-otp";
import Icon from "@/components/ui/icon";
import funcUrls from "../../../backend/func2url.json";

const AUTH_EMAIL_URL = funcUrls["auth-email-auth"];
const AUTH_URL = funcUrls["yandex-auth-yandex-auth"];
const VK_AUTH_URL = funcUrls["vk-auth-vk-auth"];
const GOOGLE_AUTH_URL = funcUrls["google-auth-google-auth"];
const TG_BOT_USERNAME = "sovetpay_bot";

const loginSchema = z.object({
  email: z.string().email("Некорректный email"),
  password: z.string().min(6, "Минимум 6 символов"),
});

type LoginData = z.infer<typeof loginSchema>;
type View = "login" | "reset-request" | "reset-code" | "reset-success";

interface LoginFormProps {
  onSuccess: () => void;
}

export const LoginForm = ({ onSuccess }: LoginFormProps) => {
  const { toast } = useToast();
  const [view, setView] = useState<View>("login");
  const [yandexLoading, setYandexLoading] = useState(false);
  const [vkLoading, setVkLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);

  const [resetEmail, setResetEmail] = useState("");
  const [resetCode, setResetCode] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [resetLoading, setResetLoading] = useState(false);
  const [resetError, setResetError] = useState<string | null>(null);
  const [resetMessage, setResetMessage] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<LoginData>({
    resolver: zodResolver(loginSchema),
  });

  const onSubmit = async (data: LoginData) => {
    try {
      const res = await fetch(`${AUTH_EMAIL_URL}?action=login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: data.email, password: data.password }),
      });

      const result = await res.json();

      if (!res.ok) {
        toast({
          title: "Ошибка входа",
          description: result.error || "Неверный email или пароль",
          variant: "destructive",
        });
        return;
      }

      if (result.access_token) {
        localStorage.setItem("refresh_token", result.refresh_token);
      }

      authStore.setUser({
        firstName: result.user?.name?.split(' ')[0] || '',
        lastName: result.user?.name?.split(' ').slice(1).join(' ') || '',
        email: result.user?.email || '',
        phone: '',
        role: 'tenant',
      });

      toast({
        title: "Успешный вход",
        description: `Добро пожаловать!`,
      });
      onSuccess();
    } catch {
      toast({
        title: "Ошибка сети",
        description: "Попробуйте позже",
        variant: "destructive",
      });
    }
  };

  const handleRequestReset = async (e: React.FormEvent) => {
    e.preventDefault();
    setResetError(null);
    setResetMessage(null);

    if (!resetEmail) {
      setResetError("Введите email");
      return;
    }

    setResetLoading(true);
    try {
      const res = await fetch(`${AUTH_EMAIL_URL}?action=reset-password`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: resetEmail }),
      });

      await res.json();
      setResetMessage("Если аккаунт существует, код отправлен на почту");
      setView("reset-code");
    } catch {
      setResetError("Ошибка сети, попробуйте позже");
    } finally {
      setResetLoading(false);
    }
  };

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setResetError(null);

    if (resetCode.length !== 6) {
      setResetError("Введите 6-значный код");
      return;
    }
    if (!newPassword) {
      setResetError("Введите новый пароль");
      return;
    }
    if (newPassword.length < 8) {
      setResetError("Пароль должен содержать минимум 8 символов");
      return;
    }
    if (newPassword !== confirmPassword) {
      setResetError("Пароли не совпадают");
      return;
    }

    setResetLoading(true);
    try {
      const res = await fetch(`${AUTH_EMAIL_URL}?action=reset-password`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: resetEmail,
          code: resetCode,
          new_password: newPassword,
        }),
      });

      const result = await res.json();

      if (!res.ok) {
        setResetError(result.error || "Ошибка сброса пароля");
        return;
      }

      setView("reset-success");
    } catch {
      setResetError("Ошибка сети, попробуйте позже");
    } finally {
      setResetLoading(false);
    }
  };

  const handleResendCode = async () => {
    setResetError(null);
    setResetCode("");
    setResetLoading(true);
    try {
      await fetch(`${AUTH_EMAIL_URL}?action=reset-password`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: resetEmail }),
      });
      setResetMessage("Код отправлен повторно");
    } catch {
      setResetError("Ошибка отправки");
    } finally {
      setResetLoading(false);
    }
  };

  const backToLogin = () => {
    setView("login");
    setResetEmail("");
    setResetCode("");
    setNewPassword("");
    setConfirmPassword("");
    setResetError(null);
    setResetMessage(null);
  };

  const handleGoogleLogin = async () => {
    setGoogleLoading(true);
    try {
      const res = await fetch(`${GOOGLE_AUTH_URL}?action=auth-url`);
      const data = await res.json();
      if (data.auth_url) {
        if (data.state) {
          sessionStorage.setItem("google_auth_state", data.state);
        }
        window.location.href = data.auth_url;
      } else {
        toast({
          title: "Ошибка",
          description: "Не удалось начать авторизацию через Google",
          variant: "destructive",
        });
        setGoogleLoading(false);
      }
    } catch {
      toast({
        title: "Ошибка сети",
        description: "Попробуйте позже",
        variant: "destructive",
      });
      setGoogleLoading(false);
    }
  };

  const handleVkLogin = async () => {
    setVkLoading(true);
    try {
      const res = await fetch(`${VK_AUTH_URL}?action=auth-url`);
      const data = await res.json();
      if (data.auth_url) {
        if (data.state) {
          sessionStorage.setItem("vk_auth_state", data.state);
        }
        if (data.code_verifier) {
          sessionStorage.setItem("vk_auth_code_verifier", data.code_verifier);
        }
        window.location.href = data.auth_url;
      } else {
        toast({
          title: "Ошибка",
          description: "Не удалось начать авторизацию через ВК",
          variant: "destructive",
        });
        setVkLoading(false);
      }
    } catch {
      toast({
        title: "Ошибка сети",
        description: "Попробуйте позже",
        variant: "destructive",
      });
      setVkLoading(false);
    }
  };

  const handleTelegramLogin = () => {
    window.open(`https://t.me/${TG_BOT_USERNAME}?start=web_auth`, "_blank");
  };

  const handleYandexLogin = async () => {
    setYandexLoading(true);
    try {
      const res = await fetch(`${AUTH_URL}?action=auth-url`);
      const data = await res.json();
      if (data.auth_url) {
        if (data.state) {
          sessionStorage.setItem("yandex_auth_state", data.state);
        }
        window.location.href = data.auth_url;
      } else {
        toast({
          title: "Ошибка",
          description: "Не удалось начать авторизацию",
          variant: "destructive",
        });
        setYandexLoading(false);
      }
    } catch {
      toast({
        title: "Ошибка сети",
        description: "Попробуйте позже",
        variant: "destructive",
      });
      setYandexLoading(false);
    }
  };

  if (view === "reset-success") {
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
        <Button onClick={backToLogin} className="w-full bg-[#155eef] hover:bg-[#155eef]/90 text-white">
          Войти
        </Button>
      </div>
    );
  }

  if (view === "reset-code") {
    return (
      <div className="space-y-6">
        <button
          onClick={() => setView("reset-request")}
          className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors"
        >
          <Icon name="ChevronLeft" size={20} />
          <span>Назад</span>
        </button>

        <div className="text-center">
          <h2 className="text-2xl font-bold text-foreground mb-2">Новый пароль</h2>
          <p className="text-sm text-muted-foreground">
            Введите код с почты и новый пароль для {resetEmail}
          </p>
        </div>

        <form onSubmit={handleResetPassword} className="space-y-4">
          {resetMessage && (
            <div className="text-sm text-green-600 bg-green-50 p-3 rounded-md">{resetMessage}</div>
          )}
          {resetError && (
            <div className="text-sm text-destructive bg-destructive/10 p-3 rounded-md">{resetError}</div>
          )}

          <div className="space-y-2">
            <Label>Код подтверждения</Label>
            <div className="flex justify-center py-2">
              <InputOTP maxLength={6} value={resetCode} onChange={setResetCode} disabled={resetLoading}>
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
              onChange={(e) => setNewPassword(e.target.value)}
              disabled={resetLoading}
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
              onChange={(e) => setConfirmPassword(e.target.value)}
              disabled={resetLoading}
            />
          </div>

          <Button
            type="submit"
            disabled={resetLoading || resetCode.length !== 6}
            className="w-full bg-[#155eef] hover:bg-[#155eef]/90 text-white"
          >
            {resetLoading ? "Сохранение..." : "Сохранить пароль"}
          </Button>

          <div className="text-center">
            <button
              type="button"
              onClick={handleResendCode}
              disabled={resetLoading}
              className="text-sm text-primary hover:underline disabled:opacity-50"
            >
              Отправить код повторно
            </button>
          </div>
        </form>
      </div>
    );
  }

  if (view === "reset-request") {
    return (
      <div className="space-y-6">
        <button
          onClick={backToLogin}
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

        <form onSubmit={handleRequestReset} className="space-y-4">
          {resetError && (
            <div className="text-sm text-destructive bg-destructive/10 p-3 rounded-md">{resetError}</div>
          )}

          <div className="space-y-2">
            <Label htmlFor="resetEmail">Email</Label>
            <Input
              id="resetEmail"
              type="email"
              placeholder="your@email.com"
              value={resetEmail}
              onChange={(e) => setResetEmail(e.target.value)}
              disabled={resetLoading}
            />
          </div>

          <Button
            type="submit"
            disabled={resetLoading || !resetEmail}
            className="w-full bg-[#155eef] hover:bg-[#155eef]/90 text-white"
          >
            {resetLoading ? "Отправка..." : "Отправить код"}
          </Button>
        </form>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="text-center">
        <h2 className="text-2xl font-bold text-[#202020]">Вход в аккаунт</h2>
        <p className="text-sm text-[#666666] mt-2">
          Введите данные для входа в систему
        </p>
      </div>

      <YandexLoginButton
        onClick={handleYandexLogin}
        isLoading={yandexLoading}
        className="w-full"
      />

      {/* <GoogleLoginButton
        onClick={handleGoogleLogin}
        isLoading={googleLoading}
        className="w-full"
      /> */}

      {/* <VkLoginButton
        onClick={handleVkLogin}
        isLoading={vkLoading}
        className="w-full"
      /> */}

      <TelegramLoginButton
        onClick={handleTelegramLogin}
        className="w-full"
      />

      <div className="relative">
        <div className="absolute inset-0 flex items-center">
          <span className="w-full border-t" />
        </div>
        <div className="relative flex justify-center text-xs uppercase">
          <span className="bg-background px-2 text-muted-foreground">или</span>
        </div>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="email">Email</Label>
          <Input
            id="email"
            type="email"
            placeholder="your@email.com"
            {...register("email")}
            className={errors.email ? "border-red-500" : ""}
          />
          {errors.email && (
            <p className="text-sm text-red-500">{errors.email.message}</p>
          )}
        </div>

        <div className="space-y-2">
          <Label htmlFor="password">Пароль</Label>
          <Input
            id="password"
            type="text"
            placeholder="Введите пароль"
            {...register("password")}
            className={errors.password ? "border-red-500" : ""}
          />
          {errors.password && (
            <p className="text-sm text-red-500">{errors.password.message}</p>
          )}
        </div>

        <Button
          type="submit"
          disabled={isSubmitting}
          className="w-full bg-[#155eef] hover:bg-[#155eef]/90 text-white"
        >
          {isSubmitting ? "Вход..." : "Войти"}
        </Button>

        <div className="text-center">
          <button
            type="button"
            onClick={() => setView("reset-request")}
            className="text-sm text-muted-foreground hover:text-primary transition-colors"
          >
            Забыли пароль?
          </button>
        </div>
      </form>
    </div>
  );
};

export default LoginForm;
