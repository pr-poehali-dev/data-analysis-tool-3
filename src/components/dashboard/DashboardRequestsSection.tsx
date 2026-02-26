import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import Icon from "@/components/ui/icon";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { Request, RequestStatus, requestsStore } from "@/store/requestsStore";
import { recommendationsStore } from "@/store/recommendationsStore";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface DashboardRequestsSectionProps {
  userRequests: Request[];
}

export const DashboardRequestsSection = ({ userRequests }: DashboardRequestsSectionProps) => {
  const navigate = useNavigate();
  const [, setRefresh] = useState(0);

  useEffect(() => {
    userRequests.forEach(r => {
      recommendationsStore.fetchRecommendationsByRequestId(r.id);
    });
    const unsubscribe = recommendationsStore.subscribe(() => setRefresh(n => n + 1));
    return unsubscribe;
  }, [userRequests]);

  const handleDeleteRequest = async (requestId: string) => {
    if (window.confirm('Вы уверены, что хотите удалить эту заявку?')) {
      await requestsStore.deleteRequest(requestId);
    }
  };

  const handleStatusChange = async (requestId: string, status: RequestStatus) => {
    await requestsStore.updateRequestStatus(requestId, status);
  };

  const getOffersCount = (requestId: string): number => {
    return recommendationsStore.getRecommendationsByRequestId(requestId).length;
  };

  const getStatusLabel = (status: RequestStatus) => {
    switch (status) {
      case 'active': return 'Активна';
      case 'in_progress': return 'В работе';
      case 'archived': return 'Архивная';
    }
  };

  const getStatusColor = (status: RequestStatus) => {
    switch (status) {
      case 'active': return 'bg-green-100 text-green-800';
      case 'in_progress': return 'bg-blue-100 text-blue-800';
      case 'archived': return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div>
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 mb-4 sm:mb-6">
        <h2 className="text-xl sm:text-3xl font-bold text-foreground">Мои заявки</h2>
        {userRequests.length > 0 && (
          <Button 
            className="w-full sm:w-auto text-sm"
            onClick={(e) => {
              e.preventDefault();
              navigate("/create-request");
            }}
          >
            <Icon name="Plus" size={16} className="mr-1.5" />
            Создать заявку
          </Button>
        )}
      </div>

      {userRequests.length === 0 ? (
        <div className="bg-white border border-border rounded-xl p-6 sm:p-8 text-center">
          <Icon name="FileText" size={40} className="mx-auto mb-3 text-muted-foreground" />
          <p className="text-base sm:text-lg text-muted-foreground">У вас пока нет активных заявок</p>
          <Button 
            className="mt-4 sm:mt-6 w-full sm:w-auto" 
            onClick={(e) => {
              e.preventDefault();
              navigate("/create-request");
            }}
          >
            <Icon name="Plus" size={16} className="mr-2" />
            Создать заявку
          </Button>
        </div>
      ) : (
        <div className="space-y-3 sm:space-y-4">
          {userRequests.map((request) => (
            <motion.div
              key={request.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-white border border-border rounded-xl p-3 sm:p-6"
            >
              <div className="flex items-start gap-3 sm:gap-4 mb-3">
                <img
                  src={request.avatar}
                  alt={request.name}
                  className="w-10 h-10 sm:w-14 sm:h-14 rounded-full flex-shrink-0"
                />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap mb-0.5">
                    <h3 className="text-base sm:text-xl font-semibold text-foreground truncate">{request.name}</h3>
                    <span className={`px-2 py-0.5 rounded-full text-[10px] sm:text-xs font-medium whitespace-nowrap ${getStatusColor(request.status)}`}>
                      {getStatusLabel(request.status)}
                    </span>
                  </div>
                  <span className="text-[11px] sm:text-sm text-muted-foreground">
                    {new Date(request.createdAt).toLocaleDateString('ru-RU')}
                  </span>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-x-3 gap-y-1.5 sm:gap-x-6 sm:gap-y-3 text-xs sm:text-sm mb-3 sm:mb-4">
                <div>
                  <span className="text-muted-foreground">Локация:</span>
                  <p className="text-foreground font-medium truncate">{request.location}</p>
                </div>
                <div>
                  <span className="text-muted-foreground">Бюджет:</span>
                  <p className="text-foreground font-medium">{request.budget}</p>
                </div>
                <div>
                  <span className="text-muted-foreground">Тип жилья:</span>
                  <p className="text-foreground font-medium truncate">{request.housingType}, {request.roomsCount}</p>
                </div>
                <div>
                  <span className="text-muted-foreground">Вознаграждение:</span>
                  <p className="text-primary font-semibold">{request.reward}</p>
                </div>
              </div>

              <div className="mb-3 sm:mb-4">
                <p className="text-[11px] sm:text-sm text-muted-foreground mb-0.5">О себе:</p>
                <p className="text-xs sm:text-sm text-foreground line-clamp-2 sm:line-clamp-none">{request.aboutYourself}</p>
              </div>

              <div className="border-t border-border pt-3 space-y-2.5 sm:space-y-3">
                <div className="flex items-center gap-2">
                  <span className="text-xs sm:text-sm text-muted-foreground whitespace-nowrap">Статус:</span>
                  <Select
                    value={request.status}
                    onValueChange={(value) => handleStatusChange(request.id, value as RequestStatus)}
                  >
                    <SelectTrigger className="w-[130px] sm:w-[150px] h-8 text-xs sm:text-sm">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="active">Активна</SelectItem>
                      <SelectItem value="in_progress">В работе</SelectItem>
                      <SelectItem value="archived">Архивная</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => navigate(`/edit-request/${request.id}`)}
                    className="text-xs sm:text-sm h-8 sm:h-9"
                  >
                    <Icon name="Edit" size={14} className="mr-1 sm:mr-1.5" />
                    Изменить
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleDeleteRequest(request.id)}
                    className="text-xs sm:text-sm h-8 sm:h-9 text-red-600 hover:text-red-700 hover:border-red-600"
                  >
                    <Icon name="Trash2" size={14} className="mr-1 sm:mr-1.5" />
                    Удалить
                  </Button>
                </div>

                <Button
                  className="w-full bg-[#155eef] hover:bg-[#155eef]/90 relative text-xs sm:text-sm h-9 sm:h-10"
                  onClick={() => navigate(`/request-offers/${request.id}`)}
                >
                  <Icon name="Eye" size={15} className="mr-1.5" />
                  Смотреть предложения
                  {getOffersCount(request.id) > 0 && (
                    <span className="ml-2 bg-white text-[#155eef] px-1.5 sm:px-2 py-0.5 rounded-full text-[10px] sm:text-xs font-semibold">
                      {getOffersCount(request.id)}
                    </span>
                  )}
                </Button>
              </div>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
};