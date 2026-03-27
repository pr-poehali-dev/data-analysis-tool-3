import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { adminStore } from "@/store/adminStore";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import Icon from "@/components/ui/icon";

const ADMIN_AUTH_URL = "https://functions.poehali.dev/f95fb7eb-1686-4a09-83f0-31116870baa3";

export default function AdminLogin() {
  const navigate = useNavigate();
  const [login, setLogin] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const res = await fetch(ADMIN_AUTH_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ login: login.trim(), password: password.trim() }),
      });

      const data = await res.json();

      if (!res.ok || !data.token) {
        setError(data.error || "Неверный логин или пароль");
        return;
      }

      adminStore.setToken(data.token);
      navigate("/admin/dashboard");
    } catch (e) {
      console.error("AdminLogin fetch error:", e);
      setError("Ошибка соединения. Попробуйте ещё раз.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-muted/30">
      <div className="w-full max-w-sm bg-background border rounded-xl shadow-sm p-8">
        <div className="flex flex-col items-center mb-6">
          <div className="w-12 h-12 bg-primary rounded-xl flex items-center justify-center mb-3">
            <Icon name="ShieldCheck" size={24} className="text-primary-foreground" />
          </div>
          <h1 className="text-xl font-semibold text-foreground">Панель администратора</h1>
          <p className="text-sm text-muted-foreground mt-1">Введите данные для входа</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="login">Логин</Label>
            <Input
              id="login"
              type="text"
              value={login}
              onChange={(e) => setLogin(e.target.value)}
              placeholder="admin"
              autoComplete="username"
              required
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="password">Пароль</Label>
            <Input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              autoComplete="current-password"
              required
            />
          </div>

          {error && (
            <p className="text-sm text-red-600 flex items-center gap-1.5">
              <Icon name="AlertCircle" size={14} />
              {error}
            </p>
          )}

          <Button type="submit" className="w-full" disabled={loading}>
            {loading ? (
              <>
                <Icon name="Loader2" size={16} className="mr-2 animate-spin" />
                Вход...
              </>
            ) : (
              "Войти"
            )}
          </Button>
        </form>
      </div>
    </div>
  );
}