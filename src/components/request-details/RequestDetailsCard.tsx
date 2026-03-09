import { motion } from "framer-motion";
import Icon from "@/components/ui/icon";
import { Button } from "@/components/ui/button";
import { Request } from "@/store/requestsStore";
import { authStore } from "@/store/authStore";

interface RequestDetailsCardProps {
  request: Request;
  onAuthorClick: () => void;
  onSuggest: () => void;
  onBack: () => void;
  onRegister: () => void;
}

export const RequestDetailsCard = ({
  request,
  onAuthorClick,
  onSuggest,
  onBack,
  onRegister,
}: RequestDetailsCardProps) => {
  const createdAt = new Date(request.createdAt);
  const daysDiff = Math.floor((Date.now() - createdAt.getTime()) / (1000 * 60 * 60 * 24));
  const isNew = daysDiff <= 2;

  const user = authStore.getUser();
  const ownerEmail = request.userEmail || request.userId;
  const isOwn = user && ownerEmail && user.email.toLowerCase() === ownerEmail.toLowerCase();

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-white border border-border rounded-xl p-4 sm:p-8 overflow-hidden"
    >
      {isNew && (
        <div className="mb-6">
          <span className="inline-flex items-center gap-1 px-3 py-1.5 bg-primary text-white text-sm font-semibold rounded-full">
            <Icon name="Sparkles" size={14} />
            Новая заявка
          </span>
        </div>
      )}

      <div className="flex items-start gap-3 sm:gap-6 mb-6 sm:mb-8">
        {request.avatar ? (
          <img
            src={request.avatar}
            alt={request.name}
            className="w-14 h-14 sm:w-24 sm:h-24 rounded-full shrink-0 object-cover cursor-pointer hover:opacity-80 transition-opacity"
            onClick={onAuthorClick}
            onError={(e) => {
              (e.target as HTMLImageElement).style.display = "none";
              (e.target as HTMLImageElement).nextElementSibling?.classList.remove("hidden");
            }}
          />
        ) : null}
        <div
          className={`w-14 h-14 sm:w-24 sm:h-24 rounded-full shrink-0 bg-primary/10 flex items-center justify-center cursor-pointer hover:opacity-80 transition-opacity${request.avatar ? " hidden" : ""}`}
          onClick={onAuthorClick}
        >
          <span className="text-primary font-bold text-2xl sm:text-4xl">
            {request.name?.charAt(0)?.toUpperCase() || "?"}
          </span>
        </div>
        <div className="flex-1 min-w-0">
          <h1
            className="text-xl sm:text-3xl font-bold text-foreground mb-1 sm:mb-2 break-words cursor-pointer hover:text-primary transition-colors"
            onClick={onAuthorClick}
          >
            {request.name}
          </h1>
          <p className="text-sm sm:text-lg text-muted-foreground mb-2 sm:mb-4">{request.location}</p>
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

      <div className="grid grid-cols-2 md:grid-cols-2 gap-3 sm:gap-6 mb-6 sm:mb-8">
        <div className="space-y-3 sm:space-y-4">
          <div className="bg-gray-50 rounded-lg p-3 sm:p-4">
            <div className="flex items-center gap-1.5 sm:gap-2 mb-1 sm:mb-2">
              <Icon name="DollarSign" size={16} className="text-primary sm:w-5 sm:h-5" />
              <h3 className="font-semibold text-foreground text-sm sm:text-base">Бюджет</h3>
            </div>
            <p className="text-lg sm:text-2xl font-bold text-foreground break-words">{request.budget}</p>
          </div>

          <div className="bg-gray-50 rounded-lg p-3 sm:p-4">
            <div className="flex items-center gap-1.5 sm:gap-2 mb-1 sm:mb-2">
              <Icon name="Gift" size={16} className="text-primary sm:w-5 sm:h-5" />
              <h3 className="font-semibold text-foreground text-sm sm:text-base">Вознаграждение</h3>
            </div>
            <p className="text-lg sm:text-2xl font-bold text-primary break-words">{request.reward}</p>
          </div>
        </div>

        <div className="space-y-3 sm:space-y-4">
          <div className="bg-gray-50 rounded-lg p-3 sm:p-4">
            <div className="flex items-center gap-1.5 sm:gap-2 mb-1 sm:mb-2">
              <Icon name="Home" size={16} className="text-primary sm:w-5 sm:h-5" />
              <h3 className="font-semibold text-foreground text-sm sm:text-base">Тип жилья</h3>
            </div>
            <p className="text-base sm:text-lg text-foreground">{request.housingType}</p>
            <p className="text-xs sm:text-sm text-muted-foreground mt-1">{request.roomsCount}</p>
          </div>

          <div className="bg-gray-50 rounded-lg p-3 sm:p-4">
            <div className="flex items-center gap-1.5 sm:gap-2 mb-1 sm:mb-2">
              <Icon name="Calendar" size={16} className="text-primary sm:w-5 sm:h-5" />
              <h3 className="font-semibold text-foreground text-sm sm:text-base">Срок аренды</h3>
            </div>
            <p className="text-base sm:text-lg text-foreground">{request.rentalPeriod}</p>
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
            <p className="text-sm sm:text-base text-foreground leading-relaxed whitespace-pre-wrap break-words overflow-wrap-anywhere">{request.aboutYourself}</p>
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
            <p className="text-sm sm:text-base text-foreground leading-relaxed whitespace-pre-wrap break-words overflow-wrap-anywhere">{request.preferences}</p>
          </div>
        </div>
      )}

      <div className="flex flex-col sm:flex-row gap-3 pt-4 sm:pt-6 border-t border-border">
        {isOwn ? (
          <div className="flex-1 flex items-center justify-center gap-1.5 text-sm text-muted-foreground bg-gray-50 py-3 px-4 rounded-lg border border-border">
            <Icon name="User" size={14} />
            <span className="font-medium">Это ваша заявка</span>
          </div>
        ) : (
          <Button
            className="flex-1"
            onClick={() => {
              if (authStore.isAuthenticated()) {
                onSuggest();
              } else {
                onRegister();
              }
            }}
          >
            <Icon name="Home" size={16} className="mr-2" />
            Предложить объект
          </Button>
        )}
        <Button variant="outline" onClick={onBack}>
          <Icon name="ArrowLeft" size={16} className="mr-2" />
          Назад
        </Button>
      </div>
    </motion.div>
  );
};

export default RequestDetailsCard;