import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
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
import { Dialog, DialogContent } from "@/components/ui/dialog";
import funcUrls from "../../backend/func2url.json";

function PhotoLightbox({ photos, initialIndex, onClose }: { photos: string[]; initialIndex: number; onClose: () => void }) {
  const [currentIndex, setCurrentIndex] = useState(initialIndex);
  const [touchStart, setTouchStart] = useState<number | null>(null);

  const goNext = useCallback(() => {
    setCurrentIndex((prev) => (prev + 1) % photos.length);
  }, [photos.length]);

  const goPrev = useCallback(() => {
    setCurrentIndex((prev) => (prev - 1 + photos.length) % photos.length);
  }, [photos.length]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
      if (e.key === 'ArrowRight') goNext();
      if (e.key === 'ArrowLeft') goPrev();
    };
    document.body.style.overflow = 'hidden';
    window.addEventListener('keydown', handleKeyDown);
    return () => {
      document.body.style.overflow = '';
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [onClose, goNext, goPrev]);

  const handleTouchStart = (e: React.TouchEvent) => {
    setTouchStart(e.touches[0].clientX);
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    if (touchStart === null) return;
    const diff = touchStart - e.changedTouches[0].clientX;
    if (Math.abs(diff) > 50) {
      if (diff > 0) goNext();
      else goPrev();
    }
    setTouchStart(null);
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[100] bg-black/90 flex items-center justify-center"
      onClick={onClose}
    >
      <button
        onClick={onClose}
        className="absolute top-4 right-4 z-10 w-10 h-10 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center transition-colors"
      >
        <Icon name="X" size={24} className="text-white" />
      </button>

      <div className="absolute top-4 left-1/2 -translate-x-1/2 text-white/70 text-sm font-medium">
        {currentIndex + 1} / {photos.length}
      </div>

      {photos.length > 1 && (
        <>
          <button
            onClick={(e) => { e.stopPropagation(); goPrev(); }}
            className="absolute left-2 sm:left-4 z-10 w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center transition-colors"
          >
            <Icon name="ChevronLeft" size={28} className="text-white" />
          </button>
          <button
            onClick={(e) => { e.stopPropagation(); goNext(); }}
            className="absolute right-2 sm:right-4 z-10 w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center transition-colors"
          >
            <Icon name="ChevronRight" size={28} className="text-white" />
          </button>
        </>
      )}

      <div
        className="w-full h-full flex items-center justify-center p-4 sm:p-16"
        onClick={(e) => e.stopPropagation()}
        onTouchStart={handleTouchStart}
        onTouchEnd={handleTouchEnd}
      >
        <AnimatePresence mode="wait">
          <motion.img
            key={currentIndex}
            src={photos[currentIndex]}
            alt={`Фото ${currentIndex + 1}`}
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            transition={{ duration: 0.2 }}
            className="max-w-full max-h-full object-contain rounded-lg select-none"
            draggable={false}
          />
        </AnimatePresence>
      </div>

      {photos.length > 1 && (
        <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-1.5">
          {photos.map((_, idx) => (
            <button
              key={idx}
              onClick={(e) => { e.stopPropagation(); setCurrentIndex(idx); }}
              className={`w-2 h-2 rounded-full transition-all ${idx === currentIndex ? 'bg-white w-6' : 'bg-white/40 hover:bg-white/60'}`}
            />
          ))}
        </div>
      )}
    </motion.div>
  );
}

function RecommendationPhotos({ recommendation }: { recommendation: Recommendation }) {
  const [photos, setPhotos] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [loaded, setLoaded] = useState(false);
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);

  const photoCount = recommendation.photos.length > 0 ? recommendation.photos.length : ((recommendation as Record<string, unknown>).photoCount as number) || 0;

  if (photoCount === 0 && recommendation.photos.length === 0) return null;

  const displayPhotos = recommendation.photos.length > 0 && recommendation.photos[0]?.startsWith('data:')
    ? recommendation.photos
    : photos;

  if (recommendation.photos.length > 0 && recommendation.photos[0]?.startsWith('data:')) {
    return (
      <div className="mb-4">
        <p className="text-sm text-muted-foreground mb-2">Фотографии ({recommendation.photos.length}):</p>
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2">
          {recommendation.photos.map((photo, index) => (
            <img
              key={index}
              src={photo}
              alt={`Фото ${index + 1}`}
              className="w-full h-32 sm:h-40 object-cover rounded-lg cursor-pointer hover:opacity-90 transition-opacity"
              onClick={() => setLightboxIndex(index)}
            />
          ))}
        </div>
        <AnimatePresence>
          {lightboxIndex !== null && (
            <PhotoLightbox
              photos={recommendation.photos}
              initialIndex={lightboxIndex}
              onClose={() => setLightboxIndex(null)}
            />
          )}
        </AnimatePresence>
      </div>
    );
  }

  const loadPhotos = async () => {
    if (loaded || loading) return;
    setLoading(true);
    const full = await recommendationsStore.fetchRecommendationById(recommendation.id);
    if (full && full.photos.length > 0) {
      setPhotos(full.photos);
    }
    setLoaded(true);
    setLoading(false);
  };

  return (
    <div className="mb-4">
      {!loaded ? (
        <Button variant="outline" size="sm" onClick={loadPhotos} disabled={loading}>
          <Icon name={loading ? "Loader2" : "Image"} size={16} className={`mr-2 ${loading ? 'animate-spin' : ''}`} />
          {loading ? 'Загрузка...' : `Показать фотографии (${photoCount})`}
        </Button>
      ) : displayPhotos.length > 0 ? (
        <>
          <p className="text-sm text-muted-foreground mb-2">Фотографии ({displayPhotos.length}):</p>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2">
            {displayPhotos.map((photo, index) => (
              <img
                key={index}
                src={photo}
                alt={`Фото ${index + 1}`}
                className="w-full h-32 sm:h-40 object-cover rounded-lg cursor-pointer hover:opacity-90 transition-opacity"
                onClick={() => setLightboxIndex(index)}
              />
            ))}
          </div>
          <AnimatePresence>
            {lightboxIndex !== null && (
              <PhotoLightbox
                photos={displayPhotos}
                initialIndex={lightboxIndex}
                onClose={() => setLightboxIndex(null)}
              />
            )}
          </AnimatePresence>
        </>
      ) : (
        <p className="text-sm text-muted-foreground">Фотографии не загружены</p>
      )}
    </div>
  );
}

interface UserProfile {
  firstName: string;
  lastName: string;
  avatar_url: string;
  city: string;
  vkLink: string;
  role: string;
  email: string;
}

interface Review {
  id: string;
  reviewer_name: string;
  rating: number;
  comment: string;
  created_at: string;
}

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
  const [profiles, setProfiles] = useState<Record<string, UserProfile>>({});
  const [selectedProfile, setSelectedProfile] = useState<UserProfile | null>(null);
  const [profileReviews, setProfileReviews] = useState<{ reviews: Review[]; avg_rating: number | null; total: number }>({ reviews: [], avg_rating: null, total: 0 });
  const [profileDialogOpen, setProfileDialogOpen] = useState(false);

  useEffect(() => {
    if (!requestId) {
      navigate("/dashboard");
      return;
    }

    const cached = requestsStore.getRequestById(requestId);
    if (cached) {
      setRequest(cached);
    }

    requestsStore.fetchRequestById(requestId).then((fetched) => {
      if (fetched) {
        setRequest(fetched);
      } else if (!cached) {
        navigate("/dashboard");
      }
    });

    const updateRecommendations = () => {
      const offers = recommendationsStore.getRecommendationsByRequestId(requestId);
      setRecommendations(offers);
    };

    updateRecommendations();
    recommendationsStore.fetchRecommendationsByRequestId(requestId);
    const unsubscribe = recommendationsStore.subscribe(updateRecommendations);
    return unsubscribe;
  }, [requestId, navigate]);

  useEffect(() => {
    const emails = [...new Set(recommendations.map(r => r.userId))];
    const PROFILE_API = funcUrls["profile-update"];
    emails.forEach(async (email) => {
      if (profiles[email]) return;
      try {
        const res = await fetch(`${PROFILE_API}?email=${encodeURIComponent(email)}`);
        const data = await res.json();
        if (data.user) {
          setProfiles(prev => ({ ...prev, [email]: data.user }));
        }
      } catch (e) {
        console.error(e);
      }
    });
  }, [recommendations]);

  const openProfile = async (profile: UserProfile) => {
    setSelectedProfile(profile);
    setProfileDialogOpen(true);
    const REVIEWS_API = funcUrls["reviews"];
    try {
      const res = await fetch(`${REVIEWS_API}?reviewee_email=${encodeURIComponent(profile.email)}`);
      const data = await res.json();
      setProfileReviews({ reviews: data.reviews || [], avg_rating: data.avg_rating, total: data.total || 0 });
    } catch (e) {
      setProfileReviews({ reviews: [], avg_rating: null, total: 0 });
    }
  };

  if (!request) return null;

  return (
    <div className="min-h-screen bg-background">
      <PortfolioNavbar onLogout={() => navigate("/")} showNavigation={false} />

      <main className="max-w-6xl mx-auto px-4 sm:px-6 py-6 sm:py-8 mt-20 mb-20">
        <div className="mb-8">
          <button
            onClick={() => navigate("/dashboard", { state: { activeSection: "requests" } })}
            className="inline-flex items-center gap-1.5 text-sm font-medium text-foreground border border-border rounded-lg px-3 py-2 hover:bg-gray-100 transition-colors mb-4"
          >
            <Icon name="ArrowLeft" size={16} />
            Назад к заявкам
          </button>
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
                  {(() => {
                    const profile = profiles[recommendation.userId];
                    return (
                      <div 
                        className="flex items-center gap-3 mb-4 pb-4 border-b border-border cursor-pointer hover:bg-gray-50 rounded-lg p-2 -m-2 transition-colors"
                        onClick={() => profile && openProfile(profile)}
                      >
                        <img
                          src={profile?.avatar_url || `https://api.dicebear.com/7.x/avataaars/svg?seed=${recommendation.userId}`}
                          alt={profile ? `${profile.firstName} ${profile.lastName}` : recommendation.userId}
                          className="w-10 h-10 rounded-full flex-shrink-0"
                        />
                        <div className="min-w-0 flex-1">
                          <p className="text-sm font-semibold text-foreground truncate">
                            {profile ? `${profile.firstName} ${profile.lastName}` : recommendation.userId.split('@')[0]}
                          </p>
                          <p className="text-xs text-muted-foreground truncate">
                            {profile?.city || 'Рекомендатель'}
                          </p>
                        </div>
                        <Icon name="ChevronRight" size={16} className="text-muted-foreground flex-shrink-0" />
                      </div>
                    );
                  })()}
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
                                    recommenderName: recommendation.userId.split('@')[0],
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
              ))}
            </div>
          )}
        </div>
      </main>

      <Dialog open={profileDialogOpen} onOpenChange={setProfileDialogOpen}>
        <DialogContent className="sm:max-w-md">
          {selectedProfile && (
            <div className="space-y-6">
              <div className="flex items-center gap-4">
                <img
                  src={selectedProfile.avatar_url || `https://api.dicebear.com/7.x/avataaars/svg?seed=${selectedProfile.email}`}
                  alt={`${selectedProfile.firstName} ${selectedProfile.lastName}`}
                  className="w-16 h-16 rounded-full"
                />
                <div>
                  <h3 className="text-lg font-bold text-foreground">
                    {selectedProfile.firstName} {selectedProfile.lastName}
                  </h3>
                  {selectedProfile.city && (
                    <p className="text-sm text-muted-foreground flex items-center gap-1">
                      <Icon name="MapPin" size={14} />
                      {selectedProfile.city}
                    </p>
                  )}
                </div>
              </div>

              {selectedProfile.vkLink && (
                <div>
                  <p className="text-sm font-medium text-foreground mb-2">Социальные сети</p>
                  <a
                    href={selectedProfile.vkLink.startsWith('http') ? selectedProfile.vkLink : `https://vk.com/${selectedProfile.vkLink}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 text-sm text-blue-600 hover:text-blue-800 transition-colors"
                  >
                    <Icon name="ExternalLink" size={14} />
                    ВКонтакте
                  </a>
                </div>
              )}

              <div>
                <p className="text-sm font-medium text-foreground mb-3">Рейтинг и отзывы</p>
                {profileReviews.total > 0 ? (
                  <>
                    <div className="flex items-center gap-3 mb-4">
                      <div className="flex items-center gap-1">
                        {[1, 2, 3, 4, 5].map(star => (
                          <Icon
                            key={star}
                            name="Star"
                            size={18}
                            className={star <= Math.round(profileReviews.avg_rating || 0) ? 'text-yellow-400 fill-yellow-400' : 'text-gray-300'}
                          />
                        ))}
                      </div>
                      <span className="text-sm font-semibold">{profileReviews.avg_rating?.toFixed(1)}</span>
                      <span className="text-sm text-muted-foreground">({profileReviews.total} отзывов)</span>
                    </div>
                    <div className="space-y-3 max-h-60 overflow-y-auto">
                      {profileReviews.reviews.map(review => (
                        <div key={review.id} className="border border-border rounded-lg p-3">
                          <div className="flex items-center justify-between mb-1">
                            <span className="text-sm font-medium">{review.reviewer_name}</span>
                            <div className="flex items-center gap-0.5">
                              {[1, 2, 3, 4, 5].map(star => (
                                <Icon
                                  key={star}
                                  name="Star"
                                  size={12}
                                  className={star <= review.rating ? 'text-yellow-400 fill-yellow-400' : 'text-gray-300'}
                                />
                              ))}
                            </div>
                          </div>
                          {review.comment && <p className="text-sm text-muted-foreground">{review.comment}</p>}
                          <p className="text-xs text-muted-foreground mt-1">
                            {new Date(review.created_at).toLocaleDateString('ru-RU')}
                          </p>
                        </div>
                      ))}
                    </div>
                  </>
                ) : (
                  <p className="text-sm text-muted-foreground">Пока нет отзывов</p>
                )}
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      <Footer hiddenOnMobile />
    </div>
  );
};