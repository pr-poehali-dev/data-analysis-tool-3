import { useState, useEffect } from "react";
import { useNavigate, useParams, useLocation } from "react-router-dom";
import { motion } from "framer-motion";
import Icon from "@/components/ui/icon";
import { Button } from "@/components/ui/button";
import { PortfolioNavbar, Footer } from "@/components/landing";
import { requestsStore, Request } from "@/store/requestsStore";
import { authStore } from "@/store/authStore";

export const RequestDetails = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { requestId } = useParams<{ requestId: string }>();
  const [request, setRequest] = useState<Request | null>(null);
  
  const fromDashboard = location.state?.fromDashboard || false;

  const goBack = () => {
    const user = authStore.getUser();
    if (user || fromDashboard) {
      navigate("/dashboard", { state: { activeSection: "feed" } });
    } else {
      navigate("/", { state: { activeSection: "feed" } });
    }
  };

  useEffect(() => {
    if (!requestId) {
      goBack();
      return;
    }

    const fetchedRequest = requestsStore.getRequestById(requestId);
    if (!fetchedRequest) {
      goBack();
      return;
    }

    setRequest(fetchedRequest);
  }, [requestId]);

  if (!request) return null;

  const createdAt = new Date(request.createdAt);
  const now = new Date();
  const daysDiff = Math.floor((now.getTime() - createdAt.getTime()) / (1000 * 60 * 60 * 24));
  const isNew = daysDiff <= 2;

  return (
    <div className="min-h-screen bg-background">
      <PortfolioNavbar onLogout={() => navigate("/")} showNavigation={false} />

      <main className="max-w-4xl mx-auto px-6 py-8 mt-20 mb-20">
        <Button
          variant="outline"
          onClick={goBack}
          className="mb-6"
        >
          <Icon name="ArrowLeft" size={16} className="mr-2" />
          Назад в ленту
        </Button>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white border border-border rounded-xl p-8"
        >
          {isNew && (
            <div className="mb-6">
              <span className="inline-flex items-center gap-1 px-3 py-1.5 bg-primary text-white text-sm font-semibold rounded-full">
                <Icon name="Sparkles" size={14} />
                Новая заявка
              </span>
            </div>
          )}

          <div className="flex items-start gap-6 mb-8">
            <img
              src={request.avatar}
              alt={request.name}
              className="w-24 h-24 rounded-full"
            />
            <div className="flex-1">
              <h1 className="text-3xl font-bold text-foreground mb-2">{request.name}</h1>
              <p className="text-lg text-muted-foreground mb-4">{request.location}</p>
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Icon name="Calendar" size={16} />
                <span>Создана: {createdAt.toLocaleDateString('ru-RU', {
                  day: 'numeric',
                  month: 'long',
                  year: 'numeric'
                })}</span>
              </div>
            </div>
          </div>

          <div className="grid md:grid-cols-2 gap-6 mb-8">
            <div className="space-y-4">
              <div className="bg-gray-50 rounded-lg p-4">
                <div className="flex items-center gap-2 mb-2">
                  <Icon name="DollarSign" size={20} className="text-primary" />
                  <h3 className="font-semibold text-foreground">Бюджет</h3>
                </div>
                <p className="text-2xl font-bold text-foreground">{request.budget}</p>
              </div>

              <div className="bg-gray-50 rounded-lg p-4">
                <div className="flex items-center gap-2 mb-2">
                  <Icon name="Gift" size={20} className="text-primary" />
                  <h3 className="font-semibold text-foreground">Вознаграждение</h3>
                </div>
                <p className="text-2xl font-bold text-primary">{request.reward}</p>
              </div>
            </div>

            <div className="space-y-4">
              <div className="bg-gray-50 rounded-lg p-4">
                <div className="flex items-center gap-2 mb-2">
                  <Icon name="Home" size={20} className="text-primary" />
                  <h3 className="font-semibold text-foreground">Тип жилья</h3>
                </div>
                <p className="text-lg text-foreground">{request.housingType}</p>
                <p className="text-sm text-muted-foreground mt-1">{request.roomsCount}</p>
              </div>

              <div className="bg-gray-50 rounded-lg p-4">
                <div className="flex items-center gap-2 mb-2">
                  <Icon name="Calendar" size={20} className="text-primary" />
                  <h3 className="font-semibold text-foreground">Срок аренды</h3>
                </div>
                <p className="text-lg text-foreground">{request.rentalPeriod}</p>
              </div>
            </div>
          </div>

          {request.aboutYourself && (
            <div className="mb-8">
              <div className="flex items-center gap-2 mb-3">
                <Icon name="User" size={20} className="text-primary" />
                <h3 className="text-xl font-semibold text-foreground">О себе</h3>
              </div>
              <div className="bg-gray-50 rounded-lg p-4">
                <p className="text-foreground leading-relaxed whitespace-pre-wrap">{request.aboutYourself}</p>
              </div>
            </div>
          )}

          {request.preferences && (
            <div className="mb-8">
              <div className="flex items-center gap-2 mb-3">
                <Icon name="Settings" size={20} className="text-primary" />
                <h3 className="text-xl font-semibold text-foreground">Предпочтения</h3>
              </div>
              <div className="bg-gray-50 rounded-lg p-4">
                <p className="text-foreground leading-relaxed whitespace-pre-wrap">{request.preferences}</p>
              </div>
            </div>
          )}

          <div className="flex gap-3 pt-6 border-t border-border">
            <Button
              className="flex-1"
              onClick={() => navigate("/suggest-property", {
                state: {
                  requestId: request.id,
                  requestName: request.name,
                  fromDashboard: fromDashboard || !!authStore.getUser()
                }
              })}
            >
              <Icon name="Home" size={16} className="mr-2" />
              Предложить объект
            </Button>
            <Button
              variant="outline"
              onClick={goBack}
            >
              <Icon name="ArrowLeft" size={16} className="mr-2" />
              Назад
            </Button>
          </div>
        </motion.div>
      </main>

      <Footer />
    </div>
  );
};