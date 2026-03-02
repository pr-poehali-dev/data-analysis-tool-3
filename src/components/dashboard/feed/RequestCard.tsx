import { useState } from "react";
import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import Icon from "@/components/ui/icon";
import { Button } from "@/components/ui/button";
import { Request } from "@/store/requestsStore";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface RequestCardProps {
  request: Request;
  index: number;
  handleSuggestClick: (request?: Request) => void;
  suggestionsCount?: number;
  fromDashboard?: boolean;
  currentUserEmail?: string;
}

export const RequestCard = ({ request, index, handleSuggestClick, suggestionsCount = 0, fromDashboard = false, currentUserEmail }: RequestCardProps) => {
  const navigate = useNavigate();
  const [copied, setCopied] = useState(false);

  const copyCardToClipboard = async () => {
    const url = `${window.location.origin}/request/${request.id}`;

    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  };

  return (
    <motion.div
      key={request.id}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ y: -8, scale: 1.02 }}
      transition={{ duration: 0.3, delay: index * 0.1 }}
      className="bg-white border border-border rounded-xl p-4 sm:p-6 hover:shadow-2xl hover:border-primary/20 transition-all relative"
    >
      <div className="absolute top-2 right-3 sm:right-4 flex items-center gap-1 sm:gap-1.5">
        {(() => {
          const createdAt = new Date(request.createdAt);
          const now = new Date();
          const daysDiff = Math.floor((now.getTime() - createdAt.getTime()) / (1000 * 60 * 60 * 24));
          return daysDiff <= 2 && (
            <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 bg-primary text-white text-[10px] font-semibold rounded-full leading-none">
              <Icon name="Sparkles" size={10} />
              Новая
            </span>
          );
        })()}
        
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button 
              className="p-1.5 hover:bg-gray-100 rounded-full transition-colors z-20"
              onClick={(e) => {
                e.stopPropagation();
                e.preventDefault();
              }}
            >
              <Icon name="MoreVertical" size={18} className="text-gray-600" />
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-48">
            <DropdownMenuItem 
              onClick={(e) => {
                e.stopPropagation();
                copyCardToClipboard();
              }}
              className="cursor-pointer"
            >
              <Icon name={copied ? "Check" : "Copy"} size={16} className="mr-2" />
              {copied ? "Скопировано!" : "Скопировать"}
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
      <div 
        className="flex items-center gap-2 sm:gap-3 mb-3 sm:mb-4 cursor-pointer pr-16 sm:pr-20"
        onClick={() => navigate(`/request/${request.id}`, { state: { fromDashboard } })}
      >
        <img
          src={request.avatar}
          alt={request.name}
          className="w-10 h-10 sm:w-12 sm:h-12 rounded-full flex-shrink-0"
        />
        <div className="min-w-0 flex-1">
          <p className="font-semibold text-foreground text-sm sm:text-base truncate">{request.name}</p>
          <p className="text-xs sm:text-sm text-muted-foreground truncate">
            {request.location}
          </p>
        </div>
      </div>

      <div 
        className="space-y-2 sm:space-y-3 mb-3 sm:mb-4 cursor-pointer"
        onClick={() => navigate(`/request/${request.id}`, { state: { fromDashboard } })}
      >
        <div className="flex items-center gap-2 text-xs sm:text-sm">
          <Icon name="DollarSign" size={14} className="text-muted-foreground flex-shrink-0" />
          <span className="text-foreground truncate">
            Бюджет: <span className="font-semibold">{request.budget}</span>
          </span>
        </div>

        <div className="flex items-center gap-2 text-xs sm:text-sm">
          <Icon name="Home" size={14} className="text-muted-foreground flex-shrink-0" />
          <span className="text-foreground truncate">{request.housingType}</span>
        </div>

        <div className="flex items-center gap-2 text-xs sm:text-sm">
          <Icon name="Calendar" size={14} className="text-muted-foreground flex-shrink-0" />
          <span className="text-foreground truncate">{request.rentalPeriod}</span>
        </div>

        <div className="pt-2 sm:pt-3 border-t border-border">
          <div className="bg-green-50 border border-green-200 rounded-lg p-2.5 sm:p-3">
            <p className="text-xs sm:text-sm font-semibold text-green-800 mb-1">
              Вознаграждение
            </p>
            <p className="text-base sm:text-lg font-bold text-green-600">
              {request.reward}
            </p>
            {request.bonus && (
              <p className="text-xs text-green-700 mt-1">
                {request.bonus}
              </p>
            )}
          </div>
        </div>
      </div>

      {(() => {
        const ownerEmail = request.userEmail || request.userId;
        const isOwnRequest = currentUserEmail && ownerEmail && currentUserEmail.toLowerCase() === ownerEmail.toLowerCase();
        return (
          <div className="relative z-10 space-y-2">
            <div className="min-h-[32px] sm:min-h-[36px] flex items-center justify-center">
              {isOwnRequest ? (
                <div className="flex items-center justify-center gap-1 sm:gap-1.5 text-xs sm:text-sm text-muted-foreground bg-gray-50 py-1 sm:py-1.5 px-2 sm:px-3 rounded-lg border border-border">
                  <Icon name="User" size={12} className="sm:w-[14px] sm:h-[14px]" />
                  <span className="font-medium">Ваша заявка</span>
                </div>
              ) : suggestionsCount > 0 ? (
                <div className="flex items-center justify-center gap-1 sm:gap-1.5 text-xs sm:text-sm text-green-600 bg-green-50 py-1 sm:py-1.5 px-2 sm:px-3 rounded-lg border border-green-200">
                  <Icon name="Check" size={12} className="sm:w-[14px] sm:h-[14px]" />
                  <span className="font-medium">Уже предложено: {suggestionsCount}</span>
                </div>
              ) : null}
            </div>
            {!isOwnRequest && (
              <Button 
                className="w-full text-sm sm:text-base" 
                onClick={(e) => {
                  e.stopPropagation();
                  e.preventDefault();
                  handleSuggestClick(request);
                }}
                type="button"
              >
                <Icon name="Send" size={14} className="sm:w-4 sm:h-4 mr-1.5 sm:mr-2" />
                <span className="truncate">{suggestionsCount > 0 ? "Предложить ещё" : "Предложить вариант"}</span>
              </Button>
            )}
          </div>
        );
      })()}
    </motion.div>
  );
};