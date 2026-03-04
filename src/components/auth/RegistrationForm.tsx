import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { authStore } from "@/store/authStore";
import { YandexLoginButton } from "@/components/extensions/yandex-auth/YandexLoginButton";
import { TelegramLoginButton } from "@/components/extensions/telegram-bot/TelegramLoginButton";
import { VkLoginButton } from "@/components/extensions/vk-auth/VkLoginButton";
import { GoogleLoginButton } from "@/components/extensions/google-auth/GoogleLoginButton";
import { EmailVerification } from "./EmailVerification";
import funcUrls from "../../../backend/func2url.json";

const AUTH_EMAIL_URL = funcUrls["auth-email-auth"];
const AUTH_URL = funcUrls["yandex-auth-yandex-auth"];
const VK_AUTH_URL = funcUrls["vk-auth-vk-auth"];
const GOOGLE_AUTH_URL = funcUrls["google-auth-google-auth"];
const TG_BOT_USERNAME = "sovetpay_bot";

const registrationSchema = z.object({
  firstName: z.string().min(2, "Минимум 2 символа"),
  lastName: z.string().min(2, "Минимум 2 символа"),
  phone: z.string().regex(/^\+?[0-9]{10,12}$/, "Некорректный номер телефона"),
  email: z.string().email("Некорректный email"),
  password: z.string().min(6, "Минимум 6 символов"),
});

type FormData = z.infer<typeof registrationSchema>;

interface RegistrationFormProps {
  onSuccess: (data: FormData) => void;
}

export const RegistrationForm = ({ onSuccess }: RegistrationFormProps) => {
  const [step, setStep] = useState<"form" | "email-verify">("form");
  const [formData, setFormData] = useState<FormData | null>(null);
  const [registerError, setRegisterError] = useState<string | null>(null);
  const [yandexLoading, setYandexLoading] = useState(false);
  const [vkLoading, setVkLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const { toast } = useToast();

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<FormData>({
    resolver: zodResolver(registrationSchema),
  });

  const onSubmit = async (data: FormData) => {
    setRegisterError(null);
    try {
      const res = await fetch(`${AUTH_EMAIL_URL}?action=register`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: data.email,
          password: data.password,
          name: `${data.firstName} ${data.lastName}`.trim(),
        }),
      });

      const result = await res.json();

      if (!res.ok) {
        setRegisterError(result.error || "Ошибка регистрации");
        return;
      }

      setFormData(data);

      if (result.email_verification_required) {
        setStep("email-verify");
      } else {
        await autoLogin(data.email, data.password);
      }
    } catch {
      setRegisterError("Ошибка сети, попробуйте позже");
    }
  };

  const autoLogin = async (email: string, password: string) => {
    try {
      const res = await fetch(`${AUTH_EMAIL_URL}?action=login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ email, password }),
      });

      const data = await res.json();

      if (res.ok && data.access_token) {
        authStore.setAccessToken(data.access_token);
        authStore.setProvider("email");
        authStore.setUser({
          firstName: data.user?.name?.split(' ')[0] || '',
          lastName: data.user?.name?.split(' ').slice(1).join(' ') || '',
          email: data.user?.email || '',
          phone: '',
          role: 'tenant',
        });
      }
    } catch { /* ignore */ }
    if (formData) {
      onSuccess(formData);
    }
  };

  const handleEmailVerified = async () => {
    if (formData) {
      await autoLogin(formData.email, formData.password);
      onSuccess(formData);
    }
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

  return (
    <div className="w-full max-w-2xl mx-auto">
      <AnimatePresence mode="wait">
        {step === "form" && (
          <motion.div
            key="registration-form"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.3 }}
          >
            <div className="text-center mb-8">
              <h2 className="text-3xl font-bold text-foreground mb-3">
                Регистрация
              </h2>
              <p className="text-muted-foreground">
                Быстрая регистрация через соцсети или заполните форму
              </p>
            </div>

            <div className="space-y-3 mb-6">
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
            </div>

            <div className="relative mb-6">
              <div className="absolute inset-0 flex items-center">
                <span className="w-full border-t" />
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-background px-2 text-muted-foreground">или заполните форму</span>
              </div>
            </div>

            <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
              {registerError && (
                <div className="text-sm text-destructive bg-destructive/10 p-3 rounded-md">
                  {registerError}
                </div>
              )}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="firstName">Имя</Label>
                  <Input
                    id="firstName"
                    placeholder="Иван"
                    {...register("firstName")}
                    error={errors.firstName?.message}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="lastName">Фамилия</Label>
                  <Input
                    id="lastName"
                    placeholder="Иванов"
                    {...register("lastName")}
                    error={errors.lastName?.message}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="phone">Номер телефона</Label>
                <Input
                  id="phone"
                  type="tel"
                  placeholder="+7 (900) 123-45-67"
                  {...register("phone")}
                  error={errors.phone?.message}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="ivan@example.com"
                  {...register("email")}
                  error={errors.email?.message}
                />
                <p className="text-xs text-muted-foreground">
                  Мы отправим код подтверждения на вашу почту
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="password">Пароль</Label>
                <Input
                  id="password"
                  type="password"
                  placeholder="••••••"
                  {...register("password")}
                  error={errors.password?.message}
                />
              </div>

              <Button
                type="submit"
                disabled={isSubmitting}
                className="w-full bg-[#155eef] hover:bg-[#155eef]/90 text-white"
                size="lg"
              >
                {isSubmitting ? "Регистрация..." : "Продолжить"}
              </Button>
            </form>
          </motion.div>
        )}

        {step === "email-verify" && formData && (
          <motion.div
            key="phone-verification"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.3 }}
          >
            <EmailVerification
              email={formData.email}
              password={formData.password}
              name={`${formData.firstName} ${formData.lastName}`.trim()}
              onVerified={handleEmailVerified}
              onBack={() => setStep("form")}
            />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};