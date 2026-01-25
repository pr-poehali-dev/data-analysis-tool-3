import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import Icon from "@/components/ui/icon";
import { Button } from "@/components/ui/button";
import { Request } from "@/store/requestsStore";

interface RequestCardProps {
  request: Request;
  index: number;
  handleSuggestClick: (request?: Request) => void;
  alreadySuggested?: boolean;
}

export const RequestCard = ({ request, index, handleSuggestClick, alreadySuggested = false }: RequestCardProps) => {
  const navigate = useNavigate();

  return (
    <motion.div
      key={request.id}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ y: -8, scale: 1.02 }}
      transition={{ duration: 0.3, delay: index * 0.1 }}
      className="bg-white border border-border rounded-xl p-6 hover:shadow-2xl hover:border-primary/20 transition-all relative"
    >
      {(() => {
        const createdAt = new Date(request.createdAt);
        const now = new Date();
        const daysDiff = Math.floor((now.getTime() - createdAt.getTime()) / (1000 * 60 * 60 * 24));
        return daysDiff <= 2 && (
          <div className="absolute top-4 right-4">
            <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-primary text-white text-xs font-semibold rounded-full">
              <Icon name="Sparkles" size={12} />
              Новая
            </span>
          </div>
        );
      })()}
      <div 
        className="flex items-center gap-3 mb-4 cursor-pointer"
        onClick={() => navigate(`/request/${request.id}`)}
      >
        <img
          src={request.avatar}
          alt={request.name}
          className="w-12 h-12 rounded-full"
        />
        <div>
          <p className="font-semibold text-foreground">{request.name}</p>
          <p className="text-sm text-muted-foreground">
            {request.location}
          </p>
        </div>
      </div>

      <div 
        className="space-y-3 mb-4 cursor-pointer"
        onClick={() => navigate(`/request/${request.id}`)}
      >
        <div className="flex items-center gap-2 text-sm">
          <Icon name="DollarSign" size={16} className="text-muted-foreground" />
          <span className="text-foreground">
            Бюджет: <span className="font-semibold">{request.budget}</span>
          </span>
        </div>

        <div className="flex items-center gap-2 text-sm">
          <Icon name="Home" size={16} className="text-muted-foreground" />
          <span className="text-foreground">{request.housingType}</span>
        </div>

        <div className="flex items-center gap-2 text-sm">
          <Icon name="Calendar" size={16} className="text-muted-foreground" />
          <span className="text-foreground">{request.rentalPeriod}</span>
        </div>

        <div className="pt-3 border-t border-border">
          <div className="bg-green-50 border border-green-200 rounded-lg p-3">
            <p className="text-sm font-semibold text-green-800 mb-1">
              Вознаграждение
            </p>
            <p className="text-lg font-bold text-green-600">
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

      <div className="relative z-10">
        <Button 
          className="w-full" 
          onClick={(e) => {
            e.stopPropagation();
            e.preventDefault();
            if (!alreadySuggested) {
              handleSuggestClick(request);
            }
          }}
          disabled={alreadySuggested}
          type="button"
          variant={alreadySuggested ? "outline" : "default"}
        >
          <Icon name={alreadySuggested ? "Check" : "Send"} size={16} className="mr-2" />
          {alreadySuggested ? "Уже предложено" : "Предложить вариант"}
        </Button>
      </div>
    </motion.div>
  );
};