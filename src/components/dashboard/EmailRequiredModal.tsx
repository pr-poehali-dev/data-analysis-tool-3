import { useState, useEffect, useRef } from "react";
import { createPortal } from "react-dom";
import { motion, AnimatePresence } from "framer-motion";
import Icon from "@/components/ui/icon";
import { Button } from "@/components/ui/button";
import { authStore } from "@/store/authStore";
import funcUrls from "../../../backend/func2url.json";

const PROFILE_URL = (funcUrls as Record<string, string>)["profile-update"];

interface EmailRequiredModalProps {
  isOpen: boolean;
  onClose: () => void;
  onEmailAdded: (email: string) => void;
}

type Step = "prompt" | "enter_email" | "enter_code";

export const EmailRequiredModal = ({ isOpen, onClose, onEmailAdded }: EmailRequiredModalProps) => {
  const [step, setStep] = useState<Step>("prompt");
  const [email, setEmail] = useState("");
  const [code, setCode] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [resendTimer, setResendTimer] = useState(0);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, []);

  const startResendTimer = () => {
    setResendTimer(60);
    if (timerRef.current) clearInterval(timerRef.current);
    timerRef.current = setInterval(() => {
      setResendTimer((prev) => {
        if (prev <= 1) { clearInterval(timerRef.current!); return 0; }
        return prev - 1;
      });
    }, 1000);
  };

  const getToken = () => authStore.getAccessToken() || "";

  const handleSendCode = async () => {
    if (!email || !email.includes("@")) {
      setError("Введите корректный email");
      return;
    }
    setLoading(true);
    setError("");
    try {
      const res = await fetch(`${PROFILE_URL}?action=send_email_code`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${getToken()}`,
        },
        body: JSON.stringify({ email }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Ошибка отправки кода");
        return;
      }
      setStep("enter_code");
      startResendTimer();
    } catch {
      setError("Ошибка сети");
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyCode = async () => {
    if (!code || code.length < 6) {
      setError("Введите 6-значный код");
      return;
    }
    setLoading(true);
    setError("");
    try {
      const res = await fetch(`${PROFILE_URL}?action=verify_email_code`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${getToken()}`,
        },
        body: JSON.stringify({ code }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Ошибка проверки кода");
        return;
      }
      await authStore.refreshToken();
      onEmailAdded(email);
    } catch {
      setError("Ошибка сети");
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    if (step !== "prompt") {
      setStep("prompt");
      setEmail("");
      setCode("");
      setError("");
      setResendTimer(0);
      if (timerRef.current) clearInterval(timerRef.current);
    }
    onClose();
  };

  if (!isOpen) return null;

  return createPortal(
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[9999] flex items-center justify-center p-4"
        onClick={handleClose}
      >
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          onClick={(e) => e.stopPropagation()}
          className="w-full max-w-md bg-white rounded-2xl shadow-2xl overflow-hidden"
        >
          <div className="p-5 sm:p-6">
            <div className="flex justify-end">
              <button onClick={handleClose} className="text-muted-foreground hover:text-foreground">
                <Icon name="X" size={20} />
              </button>
            </div>

            {step === "prompt" && (
              <div className="text-center">
                <div className="w-16 h-16 bg-amber-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Icon name="Mail" size={32} className="text-amber-600" />
                </div>
                <h2 className="text-xl font-bold text-foreground mb-2">Добавьте электронную почту</h2>
                <p className="text-sm text-muted-foreground mb-6">
                  Для полноценной работы с платформой необходимо указать и подтвердить вашу электронную почту.
                  На неё будут приходить уведомления о сделках и важные оповещения.
                </p>
                <div className="flex flex-col gap-2">
                  <Button onClick={() => setStep("enter_email")} className="w-full">
                    <Icon name="Plus" size={16} className="mr-2" />
                    Добавить почту
                  </Button>
                  <button onClick={handleClose} className="text-sm text-muted-foreground hover:text-foreground transition-colors py-2">
                    Позже
                  </button>
                </div>
              </div>
            )}

            {step === "enter_email" && (
              <div>
                <button onClick={() => { setStep("prompt"); setError(""); }} className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground mb-4">
                  <Icon name="ArrowLeft" size={16} />
                  Назад
                </button>
                <div className="text-center mb-5">
                  <div className="w-14 h-14 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-3">
                    <Icon name="AtSign" size={28} className="text-primary" />
                  </div>
                  <h2 className="text-lg font-bold text-foreground">Введите email</h2>
                  <p className="text-sm text-muted-foreground mt-1">На него придёт код подтверждения</p>
                </div>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => { setEmail(e.target.value); setError(""); }}
                  placeholder="example@mail.ru"
                  className="w-full border border-border rounded-lg px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary mb-3"
                  autoFocus
                />
                {error && <p className="text-sm text-red-500 mb-3">{error}</p>}
                <Button onClick={handleSendCode} disabled={loading} className="w-full">
                  {loading ? (
                    <Icon name="Loader2" size={16} className="animate-spin mr-2" />
                  ) : (
                    <Icon name="Send" size={16} className="mr-2" />
                  )}
                  Отправить код
                </Button>
              </div>
            )}

            {step === "enter_code" && (
              <div>
                <button onClick={() => { setStep("enter_email"); setCode(""); setError(""); }} className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground mb-4">
                  <Icon name="ArrowLeft" size={16} />
                  Изменить email
                </button>
                <div className="text-center mb-5">
                  <div className="w-14 h-14 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-3">
                    <Icon name="ShieldCheck" size={28} className="text-green-600" />
                  </div>
                  <h2 className="text-lg font-bold text-foreground">Введите код</h2>
                  <p className="text-sm text-muted-foreground mt-1">
                    Код отправлен на <span className="font-medium text-foreground">{email}</span>
                  </p>
                </div>
                <input
                  type="text"
                  inputMode="numeric"
                  maxLength={6}
                  value={code}
                  onChange={(e) => { setCode(e.target.value.replace(/\D/g, "")); setError(""); }}
                  placeholder="000000"
                  className="w-full border border-border rounded-lg px-4 py-3 text-center text-2xl font-bold tracking-[0.5em] focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary mb-3"
                  autoFocus
                />
                {error && <p className="text-sm text-red-500 mb-3">{error}</p>}
                <Button onClick={handleVerifyCode} disabled={loading} className="w-full">
                  {loading ? (
                    <Icon name="Loader2" size={16} className="animate-spin mr-2" />
                  ) : (
                    <Icon name="Check" size={16} className="mr-2" />
                  )}
                  Подтвердить
                </Button>
                <button
                  onClick={handleSendCode}
                  disabled={loading || resendTimer > 0}
                  className="w-full text-sm text-muted-foreground hover:text-foreground transition-colors py-2 mt-2 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {resendTimer > 0 ? `Отправить повторно (${resendTimer}с)` : "Отправить код повторно"}
                </button>
              </div>
            )}
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>,
    document.body
  );
};

export default EmailRequiredModal;