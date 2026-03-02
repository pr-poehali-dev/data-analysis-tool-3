import Icon from "@/components/ui/icon";
import { Button } from "@/components/ui/button";
import { Chat, messagesStore } from "@/store/messagesStore";

interface ChatHeaderProps {
  chat: Chat;
  isTenant: boolean;
  otherUserName: string;
  otherUserPhoto?: string;
  hasActiveEscrow?: boolean;
  onShowProfile: () => void;
  onShowReview: () => void;
  onShowEscrow: () => void;
}

export const ChatHeader = ({
  chat,
  isTenant,
  otherUserName,
  otherUserPhoto,
  hasActiveEscrow,
  onShowProfile,
  onShowReview,
  onShowEscrow,
}: ChatHeaderProps) => {
  return (
    <div className="bg-white border-b border-border p-3 sm:p-4">
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
              onClick={async () => {
                await messagesStore.sendSystemMessage(
                  chat.id,
                  '🤝 Стороны договорились о сделке и переходят к оформлению через эскроу'
                );
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
  );
};

export default ChatHeader;