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

interface LoginFormProps {
  onSuccess: () => void;
}

export const LoginForm = ({ onSuccess }: LoginFormProps) => {
  const { toast } = useToast();
  const [yandexLoading, setYandexLoading] = useState(false);
  const [vkLoading, setVkLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
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
            type="password"
            placeholder="••••••••"
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
      </form>
    </div>
  );
};