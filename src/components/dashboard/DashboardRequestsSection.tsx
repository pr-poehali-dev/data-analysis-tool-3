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

  const handleDeleteRequest = (requestId: string) => {
    if (window.confirm('Вы уверены, что хотите удалить эту заявку?')) {
      requestsStore.deleteRequest(requestId);
    }
  };

  const handleStatusChange = (requestId: string, status: RequestStatus) => {
    requestsStore.updateRequestStatus(requestId, status);
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
      <h2 className="text-3xl font-bold text-foreground mb-6">Мои заявки</h2>
      {userRequests.length === 0 ? (
        <div className="bg-white border border-border rounded-xl p-8 text-center">
          <Icon name="FileText" size={48} className="mx-auto mb-4 text-muted-foreground" />
          <p className="text-lg text-muted-foreground">У вас пока нет активных заявок</p>
          <Button 
            className="mt-6" 
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
        <div className="space-y-4">
          {userRequests.map((request) => (
            <motion.div
              key={request.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-white border border-border rounded-xl p-6"
            >
              <div className="flex items-start gap-4">
                <img
                  src={request.avatar}
                  alt={request.name}
                  className="w-16 h-16 rounded-full"
                />
                <div className="flex-1">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-3">
                      <h3 className="text-xl font-semibold text-foreground">{request.name}</h3>
                      <span className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(request.status)}`}>
                        {getStatusLabel(request.status)}
                      </span>
                    </div>
                    <span className="text-sm text-muted-foreground">
                      {new Date(request.createdAt).toLocaleDateString('ru-RU')}
                    </span>
                  </div>
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
                  <div className="mt-4">
                    <p className="text-sm text-muted-foreground">О себе:</p>
                    <p className="text-sm text-foreground mt-1">{request.aboutYourself}</p>
                  </div>
                  <div className="flex items-center gap-3 mt-4">
                    <div className="flex items-center gap-2">
                      <span className="text-sm text-muted-foreground">Статус:</span>
                      <Select
                        value={request.status}
                        onValueChange={(value) => handleStatusChange(request.id, value as RequestStatus)}
                      >
                        <SelectTrigger className="w-[150px] h-8 text-sm">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="active">Активна</SelectItem>
                          <SelectItem value="in_progress">В работе</SelectItem>
                          <SelectItem value="archived">Архивная</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="flex gap-2 ml-auto">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => navigate(`/edit-request/${request.id}`)}
                      >
                        <Icon name="Edit" size={16} className="mr-2" />
                        Редактировать
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleDeleteRequest(request.id)}
                        className="text-red-600 hover:text-red-700 hover:border-red-600"
                      >
                        <Icon name="Trash2" size={16} className="mr-2" />
                        Удалить
                      </Button>
                    </div>
                  </div>
                  <div className="mt-4">
                    <Button
                      className="w-full bg-[#155eef] hover:bg-[#155eef]/90 relative"
                      onClick={() => navigate(`/request-offers/${request.id}`)}
                    >
                      <Icon name="Eye" size={16} className="mr-2" />
                      Смотреть предложения
                      {getOffersCount(request.id) > 0 && (
                        <span className="ml-2 bg-white text-[#155eef] px-2 py-0.5 rounded-full text-xs font-semibold">
                          {getOffersCount(request.id)}
                        </span>
                      )}
                    </Button>
                  </div>
                </div>
              </div>
            </motion.div>
          ))}
          <Button 
            className="w-full mt-4" 
            variant="outline"
            onClick={(e) => {
              e.preventDefault();
              navigate("/create-request");
            }}
          >
            <Icon name="Plus" size={16} className="mr-2" />
            Создать ещё одну заявку
          </Button>
        </div>
      )}
    </div>
  );
};
