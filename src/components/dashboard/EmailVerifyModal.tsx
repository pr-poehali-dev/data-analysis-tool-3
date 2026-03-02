import { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import { motion, AnimatePresence } from "framer-motion";
import Icon from "@/components/ui/icon";
import { Button } from "@/components/ui/button";
import funcUrls from "../../../backend/func2url.json";

const PROFILE_URL = (funcUrls as Record<string, string>)["profile-update"];

interface EmailVerifyModalProps {
  isOpen: boolean;
  email: string;
  onClose: () => void;
  onVerified: (email: string) => void;
}

export const EmailVerifyModal = ({ isOpen, email, onClose, onVerified }: EmailVerifyModalProps) => {
  const [code, setCode] = useState("");
  const [loading, setLoading] = useState(false);
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState("");

  const getToken = () => {
    return (
      localStorage.getItem("yandex_auth_access_token") ||
      localStorage.getItem("telegram_auth_access_token") ||
      localStorage.getItem("vk_auth_access_token") ||
      localStorage.getItem("google_auth_access_token") ||
      localStorage.getItem("email_auth_access_token") ||
      ""
    );
  };

  useEffect(() => {
    if (isOpen && email) {
      setCode("");
      setError("");
      setSent(false);
      sendCode();
    }
  }, [isOpen, email]);

  const sendCode = async () => {
    setSending(true);
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
      setSent(true);
    } catch {
      setError("Ошибка сети");
    } finally {
      setSending(false);
    }
  };

  const handleVerify = async () => {
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
        setError(data.error || "Неверный код");
        return;
      }
      onVerified(email);
    } catch {
      setError("Ошибка сети");
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return createPortal(
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[9999] flex items-center justify-center p-4"
        onClick={onClose}
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
              <button onClick={onClose} className="text-muted-foreground hover:text-foreground">
                <Icon name="X" size={20} />
              </button>
            </div>

            <div className="text-center mb-5">
              <div className="w-14 h-14 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-3">
                <Icon name="ShieldCheck" size={28} className="text-green-600" />
              </div>
              <h2 className="text-lg font-bold text-foreground">Подтвердите новую почту</h2>
              <p className="text-sm text-muted-foreground mt-1">
                {sent ? (
                  <>Код отправлен на <span className="font-medium text-foreground">{email}</span></>
                ) : sending ? (
                  "Отправляем код..."
                ) : (
                  "Подготовка..."
                )}
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
              disabled={!sent}
            />

            {error && <p className="text-sm text-red-500 mb-3 text-center">{error}</p>}

            <Button onClick={handleVerify} disabled={loading || !sent} className="w-full">
              {loading ? (
                <Icon name="Loader2" size={16} className="animate-spin mr-2" />
              ) : (
                <Icon name="Check" size={16} className="mr-2" />
              )}
              Подтвердить
            </Button>

            <button
              onClick={sendCode}
              disabled={sending}
              className="w-full text-sm text-muted-foreground hover:text-foreground transition-colors py-2 mt-2"
            >
              Отправить код повторно
            </button>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>,
    document.body
  );
};

export default EmailVerifyModal;
