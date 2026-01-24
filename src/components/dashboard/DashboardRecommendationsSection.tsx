import { motion } from "framer-motion";
import Icon from "@/components/ui/icon";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { Recommendation, recommendationsStore } from "@/store/recommendationsStore";
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
      <h2 className="text-3xl font-bold text-foreground mb-6">Мои рекомендации</h2>
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
        <div className="space-y-4">
          {userRecommendations.map((recommendation) => (
            <motion.div
              key={recommendation.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-white border border-border rounded-xl p-6"
            >
              <div className="flex items-start gap-4">
                <div className="w-16 h-16 bg-primary/10 rounded-lg flex items-center justify-center flex-shrink-0">
                  <Icon name="Home" size={32} className="text-primary" />
                </div>
                <div className="flex-1">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-3">
                      <h3 className="text-xl font-semibold text-foreground">
                        {recommendation.requestName || 'Рекомендация объекта'}
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
                    <span className="text-sm text-muted-foreground">
                      {new Date(recommendation.createdAt).toLocaleDateString('ru-RU')}
                    </span>
                  </div>
                  <div className="grid md:grid-cols-2 gap-4 text-sm mb-4">
                    <div>
                      <span className="text-muted-foreground">Адрес:</span>
                      <span className="ml-2 text-foreground">{recommendation.propertyData.address}</span>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Аренда:</span>
                      <span className="ml-2 text-foreground">{parseInt(recommendation.propertyData.rent).toLocaleString('ru-RU')} ₽/мес</span>
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
                    <div>
                      <span className="text-muted-foreground">Владелец:</span>
                      <span className="ml-2 text-foreground">{recommendation.ownerEmail}</span>
                    </div>
                  </div>
                  <div className="mb-4">
                    <div className="flex items-center gap-2">
                      <span className="text-sm text-muted-foreground">Статус:</span>
                      <Select
                        value={recommendation.status}
                        onValueChange={(value) => recommendationsStore.updateRecommendationStatus(recommendation.id, value as 'pending' | 'accepted' | 'rejected')}
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
                  </div>
                  {recommendation.propertyData.comments && (
                    <div className="mb-4">
                      <p className="text-sm text-muted-foreground">Комментарий:</p>
                      <p className="text-sm text-foreground mt-1">{recommendation.propertyData.comments}</p>
                    </div>
                  )}
                  {recommendation.photos.length > 0 && (
                    <div className="mb-4">
                      <p className="text-sm text-muted-foreground mb-2">Фотографии ({recommendation.photos.length}):</p>
                      <div className="grid grid-cols-4 gap-2">
                        {recommendation.photos.slice(0, 4).map((photo, index) => (
                          <img
                            key={index}
                            src={photo}
                            alt={`Фото ${index + 1}`}
                            className="w-full h-20 object-cover rounded-lg"
                          />
                        ))}
                      </div>
                    </div>
                  )}
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => navigate(`/edit-recommendation/${recommendation.id}`)}
                    >
                      <Icon name="Edit" size={16} className="mr-2" />
                      Редактировать
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        if (window.confirm('Вы уверены, что хотите удалить эту рекомендацию?')) {
                          recommendationsStore.deleteRecommendation(recommendation.id);
                        }
                      }}
                      className="text-red-600 hover:text-red-700 hover:border-red-600"
                    >
                      <Icon name="Trash2" size={16} className="mr-2" />
                      Удалить
                    </Button>
                  </div>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
};
