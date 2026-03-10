import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import Icon from "@/components/ui/icon";
import { Footer } from "@/components/landing/Footer";
import { authStore } from "@/store/authStore";
import func2url from "../../backend/func2url.json";

const FEEDBACK_URL = (func2url as Record<string, string>)["send-feedback"];

export const Help = () => {
  const navigate = useNavigate();
  const user = authStore.getUser();

  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  const [email, setEmail] = useState(user?.email || "");
  const [subjectType, setSubjectType] = useState("Вопрос");
  const [message, setMessage] = useState("");
  const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">("idle");

  const handleGoBack = () => {
    if (user) {
      navigate("/dashboard");
    } else {
      navigate("/");
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim() || !message.trim()) return;
    setStatus("loading");
    try {
      const res = await fetch(FEEDBACK_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email.trim(), message: message.trim(), subject_type: subjectType }),
      });
      if (!res.ok) throw new Error("error");
      setStatus("success");
      setMessage("");
    } catch {
      setStatus("error");
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white flex flex-col">

      {/* Хедер — на мобиле компактнее */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-50 shadow-sm">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-3 sm:py-4 flex items-center justify-between">
          <img
            src="https://cdn.poehali.dev/projects/98f29e7d-3c71-4ce1-9618-2738c542d164/bucket/bf9825ff-384f-4373-81c0-67ea99aefa6f.png"
            alt="SovetPay"
            className="h-9 sm:h-12 w-auto cursor-pointer"
            onClick={handleGoBack}
          />
          <button
            onClick={handleGoBack}
            className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-800 transition-colors sm:hidden"
          >
            <Icon name="ArrowLeft" size={16} />
            Назад
          </button>
          <Button onClick={handleGoBack} variant="outline" className="hidden sm:flex">
            <Icon name="ArrowLeft" size={16} className="mr-2" />
            Назад
          </Button>
        </div>
      </header>

      {/* Основной контент */}
      <main className="flex-1 w-full max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-12">

        {/* На мобиле — без карточки, контент во всю ширину */}
        <div className="bg-white sm:rounded-2xl sm:shadow-lg p-0 sm:p-10">

          {/* Заголовок */}
          <div className="flex items-center gap-3 mb-2 px-0">
            <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-full bg-blue-50 flex items-center justify-center shrink-0">
              <Icon name="LifeBuoy" size={18} className="text-blue-500" />
            </div>
            <h1 className="text-xl sm:text-3xl font-bold text-gray-900">Помощь</h1>
          </div>
          <p className="text-gray-500 mb-6 sm:mb-8 text-sm leading-relaxed">
            Столкнулись с проблемой или хотите оставить отзыв? Напишите нам — мы ответим на вашу почту в ближайшее время.
          </p>

          {status === "success" ? (
            <div className="flex flex-col items-center gap-4 py-10 text-center">
              <div className="w-16 h-16 rounded-full bg-green-50 flex items-center justify-center">
                <Icon name="CheckCircle" size={32} className="text-green-500" />
              </div>
              <h2 className="text-xl font-semibold text-gray-900">Сообщение отправлено!</h2>
              <p className="text-gray-500 text-sm max-w-xs">
                Мы получили ваше обращение и ответим на&nbsp;
                <span className="font-medium text-gray-700">{email}</span> в ближайшее время.
              </p>
              <Button variant="outline" className="mt-2" onClick={() => setStatus("idle")}>
                Отправить ещё одно
              </Button>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4 sm:space-y-5">

              {/* Email */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  Ваш email
                </label>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="example@mail.ru"
                  className="w-full px-4 py-3 sm:py-2.5 rounded-xl sm:rounded-lg border border-gray-300 text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
                />
              </div>

              {/* Тема */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  Тема обращения
                </label>
                <div className="flex gap-2">
                  {["Проблема", "Вопрос", "Предложение"].map((type) => (
                    <button
                      key={type}
                      type="button"
                      onClick={() => setSubjectType(type)}
                      className={`flex-1 sm:flex-none px-3 sm:px-4 py-2.5 sm:py-2 rounded-xl sm:rounded-lg text-sm font-medium border transition-colors ${
                        subjectType === type
                          ? "bg-blue-500 text-white border-blue-500"
                          : "bg-white text-gray-600 border-gray-300 hover:border-blue-400 hover:text-blue-500"
                      }`}
                    >
                      {type}
                    </button>
                  ))}
                </div>
              </div>

              {/* Сообщение */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  Описание проблемы или отзыв
                </label>
                <textarea
                  required
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  placeholder="Опишите вашу ситуацию как можно подробнее..."
                  rows={6}
                  className="w-full px-4 py-3 sm:py-2.5 rounded-xl sm:rounded-lg border border-gray-300 text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition resize-none"
                />
              </div>

              {status === "error" && (
                <p className="text-sm text-red-500 flex items-center gap-1.5">
                  <Icon name="AlertCircle" size={14} />
                  Не удалось отправить сообщение. Попробуйте позже.
                </p>
              )}

              <Button
                type="submit"
                disabled={status === "loading" || !email.trim() || !message.trim()}
                className="w-full py-3 sm:py-2 text-base sm:text-sm rounded-xl sm:rounded-lg"
              >
                {status === "loading" ? (
                  <>
                    <Icon name="Loader2" size={16} className="mr-2 animate-spin" />
                    Отправляем...
                  </>
                ) : (
                  <>
                    <Icon name="Send" size={16} className="mr-2" />
                    Отправить
                  </>
                )}
              </Button>
            </form>
          )}
        </div>
      </main>

      <Footer hiddenOnMobile />
    </div>
  );
};

export default Help;
