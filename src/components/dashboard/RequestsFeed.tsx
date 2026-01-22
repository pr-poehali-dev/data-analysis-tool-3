import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import Icon from "@/components/ui/icon";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { requestsStore, Request } from "@/store/requestsStore";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface RequestsFeedProps {
  onRegisterClick?: () => void;
  onSuggestProperty?: () => void;
  isAuthenticated?: boolean;
}

const oldMockRequests = [
  {
    id: "1",
    tenantName: "Анна Иванова",
    tenantAvatar: "AI",
    city: "Москва",
    district: "Тверской",
    budget: 50000,
    reward: 10000,
    bonus: 5000,
    housingType: "Квартира",
    rentalPeriod: "6 месяцев",
  },
  {
    id: "2",
    tenantName: "Дмитрий Петров",
    tenantAvatar: "ДП",
    city: "Санкт-Петербург",
    district: "Центральный",
    budget: 40000,
    reward: 8000,
    bonus: 4000,
    housingType: "Студия",
    rentalPeriod: "12 месяцев",
  },
  {
    id: "3",
    tenantName: "Елена Смирнова",
    tenantAvatar: "ЕС",
    city: "Москва",
    district: "Пресненский",
    budget: 60000,
    reward: 12000,
    bonus: 6000,
    housingType: "Квартира",
    rentalPeriod: "3 месяца",
  },
  {
    id: "4",
    tenantName: "Игорь Козлов",
    tenantAvatar: "ИК",
    city: "Новосибирск",
    district: "Центральный",
    budget: 30000,
    reward: 6000,
    bonus: 3000,
    housingType: "Комната",
    rentalPeriod: "12 месяцев",
  },
  {
    id: "5",
    tenantName: "Мария Волкова",
    tenantAvatar: "МВ",
    city: "Екатеринбург",
    district: "Ленинский",
    budget: 35000,
    reward: 7000,
    bonus: 3500,
    housingType: "Студия",
    rentalPeriod: "6 месяцев",
  },
];

export const RequestsFeed = ({ onRegisterClick, onSuggestProperty, isAuthenticated = false }: RequestsFeedProps = {}) => {
  const navigate = useNavigate();
  const [budget, setBudget] = useState([50000]);
  const [currentPage, setCurrentPage] = useState(1);
  const [requests, setRequests] = useState<Request[]>([]);
  const itemsPerPage = 6;

  const handleSuggestClick = () => {
    if (onSuggestProperty) {
      onSuggestProperty();
    } else if (!isAuthenticated && onRegisterClick) {
      onRegisterClick();
    } else {
      navigate("/suggest-property");
    }
  };

  useEffect(() => {
    setRequests(requestsStore.getRequests());
    
    const unsubscribe = requestsStore.subscribe(() => {
      setRequests(requestsStore.getRequests());
    });
    
    return unsubscribe;
  }, []);

  const totalPages = Math.ceil(requests.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const currentRequests = requests.slice(startIndex, endIndex);

  return (
    <div className="space-y-6">
      <div className="bg-white border border-border rounded-xl p-6">
        <h3 className="text-lg font-semibold text-foreground mb-4">Фильтры</h3>
        
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
          <div>
            <label className="text-sm font-medium text-foreground mb-2 block">Город</label>
            <Select>
              <SelectTrigger>
                <SelectValue placeholder="Все города" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="moscow">Москва</SelectItem>
                <SelectItem value="spb">Санкт-Петербург</SelectItem>
                <SelectItem value="nsk">Новосибирск</SelectItem>
                <SelectItem value="ekb">Екатеринбург</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div>
            <label className="text-sm font-medium text-foreground mb-2 block">Район/метро</label>
            <Select>
              <SelectTrigger>
                <SelectValue placeholder="Все районы" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="center">Центральный</SelectItem>
                <SelectItem value="north">Северный</SelectItem>
                <SelectItem value="south">Южный</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div>
            <label className="text-sm font-medium text-foreground mb-2 block">Тип жилья</label>
            <Select>
              <SelectTrigger>
                <SelectValue placeholder="Все типы" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="apartment">Квартира</SelectItem>
                <SelectItem value="studio">Студия</SelectItem>
                <SelectItem value="room">Комната</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div>
            <label className="text-sm font-medium text-foreground mb-2 block">Срок аренды</label>
            <Select>
              <SelectTrigger>
                <SelectValue placeholder="Любой срок" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="3">3 месяца</SelectItem>
                <SelectItem value="6">6 месяцев</SelectItem>
                <SelectItem value="12">12 месяцев</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="md:col-span-2">
            <label className="text-sm font-medium text-foreground mb-2 block">
              Бюджет: до {budget[0].toLocaleString('ru-RU')} ₽/мес
            </label>
            <Slider
              value={budget}
              onValueChange={setBudget}
              max={100000}
              step={5000}
              className="mt-2"
            />
          </div>
        </div>

        <div className="flex gap-3 mt-6">
          <Button>
            <Icon name="Search" size={16} className="mr-2" />
            Применить фильтры
          </Button>
          <Button variant="outline">
            <Icon name="RotateCcw" size={16} className="mr-2" />
            Сбросить
          </Button>
        </div>
      </div>

      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
        {currentRequests.map((request, index) => (
          <motion.div
            key={request.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            whileHover={{ y: -8, scale: 1.02 }}
            transition={{ duration: 0.3, delay: index * 0.1 }}
            className="bg-white border border-border rounded-xl p-6 hover:shadow-2xl hover:border-primary/20 transition-all cursor-pointer relative"
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
            <div className="flex items-center gap-3 mb-4">
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

            <div className="space-y-3 mb-4">
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

            <Button 
              className="w-full" 
              onClick={handleSuggestClick}
            >
              <Icon name="Send" size={16} className="mr-2" />
              Предложить вариант
            </Button>
          </motion.div>
        ))}
      </div>

      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-2 mt-8">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
            disabled={currentPage === 1}
          >
            <Icon name="ChevronLeft" size={16} />
          </Button>

          {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
            <Button
              key={page}
              variant={currentPage === page ? "default" : "outline"}
              size="sm"
              onClick={() => setCurrentPage(page)}
              className="w-10"
            >
              {page}
            </Button>
          ))}

          <Button
            variant="outline"
            size="sm"
            onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
            disabled={currentPage === totalPages}
          >
            <Icon name="ChevronRight" size={16} />
          </Button>
        </div>
      )}
    </div>
  );
};