import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { authStore } from "@/store/authStore";
import funcUrls from "../../backend/func2url.json";

const AUTH_URL = funcUrls["telegram-bot-telegram-auth"];

export default function TelegramCallback() {
  const navigate = useNavigate();
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const handleCallback = async () => {
      const params = new URLSearchParams(window.location.search);
      const token = params.get("token");

      if (!token) {
        setError("Токен авторизации не получен");
        return;
      }

      try {
        const res = await fetch(`${AUTH_URL}?action=callback`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
          body: JSON.stringify({ token }),
        });

        const data = await res.json();

        if (!res.ok) {
          setError(data.error || "Ошибка авторизации");
          return;
        }

        if (data.access_token) {
          authStore.setAccessToken(data.access_token);
        }
        authStore.setProvider("telegram");

        const user = data.user;
        const telegramUsername = user.telegramUsername || "";
        const userEmail = user.email || `tg_${user.telegram_id || user.id}`;
        authStore.setUser({
          firstName: user.firstName || user.name?.split(" ")[0] || "",
          lastName: user.lastName || user.name?.split(" ").slice(1).join(" ") || "",
          role: user.role || "tenant",
          email: userEmail,
          phone: user.phone || "",
          city: user.city || "",
          photo: user.avatar_url || "",
          vkLink: user.vkLink || "",
          telegramUsername,
        });

        navigate("/dashboard", { replace: true });
      } catch {
        setError("Ошибка сети. Попробуйте позже.");
      }
    };

    handleCallback();
  }, [navigate]);

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center space-y-4 p-8">
          <div className="text-red-500 text-lg font-medium">{error}</div>
          <button
            onClick={() => navigate("/")}
            className="text-primary underline"
          >
            Вернуться на главную
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="text-center space-y-3">
        <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full mx-auto" />
        <p className="text-muted-foreground">Авторизация через Telegram...</p>
      </div>
    </div>
  );
}