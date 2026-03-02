import { useState } from "react";
import Icon from "@/components/ui/icon";
import { Button } from "@/components/ui/button";
import { Chat, messagesStore } from "@/store/messagesStore";
import { escrowStore } from "@/store/escrowStore";

interface ChatHeaderProps {
  chat: Chat;
  isTenant: boolean;
  otherUserName: string;
  otherUserPhoto?: string;
  hasActiveEscrow?: boolean;
  escrowStatus?: string;
  escrowAmount?: number;
  escrowTransactionId?: string;
  onEscrowChanged?: () => void;
  onShowProfile: () => void;
  onShowReview: () => void;
  onShowEscrow: () => void;
}

const escrowStatusConfig: Record<string, { label: string; icon: string; bg: string; text: string; border: string }> = {
  frozen: {
    label: "Средства на эскроу",
    icon: "ShieldCheck",
    bg: "bg-blue-50",
    text: "text-blue-700",
    border: "border-blue-200",
  },
  pending: {
    label: "Ожидает подтверждения",
    icon: "Clock",
    bg: "bg-amber-50",
    text: "text-amber-700",
    border: "border-amber-200",
  },
  completed: {
    label: "Сделка завершена",
    icon: "CheckCircle",
    bg: "bg-green-50",
    text: "text-green-700",
    border: "border-green-200",
  },
};

export const ChatHeader = ({
  chat,
  isTenant,
  otherUserName,
  otherUserPhoto,
  hasActiveEscrow,
  escrowStatus,
  escrowAmount,
  escrowTransactionId,
  onEscrowChanged,
  onShowProfile,
  onShowReview,
  onShowEscrow,
}: ChatHeaderProps) => {
  const [isConfirming, setIsConfirming] = useState(false);
  const [isCancelling, setIsCancelling] = useState(false);
  const statusInfo = escrowStatus ? escrowStatusConfig[escrowStatus] : null;

  const handleConfirmDeal = async () => {
    if (!escrowTransactionId) return;
    const confirmed = window.confirm(
      `Вы подтверждаете сделку? Вознаграждение ${escrowAmount?.toLocaleString('ru-RU')} ₽ будет переведено рекомендателю.`
    );
    if (!confirmed) return;

    setIsConfirming(true);
    try {
      await escrowStore.updateTransactionStatus(escrowTransactionId, 'completed');
      await messagesStore.sendSystemMessage(
        chat.id,
        `✅ Сделка подтверждена! Вознаграждение ${escrowAmount?.toLocaleString('ru-RU')} ₽ переведено рекомендателю.`
      );
      onEscrowChanged?.();
    } catch (error) {
      console.error('Error confirming deal:', error);
      alert('Ошибка при подтверждении сделки');
    } finally {
      setIsConfirming(false);
    }
  };

  const handleCancelDeal = async () => {
    if (!escrowTransactionId) return;
    const confirmed = window.confirm(
      'Вы уверены, что хотите отменить сделку? Средства будут возвращены.'
    );
    if (!confirmed) return;

    setIsCancelling(true);
    try {
      await escrowStore.updateTransactionStatus(escrowTransactionId, 'cancelled');
      await messagesStore.sendSystemMessage(
        chat.id,
        `❌ Сделка отменена. Средства ${escrowAmount?.toLocaleString('ru-RU')} ₽ возвращены арендатору.`
      );
      onEscrowChanged?.();
    } catch (error) {
      console.error('Error cancelling deal:', error);
      alert('Ошибка при отмене сделки');
    } finally {
      setIsCancelling(false);
    }
  };

  return (
    <div className="bg-white border-b border-border">
      <div className="p-3 sm:p-4">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 sm:gap-3">
          <div className="flex items-center gap-2 sm:gap-3 flex-1 min-w-0 w-full sm:w-auto">
            <button
              onClick={onShowProfile}
              className="flex-shrink-0 hover:opacity-80 transition-opacity"
            >
              {otherUserPhoto ? (
                <img
                  src={otherUserPhoto}
                  alt={otherUserName}
                  className="w-10 h-10 rounded-full object-cover border-2 border-primary/20 cursor-pointer"
                />
              ) : (
                <div className="w-10 h-10 bg-primary/20 rounded-full flex items-center justify-center cursor-pointer">
                  <Icon name="User" size={18} className="text-primary" />
                </div>
              )}
            </button>
            <button
              onClick={onShowProfile}
              className="flex-1 text-left hover:opacity-80 transition-opacity"
            >
              <h3 className="font-semibold text-foreground">{otherUserName}</h3>
              <p className="text-xs text-muted-foreground">{chat.requestName}</p>
            </button>
          </div>
          <div className="flex flex-col sm:flex-row gap-1.5 sm:gap-2 w-full sm:w-auto">
            {isTenant && !hasActiveEscrow && (
              <Button
                variant="default"
                size="sm"
                onClick={() => {
                  onShowEscrow();
                }}
                className="w-full sm:w-auto flex items-center justify-center gap-1.5 sm:gap-2 text-xs sm:text-sm bg-green-600 hover:bg-green-700 px-3 py-2 sm:py-1.5"
              >
                <Icon name="Handshake" size={16} className="sm:w-4 sm:h-4" />
                Мы договорились
              </Button>
            )}
            <Button
              variant="outline"
              size="sm"
              onClick={onShowReview}
              className="w-full sm:w-auto flex items-center justify-center gap-1.5 sm:gap-2 text-xs sm:text-sm px-3"
            >
              <Icon name="Star" size={14} className="sm:w-4 sm:h-4" />
              Оставить отзыв
            </Button>
          </div>
        </div>
      </div>

      {hasActiveEscrow && statusInfo && (
        <div className={`px-3 sm:px-4 py-2 sm:py-2.5 ${statusInfo.bg} border-t ${statusInfo.border}`}>
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
            <div className="flex items-center gap-2">
              <Icon name={statusInfo.icon} size={16} className={`${statusInfo.text} flex-shrink-0`} />
              <span className={`text-xs font-medium ${statusInfo.text}`}>
                {statusInfo.label}
              </span>
              {escrowAmount && (
                <span className={`text-xs font-bold ${statusInfo.text}`}>
                  {escrowAmount.toLocaleString('ru-RU')} ₽
                </span>
              )}
            </div>
            {isTenant && escrowStatus === 'frozen' && (
              <div className="flex gap-1.5 w-full sm:w-auto">
                <Button
                  size="sm"
                  variant="outline"
                  disabled={isCancelling || isConfirming}
                  onClick={handleCancelDeal}
                  className="h-8 sm:h-7 text-xs border-red-300 text-red-600 hover:bg-red-50 px-2.5 flex-1 sm:flex-none"
                >
                  {isCancelling ? (
                    <Icon name="Loader2" size={14} className="animate-spin" />
                  ) : (
                    <>
                      <Icon name="X" size={14} className="mr-1" />
                      Отменить
                    </>
                  )}
                </Button>
                <Button
                  size="sm"
                  disabled={isConfirming || isCancelling}
                  onClick={handleConfirmDeal}
                  className="h-8 sm:h-7 text-xs bg-green-600 hover:bg-green-700 text-white px-2.5 flex-1 sm:flex-none"
                >
                  {isConfirming ? (
                    <Icon name="Loader2" size={14} className="animate-spin" />
                  ) : (
                    <>
                      <Icon name="Check" size={14} className="mr-1" />
                      Подтвердить
                    </>
                  )}
                </Button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default ChatHeader;