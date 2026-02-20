import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import Icon from "@/components/ui/icon";

interface Review {
  id: number;
  chat_id: string;
  recommendation_id: string;
  reviewer_email: string;
  reviewer_name: string;
  reviewee_email: string;
  reviewee_name: string;
  rating: number;
  comment: string | null;
  created_at: string;
}

interface DashboardReviewsSectionProps {
  userEmail: string;
}

export const DashboardReviewsSection = ({ userEmail }: DashboardReviewsSectionProps) => {
  const [reviews, setReviews] = useState<Review[]>([]);
  const [avgRating, setAvgRating] = useState<number | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadReviews();
  }, [userEmail]);

  const loadReviews = async () => {
    setIsLoading(true);
    try {
      const response = await fetch(
        `https://functions.poehali.dev/38e54b9b-a9a2-4fb2-8b73-c372543b694f?reviewee_email=${encodeURIComponent(userEmail)}`
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

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Icon name="Loader2" size={32} className="animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div>
      <h2 className="text-2xl sm:text-3xl font-bold text-foreground mb-4 sm:mb-6">Отзывы</h2>

      {avgRating !== null && reviews.length > 0 && (
        <div className="bg-white rounded-xl border border-border p-4 sm:p-6 mb-4 sm:mb-6">
          <div className="flex flex-col sm:flex-row items-center gap-4">
            <div className="flex flex-col items-center">
              <div className="text-4xl sm:text-5xl font-bold text-foreground">{avgRating.toFixed(1)}</div>
              <div className="flex gap-1 mt-2">
                {[1, 2, 3, 4, 5].map((star) => (
                  <Icon
                    key={star}
                    name="Star"
                    size={20}
                    className={`${
                      star <= Math.round(avgRating)
                        ? "fill-yellow-400 text-yellow-400"
                        : "text-gray-300"
                    }`}
                  />
                ))}
              </div>
              <div className="text-sm text-muted-foreground mt-1">
                {reviews.length} {reviews.length === 1 ? 'отзыв' : reviews.length < 5 ? 'отзыва' : 'отзывов'}
              </div>
            </div>
            
            <div className="flex-1">
              <h3 className="text-lg font-semibold text-foreground mb-2">
                Средняя оценка
              </h3>
              <p className="text-sm text-muted-foreground">
                На основе отзывов от пользователей, с которыми вы взаимодействовали
              </p>
            </div>
          </div>
        </div>
      )}

      {reviews.length === 0 ? (
        <div className="text-center py-12 bg-white rounded-xl border border-border">
          <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mx-auto mb-4">
            <Icon name="Star" size={32} className="text-muted-foreground" />
          </div>
          <h3 className="text-lg font-semibold text-foreground mb-2">
            Пока нет отзывов
          </h3>
          <p className="text-sm text-muted-foreground max-w-md mx-auto">
            Отзывы появятся после того, как другие пользователи оставят их в диалогах с вами
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {reviews.map((review, index) => (
            <motion.div
              key={review.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.05 }}
              className="bg-white rounded-xl border border-border p-4 sm:p-6"
            >
              <div className="flex flex-col-reverse sm:flex-row items-start justify-between gap-2 sm:gap-4 mb-3 sm:mb-4">
                <div className="flex-1">
                  <h4 className="font-semibold text-foreground text-sm sm:text-base mb-1">
                    {review.reviewer_name}
                  </h4>
                  <p className="text-xs text-muted-foreground">
                    {new Date(review.created_at).toLocaleDateString('ru-RU', {
                      day: 'numeric',
                      month: 'long',
                      year: 'numeric'
                    })}
                  </p>
                </div>
                <div className="flex gap-0.5 sm:gap-1">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <Icon
                      key={star}
                      name="Star"
                      size={16}
                      className={`sm:w-[18px] sm:h-[18px] ${
                        star <= review.rating
                          ? "fill-yellow-400 text-yellow-400"
                          : "text-gray-300"
                      }`}
                    />
                  ))}
                </div>
              </div>
              
              {review.comment && (
                <p className="text-sm text-foreground leading-relaxed">
                  {review.comment}
                </p>
              )}
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
};