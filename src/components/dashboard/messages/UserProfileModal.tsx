import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Icon from "@/components/ui/icon";
import { Button } from "@/components/ui/button";
import { authStore } from "@/store/authStore";
import funcUrls from "../../../../backend/func2url.json";

interface UserProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
  user: {
    name: string;
    email: string;
    photo?: string;
    vkLink?: string;
  };
}

export const UserProfileModal = ({ isOpen, onClose, user }: UserProfileModalProps) => {
  const [reviews, setReviews] = useState<any[]>([]);
  const [avgRating, setAvgRating] = useState<number | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (isOpen && user.email) {
      loadReviews();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen, user.email]);

  const loadReviews = async () => {
    setIsLoading(true);
    try {
      const response = await fetch(
        `${funcUrls["reviews"]}?reviewee_email=${encodeURIComponent(user.email)}`,
        { headers: authStore.getAuthHeaders() }
      );
      const data = await response.json();
      if (response.ok) {
        setReviews(data.reviews || []);
        setAvgRating(data.avg_rating);
      }
    } catch (error) {
      console.error('Error loading reviews:', error);
    } finally {
      setIsLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm"
        onClick={onClose}
      >
        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.9, opacity: 0 }}
          transition={{ type: "spring", duration: 0.3 }}
          className="bg-white rounded-2xl shadow-2xl max-w-md w-full mx-4 overflow-hidden"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="relative">
            <div className="h-32 bg-gradient-to-r from-primary to-primary/70" />
            <button
              onClick={onClose}
              className="absolute top-4 right-4 w-8 h-8 bg-white/20 hover:bg-white/30 backdrop-blur-sm rounded-full flex items-center justify-center text-white transition-colors"
            >
              <Icon name="X" size={18} />
            </button>
            
            <div className="absolute -bottom-16 left-1/2 -translate-x-1/2">
              {user.photo ? (
                <img
                  src={user.photo}
                  alt={user.name}
                  className="w-32 h-32 rounded-full object-cover border-4 border-white shadow-lg"
                />
              ) : (
                <div className="w-32 h-32 rounded-full bg-primary/20 flex items-center justify-center border-4 border-white shadow-lg">
                  <Icon name="User" size={48} className="text-primary" />
                </div>
              )}
            </div>
          </div>

          <div className="pt-20 px-6 pb-6">
            <div className="text-center mb-6">
              <h2 className="text-2xl font-bold text-foreground mb-2">{user.name}</h2>
              <p className="text-sm text-muted-foreground flex items-center justify-center gap-2">
                <Icon name="Mail" size={16} />
                {user.email}
              </p>
              
              {avgRating !== null && (
                <div className="mt-3 flex items-center justify-center gap-2">
                  <div className="flex gap-1">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <Icon
                        key={star}
                        name="Star"
                        size={18}
                        className={`${
                          star <= Math.round(avgRating)
                            ? "fill-yellow-400 text-yellow-400"
                            : "text-gray-300"
                        }`}
                      />
                    ))}
                  </div>
                  <span className="text-sm font-semibold text-foreground">
                    {avgRating.toFixed(1)}
                  </span>
                  <span className="text-xs text-muted-foreground">
                    ({reviews.length} {reviews.length === 1 ? 'отзыв' : 'отзыва/ов'})
                  </span>
                </div>
              )}
            </div>

            {reviews.length > 0 && (
              <div className="mb-4 max-h-60 overflow-y-auto space-y-3">
                <h3 className="font-semibold text-sm text-foreground mb-2">Отзывы:</h3>
                {reviews.map((review) => (
                  <div key={review.id} className="bg-gray-50 rounded-lg p-3">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-medium text-foreground">
                        {review.reviewer_name}
                      </span>
                      <div className="flex gap-0.5">
                        {[1, 2, 3, 4, 5].map((star) => (
                          <Icon
                            key={star}
                            name="Star"
                            size={14}
                            className={`${
                              star <= review.rating
                                ? "fill-yellow-400 text-yellow-400"
                                : "text-gray-300"
                            }`}
                          />
                        ))}
                      </div>
                    </div>
                    {review.comment && (
                      <p className="text-xs text-muted-foreground">{review.comment}</p>
                    )}
                    <span className="text-xs text-muted-foreground mt-1 block">
                      {new Date(review.created_at).toLocaleDateString('ru-RU')}
                    </span>
                  </div>
                ))}
              </div>
            )}

            <div className="space-y-3">
              {user.vkLink && (
                <a
                  href={user.vkLink}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center justify-center gap-3 p-4 bg-blue-50 hover:bg-blue-100 rounded-lg transition-colors group"
                >
                  <svg className="w-6 h-6 text-blue-600" viewBox="0 0 48 48" fill="currentColor">
                    <path d="M0 23.04C0 12.1788 0 6.74826 3.37413 3.37413C6.74826 0 12.1788 0 23.04 0H24.96C35.8212 0 41.2517 0 44.6259 3.37413C48 6.74826 48 12.1788 48 23.04V24.96C48 35.8212 48 41.2517 44.6259 44.6259C41.2517 48 35.8212 48 24.96 48H23.04C12.1788 48 6.74826 48 3.37413 44.6259C0 41.2517 0 35.8212 0 24.96V23.04Z" fill="#0077FF"/>
                    <path d="M25.54 34.5801C14.6 34.5801 8.3601 27.0801 8.1001 14.6001H13.5801C13.7601 23.7601 17.8 27.6401 21.2 28.4401V14.6001H26.1801V22.5001C29.5401 22.1601 32.9601 18.5601 34.1001 14.6001H39.0801C38.2601 19.4801 34.4601 23.0801 31.8 24.5601C34.4601 25.7401 38.7801 28.9201 40.5001 34.5801H35.0601C33.7001 30.6801 30.5601 27.6601 26.1801 27.2401V34.5801H25.54Z" fill="white"/>
                  </svg>
                  <span className="font-medium text-blue-600 group-hover:underline">
                    Открыть профиль ВКонтакте
                  </span>
                  <Icon name="ExternalLink" size={16} className="text-blue-600" />
                </a>
              )}

              <Button
                onClick={onClose}
                variant="outline"
                className="w-full"
              >
                Закрыть
              </Button>
            </div>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};