import { useNavigate } from "react-router-dom";
import { useEffect } from "react";
import { Button } from "@/components/ui/button";
import Icon from "@/components/ui/icon";
import { Footer } from "@/components/landing/Footer";
import { authStore } from "@/store/authStore";

export const TermsOfUse = () => {
  const navigate = useNavigate();
  const user = authStore.getUser();

  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  const handleGoBack = () => {
    if (user) {
      navigate('/dashboard');
    } else {
      navigate('/');
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white">
      <header className="bg-white border-b border-gray-200 sticky top-0 z-50 shadow-sm">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <img
              src="https://cdn.poehali.dev/projects/98f29e7d-3c71-4ce1-9618-2738c542d164/bucket/bf9825ff-384f-4373-81c0-67ea99aefa6f.png"
              alt="SovetPay"
              className="h-12 w-auto cursor-pointer"
              onClick={handleGoBack}
            />
          </div>
          <Button onClick={handleGoBack} variant="outline">
            <Icon name="ArrowLeft" size={16} className="mr-2" />
            Назад
          </Button>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <article className="bg-white rounded-2xl shadow-lg p-8 sm:p-12">
          <h1 className="text-xl sm:text-4xl font-bold text-gray-900 mb-4">
            Условия пользования
          </h1>

          <p className="text-sm text-gray-500 mb-8">
            Индивидуального предпринимателя Керимова Р.К.<br />
            Последнее обновление: 27 марта 2026 г.
          </p>

          <div className="space-y-4 text-gray-700 leading-relaxed">
            <p>Текст условий пользования будет добавлен в ближайшее время.</p>
          </div>
        </article>
      </main>

      <Footer />
    </div>
  );
};

export default TermsOfUse;
