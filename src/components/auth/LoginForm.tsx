import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { authStore } from "@/store/authStore";
import { SocialLoginButtons } from "./SocialLoginButtons";
import { ResetRequestView } from "./ResetRequestView";
import { ResetCodeView, ResetSuccessView } from "./ResetCodeView";
import funcUrls from "../../../backend/func2url.json";

const AUTH_EMAIL_URL = funcUrls["auth-email-auth"];

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
        credentials: "include",
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
        authStore.setAccessToken(result.access_token);
        authStore.setProvider("email");
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

  if (view === "reset-success") {
    return <ResetSuccessView onBackToLogin={backToLogin} />;
  }

  if (view === "reset-code") {
    return (
      <ResetCodeView
        email={resetEmail}
        code={resetCode}
        onCodeChange={setResetCode}
        newPassword={newPassword}
        onNewPasswordChange={setNewPassword}
        confirmPassword={confirmPassword}
        onConfirmPasswordChange={setConfirmPassword}
        error={resetError}
        message={resetMessage}
        isLoading={resetLoading}
        onSubmit={handleResetPassword}
        onResend={handleResendCode}
        onBack={() => setView("reset-request")}
      />
    );
  }

  if (view === "reset-request") {
    return (
      <ResetRequestView
        email={resetEmail}
        onEmailChange={setResetEmail}
        error={resetError}
        isLoading={resetLoading}
        onSubmit={handleRequestReset}
        onBack={backToLogin}
      />
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

      <SocialLoginButtons />

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