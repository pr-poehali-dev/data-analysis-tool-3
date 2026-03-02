import { motion } from "framer-motion";
import Icon from "@/components/ui/icon";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { Recommendation } from "@/store/recommendationsStore";
import { recommendationsStore } from "@/store/recommendationsStore";
import { messagesStore } from "@/store/messagesStore";
import { Request } from "@/store/requestsStore";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { UserProfile } from "./UserProfileDialog";
import RecommendationPhotos from "./RecommendationPhotos";

interface RecommendationCardProps {
  recommendation: Recommendation;
  profile?: UserProfile;
  request: Request;
  currentUser?: {
    email: string;
    firstName: string;
    lastName: string;
    photo?: string;
  };
  onOpenProfile: (profile: UserProfile) => void;
}

export default function RecommendationCard({ recommendation, profile, request, currentUser, onOpenProfile }: RecommendationCardProps) {
  const navigate = useNavigate();

  const nameParts = (recommendation.userName || '').split(' ');
  const fallbackProfile: UserProfile = {
    firstName: nameParts[0] || recommendation.userId.split('@')[0],
    lastName: nameParts.slice(1).join(' ') || '',
    avatar_url: '',
    city: '',
    vkLink: '',
    role: 'recommender',
    email: recommendation.userId,
  };

  return (
    <motion.div
      key={recommendation.id}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-white border border-border rounded-xl p-4 sm:p-6"
    >
      <div 
        className="flex items-center gap-3 mb-4 pb-4 border-b border-border cursor-pointer hover:bg-gray-50 rounded-lg p-2 -m-2 transition-colors"
        onClick={() => onOpenProfile(profile || fallbackProfile)}
      >
        <img
          src={profile?.avatar_url || `https://api.dicebear.com/7.x/avataaars/svg?seed=${recommendation.userId}`}
          alt={profile ? `${profile.firstName} ${profile.lastName}` : fallbackProfile.firstName}
          className="w-10 h-10 rounded-full flex-shrink-0"
        />
        <div className="min-w-0 flex-1">
          <p className="text-sm font-semibold text-foreground truncate">
            {profile ? `${profile.firstName} ${profile.lastName}` : `${fallbackProfile.firstName} ${fallbackProfile.lastName}`.trim()}
          </p>
          <p className="text-xs text-muted-foreground truncate">
            {profile?.city || 'Рекомендатель'}
          </p>
        </div>
        <Icon name="ChevronRight" size={16} className="text-muted-foreground flex-shrink-0" />
      </div>
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

          </div>
          {recommendation.propertyData.comments && (
            <div className="mb-4">
              <p className="text-sm text-muted-foreground">Комментарий:</p>
              <p className="text-sm text-foreground mt-1">{recommendation.propertyData.comments}</p>
            </div>
          )}
          <RecommendationPhotos recommendation={recommendation} />
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 flex-wrap">
            <div className="flex items-center gap-2">
              <span className="text-sm text-muted-foreground">Статус:</span>
              <Select
                value={recommendation.status}
                onValueChange={async (value) => {
                  const newStatus = value as 'pending' | 'accepted' | 'rejected';
                  await recommendationsStore.updateRecommendationStatus(
                    recommendation.id, 
                    newStatus
                  );
                  
                  if (newStatus === 'accepted' && currentUser) {
                    await messagesStore.fetchChatByRecommendation(recommendation.id);
                    let chat = messagesStore.getChatByRecommendation(recommendation.id);
                    
                    if (!chat) {
                      chat = await messagesStore.createChat({
                        recommendationId: recommendation.id,
                        requestId: request?.id || '',
                        requestName: request?.name || '',
                        recommenderEmail: recommendation.userId,
                        recommenderName: recommendation.userName || recommendation.userId.split('@')[0],
                        tenantEmail: currentUser.email,
                        tenantName: `${currentUser.firstName} ${currentUser.lastName}`,
                        tenantPhoto: currentUser.photo,
                      });
                    }
                    
                    await messagesStore.sendSystemMessage(
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
                onClick={async () => {
                  await messagesStore.fetchChatByRecommendation(recommendation.id);
                  const chat = messagesStore.getChatByRecommendation(recommendation.id);
                  if (chat) {
                    navigate("/", { state: { activeSection: "messages" } });
                  } else {
                    await messagesStore.createChat({
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
  );
}