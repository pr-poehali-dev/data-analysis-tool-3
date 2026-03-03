import { useState } from "react";
import { motion } from "framer-motion";
import Icon from "@/components/ui/icon";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { authStore } from "@/store/authStore";

interface ReviewModalProps {
  chatId: string;
  recommendationId: string;
  reviewerEmail: string;
  reviewerName: string;
  revieweeEmail: string;
  revieweeName: string;
  onClose: () => void;
  onSuccess: () => void;
}

export const ReviewModal = ({
  chatId,
  recommendationId,
  reviewerEmail,
  reviewerName,
  revieweeEmail,
  revieweeName,
  onClose,
  onSuccess
}: ReviewModalProps) => {
  const [rating, setRating] = useState(0);
  const [hoveredRating, setHoveredRating] = useState(0);
  const [comment, setComment] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async () => {
    if (rating === 0) {
      alert("Пожалуйста, выберите оценку");
      return;
    }

    setIsSubmitting(true);

    try {
      const response = await fetch("https://functions.poehali.dev/38e54b9b-a9a2-4fb2-8b73-c372543b694f", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...authStore.getAuthHeaders(),
        },
        body: JSON.stringify({
          chat_id: chatId,
          recommendation_id: recommendationId,
          reviewer_email: reviewerEmail,
          reviewer_name: reviewerName,
          reviewee_email: revieweeEmail,
          reviewee_name: revieweeName,
          rating,
          comment: comment.trim() || null
        })
      });

      const result = await response.json();

      if (response.ok && result.success) {
        alert("Отзыв успешно отправлен!");
        onSuccess();
        onClose();
      } else {
        throw new Error(result.error || "Не удалось отправить отзыв");
      }
    } catch (error) {
      console.error("Error submitting review:", error);
      alert("Произошла ошибка при отправке отзыва");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="bg-white rounded-2xl p-6 max-w-md w-full"
      >
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-xl font-bold text-foreground">
            Оставить отзыв
          </h3>
          <button
            onClick={onClose}
            className="text-muted-foreground hover:text-foreground transition-colors"
          >
            <Icon name="X" size={24} />
          </button>
        </div>

        <div className="mb-6">
          <p className="text-sm text-muted-foreground mb-2">
            Оцениваете пользователя:
          </p>
          <p className="font-semibold text-foreground">{revieweeName}</p>
        </div>

        <div className="mb-6">
          <label className="block text-sm font-medium mb-3">
            Ваша оценка
          </label>
          <div className="flex gap-2">
            {[1, 2, 3, 4, 5].map((star) => (
              <button
                key={star}
                onClick={() => setRating(star)}
                onMouseEnter={() => setHoveredRating(star)}
                onMouseLeave={() => setHoveredRating(0)}
                className="transition-all hover:scale-110"
              >
                <Icon
                  name="Star"
                  size={32}
                  className={`${
                    star <= (hoveredRating || rating)
                      ? "fill-yellow-400 text-yellow-400"
                      : "text-gray-300"
                  } transition-colors`}
                />
              </button>
            ))}
          </div>
        </div>

        <div className="mb-6">
          <label className="block text-sm font-medium mb-2">
            Комментарий (необязательно)
          </label>
          <Textarea
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            placeholder="Расскажите о своем опыте взаимодействия..."
            rows={4}
            className="resize-none"
          />
        </div>

        <div className="flex gap-3">
          <Button
            variant="outline"
            onClick={onClose}
            disabled={isSubmitting}
            className="flex-1"
          >
            Отмена
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={isSubmitting || rating === 0}
            className="flex-1"
          >
            {isSubmitting ? (
              <>
                <Icon name="Loader2" size={16} className="mr-2 animate-spin" />
                Отправка...
              </>
            ) : (
              "Отправить отзыв"
            )}
          </Button>
        </div>
      </motion.div>
    </div>
  );
};