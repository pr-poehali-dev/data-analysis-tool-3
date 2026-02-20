import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import Icon from "@/components/ui/icon";
import { Button } from "@/components/ui/button";
import { PortfolioNavbar, Footer } from "@/components/landing";
import { useNavigate, useParams } from "react-router-dom";
import { requestsStore } from "@/store/requestsStore";
import { recommendationsStore, Recommendation } from "@/store/recommendationsStore";
import { messagesStore } from "@/store/messagesStore";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface RequestOffersProps {
  currentUser?: {
    email: string;
    firstName: string;
    lastName: string;
    photo?: string;
  };
}

export const RequestOffers = ({ currentUser }: RequestOffersProps) => {
  const navigate = useNavigate();
  const { requestId } = useParams<{ requestId: string }>();
  const [recommendations, setRecommendations] = useState<Recommendation[]>([]);
  const [request, setRequest] = useState(requestsStore.getRequestById(requestId || ''));

  useEffect(() => {
    if (!requestId) {
      navigate("/dashboard");
      return;
    }

    const fetchedRequest = requestsStore.getRequestById(requestId);
    if (!fetchedRequest) {
      navigate("/dashboard");
      return;
    }

    setRequest(fetchedRequest);

    const updateRecommendations = () => {
      const offers = recommendationsStore.getRecommendationsByRequestId(requestId);
      setRecommendations(offers);
    };

    updateRecommendations();
    const unsubscribe = recommendationsStore.subscribe(updateRecommendations);
    return unsubscribe;
  }, [requestId, navigate]);

  if (!request) return null;

  return (
    <div className="min-h-screen bg-background">
      <PortfolioNavbar onLogout={() => navigate("/")} showNavigation={false} />

      <main className="max-w-6xl mx-auto px-4 sm:px-6 py-6 sm:py-8 mt-20 mb-20">
        <div className="mb-8">
          <Button
            variant="outline"
            onClick={() => navigate("/", { state: { activeSection: "requests" } })}
            className="mb-4"
          >
            <Icon name="ArrowLeft" size={16} className="mr-2" />
            Назад к заявкам
          </Button>
          <h1 className="text-2xl sm:text-4xl font-bold text-foreground mb-2">
            Предложения по заявке
          </h1>
          <div className="bg-white border border-border rounded-xl p-4 sm:p-6 mt-4">
            <div className="flex items-start gap-4">
              <img
                src={request.avatar}
                alt={request.name}
                className="w-12 h-12 sm:w-16 sm:h-16 rounded-full"
              />
              <div className="flex-1">
                <h3 className="text-base sm:text-xl font-semibold text-foreground mb-2">{request.name}</h3>
                <div className="grid md:grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="text-muted-foreground">Локация:</span>
                    <span className="ml-2 text-foreground">{request.location}</span>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Бюджет:</span>
                    <span className="ml-2 text-foreground">{request.budget}</span>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Тип жилья:</span>
                    <span className="ml-2 text-foreground">{request.housingType}, {request.roomsCount}</span>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Вознаграждение:</span>
                    <span className="ml-2 text-primary font-semibold">{request.reward}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div>
          <h2 className="text-xl sm:text-2xl font-bold text-foreground mb-6">
            Полученные предложения ({recommendations.length})
          </h2>
          {recommendations.length === 0 ? (
            <div className="bg-white border border-border rounded-xl p-8 text-center">
              <Icon name="Inbox" size={48} className="mx-auto mb-4 text-muted-foreground" />
              <p className="text-lg text-muted-foreground">По этой заявке пока нет предложений</p>
            </div>
          ) : (
            <div className="space-y-4">
              {recommendations.map((recommendation) => (
                <motion.div
                  key={recommendation.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="bg-white border border-border rounded-xl p-4 sm:p-6"
                >
                  <div className="flex flex-col sm:flex-row items-start gap-3 sm:gap-4">
                    <div className="w-12 h-12 sm:w-16 sm:h-16 bg-primary/10 rounded-lg flex items-center justify-center flex-shrink-0">
                      <Icon name="Home" size={24} className="text-primary" />
                    </div>
                    <div className="flex-1 w-full">
                      <div className="flex items-center justify-between mb-3">
                        <h3 className="text-base sm:text-xl font-semibold text-foreground">
                          {recommendation.propertyData.address}
                        </h3>
                        <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                          recommendation.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                          recommendation.status === 'accepted' ? 'bg-green-100 text-green-800' :
                          'bg-red-100 text-red-800'
                        }`}>
                          {recommendation.status === 'pending' ? 'Ожидает' :
                           recommendation.status === 'accepted' ? 'Принято' : 'Отклонено'}
                        </span>
                      </div>
                      <div className="grid md:grid-cols-2 gap-4 text-sm mb-4">
                        <div>
                          <span className="text-muted-foreground">Аренда:</span>
                          <span className="ml-2 text-foreground font-semibold">
                            {parseInt(recommendation.propertyData.rent).toLocaleString('ru-RU')} ₽/мес
                          </span>
                        </div>
                        {recommendation.propertyData.rooms && (
                          <div>
                            <span className="text-muted-foreground">Комнат:</span>
                            <span className="ml-2 text-foreground">{recommendation.propertyData.rooms}</span>
                          </div>
                        )}
                        {recommendation.propertyData.area && (
                          <div>
                            <span className="text-muted-foreground">Площадь:</span>
                            <span className="ml-2 text-foreground">{recommendation.propertyData.area} м²</span>
                          </div>
                        )}
                        {recommendation.propertyData.floor && (
                          <div>
                            <span className="text-muted-foreground">Этаж:</span>
                            <span className="ml-2 text-foreground">
                              {recommendation.propertyData.floor}/{recommendation.propertyData.totalFloors}
                            </span>
                          </div>
                        )}
                        <div>
                          <span className="text-muted-foreground">Мебель:</span>
                          <span className="ml-2 text-foreground">
                            {recommendation.propertyData.hasFurniture ? 'Да' : 'Нет'}
                          </span>
                        </div>
                        <div>
                          <span className="text-muted-foreground">Техника:</span>
                          <span className="ml-2 text-foreground">
                            {recommendation.propertyData.hasAppliances ? 'Да' : 'Нет'}
                          </span>
                        </div>
                        <div className="md:col-span-2">
                          <span className="text-muted-foreground">Владелец:</span>
                          <span className="ml-2 text-foreground">{recommendation.ownerEmail}</span>
                        </div>
                      </div>
                      {recommendation.inviteMessage && (
                        <div className="mb-4 bg-gray-50 p-3 rounded-lg">
                          <p className="text-sm text-muted-foreground mb-1">Сообщение владельцу:</p>
                          <p className="text-sm text-foreground">{recommendation.inviteMessage}</p>
                        </div>
                      )}
                      {recommendation.propertyData.comments && (
                        <div className="mb-4">
                          <p className="text-sm text-muted-foreground">Комментарий:</p>
                          <p className="text-sm text-foreground mt-1">{recommendation.propertyData.comments}</p>
                        </div>
                      )}
                      {recommendation.photos.length > 0 && (
                        <div className="mb-4">
                          <p className="text-sm text-muted-foreground mb-2">
                            Фотографии ({recommendation.photos.length}):
                          </p>
                          <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
                            {recommendation.photos.slice(0, 8).map((photo, index) => (
                              <img
                                key={index}
                                src={photo}
                                alt={`Фото ${index + 1}`}
                                className="w-full h-24 object-cover rounded-lg"
                              />
                            ))}
                          </div>
                        </div>
                      )}
                      <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 flex-wrap">
                        <div className="flex items-center gap-2">
                          <span className="text-sm text-muted-foreground">Статус:</span>
                          <Select
                            value={recommendation.status}
                            onValueChange={(value) => {
                              const newStatus = value as 'pending' | 'accepted' | 'rejected';
                              recommendationsStore.updateRecommendationStatus(
                                recommendation.id, 
                                newStatus
                              );
                              
                              if (newStatus === 'accepted' && currentUser) {
                                let chat = messagesStore.getChatByRecommendation(recommendation.id);
                                
                                if (!chat) {
                                  chat = messagesStore.createChat({
                                    recommendationId: recommendation.id,
                                    requestId: request?.id || '',
                                    requestName: request?.name || '',
                                    recommenderEmail: recommendation.userId,
                                    recommenderName: recommendation.userId.split('@')[0],
                                    tenantEmail: currentUser.email,
                                    tenantName: `${currentUser.firstName} ${currentUser.lastName}`,
                                    tenantPhoto: currentUser.photo,
                                  });
                                }
                                
                                messagesStore.sendSystemMessage(
                                  chat.id,
                                  '✅ Предложение принято! Самое время обсудить детали и задать все интересующие вопросы друг другу.'
                                );
                                
                                navigate("/dashboard", { state: { activeSection: "messages", chatId: chat.id } });
                              }
                            }}
                          >
                            <SelectTrigger className="w-[150px] h-8 text-sm">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="pending">Ожидает</SelectItem>
                              <SelectItem value="accepted">Принято</SelectItem>
                              <SelectItem value="rejected">Отклонено</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        {currentUser && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => {
                              const chat = messagesStore.getChatByRecommendation(recommendation.id);
                              if (chat) {
                                navigate("/", { state: { activeSection: "messages" } });
                              } else {
                                messagesStore.createChat({
                                  recommendationId: recommendation.id,
                                  requestId: request?.id || '',
                                  requestName: request?.name || '',
                                  recommenderEmail: recommendation.userId,
                                  recommenderName: recommendation.userId.split('@')[0],
                                  tenantEmail: currentUser.email,
                                  tenantName: `${currentUser.firstName} ${currentUser.lastName}`,
                                  tenantPhoto: currentUser.photo,
                                });
                                navigate("/", { state: { activeSection: "messages" } });
                              }
                            }}
                            className="flex items-center gap-2"
                          >
                            <Icon name="MessageSquare" size={16} />
                            Написать сообщение
                          </Button>
                        )}
                        <span className="text-xs text-muted-foreground ml-auto">
                          {new Date(recommendation.createdAt).toLocaleDateString('ru-RU', {
                            day: 'numeric',
                            month: 'long',
                            year: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit'
                          })}
                        </span>
                      </div>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          )}
        </div>
      </main>

      <Footer hiddenOnMobile />
    </div>
  );
};