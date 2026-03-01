import { useState } from "react";
import { useToast } from "@/hooks/use-toast";
import { YandexLoginButton } from "@/components/extensions/yandex-auth/YandexLoginButton";
import { TelegramLoginButton } from "@/components/extensions/telegram-bot/TelegramLoginButton";
import { VkLoginButton } from "@/components/extensions/vk-auth/VkLoginButton";
import { GoogleLoginButton } from "@/components/extensions/google-auth/GoogleLoginButton";
import funcUrls from "../../../backend/func2url.json";

const AUTH_URL = funcUrls["yandex-auth-yandex-auth"];
const VK_AUTH_URL = funcUrls["vk-auth-vk-auth"];
const GOOGLE_AUTH_URL = funcUrls["google-auth-google-auth"];
const TG_BOT_USERNAME = "sovetpay_bot";

export const SocialLoginButtons = () => {
  const { toast } = useToast();
  const [yandexLoading, setYandexLoading] = useState(false);
  const [vkLoading, setVkLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);

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
    <>
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
    </>
  );
};

export default SocialLoginButtons;
