import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import Icon from "@/components/ui/icon";
import funcUrls from "../../../backend/func2url.json";

const AUTH_URL = funcUrls["auth-email-auth"];

interface EmailVerificationProps {
  email: string;
  password: string;
  name?: string;
  onVerified: () => void;
  onBack: () => void;
}

export const EmailVerification = ({
  email,
  password,
  name,
  onVerified,
  onBack,
}: EmailVerificationProps) => {
  const [code, setCode] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [timer, setTimer] = useState(60);
  const [canResend, setCanResend] = useState(false);

  useEffect(() => {
    if (timer > 0) {
      const interval = setInterval(() => {
        setTimer((prev) => {
          if (prev <= 1) {
            setCanResend(true);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
      return () => clearInterval(interval);
    }
  }, [timer]);

  const resendCode = async () => {
    setIsLoading(true);
    setError("");
    setCanResend(false);
    setTimer(60);

    try {
      const response = await fetch(`${AUTH_URL}?action=register`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password, name }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Ошибка отправки кода");
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Ошибка отправки кода");
    } finally {
      setIsLoading(false);
    }
  };

  const verifyCode = async () => {
    if (code.length !== 6) {
      setError("Введите 6-значный код");
      return;
    }

    setIsLoading(true);
    setError("");

    try {
      const response = await fetch(`${AUTH_URL}?action=verify-email`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, code }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Неверный код");
      }

      onVerified();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Ошибка проверки кода");
    } finally {
      setIsLoading(false);
    }
  };

  const handleCodeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.replace(/\D/g, "").slice(0, 6);
    setCode(value);
    setError("");
  };

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
        <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4">
          <Icon name="Mail" className="text-primary" size={32} />
        </div>
        <h2 className="text-2xl font-bold text-foreground mb-2">
          Подтверждение почты
        </h2>
        <p className="text-muted-foreground">
          Мы отправили код на почту <br />
          <span className="font-semibold text-foreground">{email}</span>
        </p>
      </div>

      <div className="space-y-2">
        <Label htmlFor="code">Введите 6-значный код</Label>
        <Input
          id="code"
          type="text"
          inputMode="numeric"
          placeholder="000000"
          value={code}
          onChange={handleCodeChange}
          maxLength={6}
          className="text-center text-2xl tracking-widest font-mono"
          autoFocus
        />
        {error && <p className="text-sm text-red-500">{error}</p>}
      </div>

      <Button
        onClick={verifyCode}
        disabled={isLoading || code.length !== 6}
        className="w-full h-12 text-base"
      >
        {isLoading ? (
          <div className="flex items-center gap-2">
            <Icon name="Loader2" className="animate-spin" size={20} />
            <span>Проверка...</span>
          </div>
        ) : (
          "Подтвердить"
        )}
      </Button>

      <div className="text-center">
        {timer > 0 ? (
          <p className="text-sm text-muted-foreground">
            Повторная отправка через {timer} сек
          </p>
        ) : (
          <button
            onClick={resendCode}
            disabled={!canResend || isLoading}
            className="text-sm text-primary hover:underline disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Отправить код повторно
          </button>
        )}
      </div>
    </div>
  );
};

export default EmailVerification;
