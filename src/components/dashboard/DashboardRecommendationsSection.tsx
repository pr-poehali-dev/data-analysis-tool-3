import { motion } from "framer-motion";
import Icon from "@/components/ui/icon";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { Recommendation, recommendationsStore } from "@/store/recommendationsStore";
import { messagesStore } from "@/store/messagesStore";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface DashboardRecommendationsSectionProps {
  userRecommendations: Recommendation[];
}

export const DashboardRecommendationsSection = ({ userRecommendations }: DashboardRecommendationsSectionProps) => {
  const navigate = useNavigate();

  return (
    <div>
      <h2 className="text-2xl sm:text-3xl font-bold text-foreground mb-4 sm:mb-6">Мои рекомендации</h2>
      {userRecommendations.length === 0 ? (
        <div className="bg-white border border-border rounded-xl p-8 text-center">
          <Icon name="ThumbsUp" size={48} className="mx-auto mb-4 text-muted-foreground" />
          <p className="text-lg text-muted-foreground">У вас пока нет рекомендаций</p>
          <Button 
            className="mt-6" 
            onClick={() => navigate("/feed")}
          >
            <Icon name="Plus" size={16} className="mr-2" />
            Перейти к ленте заявок
          </Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {userRecommendations.map((recommendation) => (
            <motion.div
              key={recommendation.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-white border border-border rounded-lg p-4 flex flex-col h-full"
            >
              <div className="flex-1">
                <div className="flex items-start gap-3 mb-3">
                  <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center flex-shrink-0">
                    <Icon name="Home" size={20} className="text-primary" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="text-base font-semibold text-foreground truncate">
                        {recommendation.requestName || 'Рекомендация объекта'}
                      </h3>
                      <span className={`px-2 py-0.5 rounded-full text-xs font-medium flex-shrink-0 ${
                        recommendation.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                        recommendation.status === 'accepted' ? 'bg-green-100 text-green-800' :
                        'bg-red-100 text-red-800'
                      }`}>
                        {recommendation.status === 'pending' ? 'Ожидает' :
                         recommendation.status === 'accepted' ? 'Принято' : 'Отклонено'}
                      </span>
                    </div>
                    <span className="text-xs text-muted-foreground">
                      {new Date(recommendation.createdAt).toLocaleDateString('ru-RU')}
                    </span>
                  </div>
                </div>

                <div className="space-y-2 text-sm mb-3">
                  <div className="flex items-center gap-2">
                    <Icon name="MapPin" size={14} className="text-muted-foreground flex-shrink-0" />
                    <span className="text-foreground truncate">{recommendation.propertyData.address}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Icon name="DollarSign" size={14} className="text-muted-foreground flex-shrink-0" />
                    <span className="text-foreground font-semibold">{parseInt(recommendation.propertyData.rent).toLocaleString('ru-RU')} ₽/мес</span>
                  </div>
                  <div className="flex gap-4 text-xs">
                    {recommendation.propertyData.rooms && (
                      <span className="text-muted-foreground">
                        {recommendation.propertyData.rooms} комн.
                      </span>
                    )}
                    {recommendation.propertyData.area && (
                      <span className="text-muted-foreground">
                        {recommendation.propertyData.area} м²
                      </span>
                    )}
                  </div>
                </div>

                {recommendation.photos.length > 0 && (
                  <div className="mb-3">
                    <div className="grid grid-cols-4 gap-1">
                      {recommendation.photos.slice(0, 4).map((photo, index) => (
                        <img
                          key={index}
                          src={photo}
                          alt={`Фото ${index + 1}`}
                          className="w-full h-14 object-cover rounded"
                        />
                      ))}
                    </div>
                  </div>
                )}
              </div>

              <div className="flex gap-2 pt-3 mt-auto border-t border-border">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    const chat = messagesStore.getChatByRecommendation(recommendation.id);
                    if (chat) {
                      navigate('/dashboard', { state: { activeSection: 'messages', chatId: chat.id } });
                    }
                  }}
                  className="h-8 text-xs flex-1"
                  disabled={!messagesStore.getChatByRecommendation(recommendation.id)}
                >
                  <Icon name="MessageSquare" size={14} className="mr-1" />
                  Написать
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => navigate(`/edit-recommendation/${recommendation.id}`)}
                  className="h-8 text-xs flex-1"
                >
                  <Icon name="Edit" size={14} className="mr-1" />
                  Изменить
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={async () => {
                    if (window.confirm('Удалить рекомендацию?')) {
                      await recommendationsStore.deleteRecommendation(recommendation.id);
                    }
                  }}
                  className="h-8 text-xs text-red-600 hover:text-red-700 hover:border-red-600"
                >
                  <Icon name="Trash2" size={14} />
                </Button>
              </div>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
};