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
import { Combobox } from "@/components/ui/combobox";

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

const citiesWithDistricts: Record<string, string[]> = {
  "Москва": ["Центральный", "Северный", "Северо-Восточный", "Восточный", "Юго-Восточный", "Южный", "Юго-Западный", "Западный", "Северо-Западный", "Зеленоградский", "Новомосковский", "Троицкий"],
  "Московская область": ["Балашиха", "Подольск", "Химки", "Королёв", "Мытищи", "Люберцы", "Красногорск", "Электросталь", "Коломна", "Одинцово", "Домодедово", "Серпухов", "Щёлково", "Орехово-Зуево", "Раменское", "Жуковский", "Пушкино", "Сергиев Посад", "Воскресенск", "Ногинск", "Реутов", "Долгопрудный", "Дмитров", "Видное", "Ступино", "Павловский Посад", "Лыткарино", "Клин", "Ивантеевка", "Истра"],
  "Санкт-Петербург": ["Адмиралтейский", "Василеостровский", "Выборгский", "Калининский", "Кировский", "Колпинский", "Красногвардейский", "Красносельский", "Кронштадтский", "Курортный", "Московский", "Невский", "Петроградский", "Петродворцовый", "Приморский", "Пушкинский", "Фрунзенский", "Центральный"],
  "Ленинградская область": ["Гатчина", "Выборг", "Всеволожск", "Кингисепп", "Тихвин", "Сосновый Бор", "Волхов", "Кириши", "Тосно", "Луга", "Светогорск", "Приозерск", "Сланцы", "Пикалёво", "Отрадное", "Ивангород", "Подпорожье", "Коммунар", "Никольское", "Лодейное Поле"],
  "Новосибирск": ["Дзержинский", "Железнодорожный", "Заельцовский", "Калининский", "Кировский", "Ленинский", "Октябрьский", "Первомайский", "Советский", "Центральный"],
  "Екатеринбург": ["Верх-Исетский", "Железнодорожный", "Кировский", "Ленинский", "Октябрьский", "Орджоникидзевский", "Чкаловский"],
  "Казань": ["Авиастроительный", "Вахитовский", "Кировский", "Московский", "Ново-Савиновский", "Приволжский", "Советский"],
  "Нижний Новгород": ["Автозаводский", "Канавинский", "Ленинский", "Московский", "Нижегородский", "Приокский", "Советский", "Сормовский"],
  "Красноярск": ["Железнодорожный", "Кировский", "Ленинский", "Октябрьский", "Советский", "Свердловский", "Центральный"],
  "Челябинск": ["Калининский", "Курчатовский", "Ленинский", "Металлургический", "Советский", "Тракторозаводский", "Центральный"],
  "Самара": ["Железнодорожный", "Кировский", "Красноглинский", "Куйбышевский", "Ленинский", "Октябрьский", "Промышленный", "Самарский", "Советский"],
  "Уфа": ["Дёмский", "Калининский", "Кировский", "Ленинский", "Октябрьский", "Орджоникидзевский", "Советский"],
  "Ростов-на-Дону": ["Ворошиловский", "Железнодорожный", "Кировский", "Ленинский", "Октябрьский", "Первомайский", "Пролетарский", "Советский"],
  "Омск": ["Кировский", "Ленинский", "Октябрьский", "Советский", "Центральный"],
  "Краснодар": ["Западный", "Карасунский", "Прикубанный", "Центральный"],
  "Воронеж": ["Железнодорожный", "Коминтерновский", "Левобережный", "Ленинский", "Советский", "Центральный"],
  "Пермь": ["Дзержинский", "Индустриальный", "Кировский", "Ленинский", "Мотовилихинский", "Орджоникидзевский", "Свердловский"],
  "Волгоград": ["Тракторозаводский", "Краснооктябрьский", "Центральный", "Дзержинский", "Ворошиловский", "Советский", "Кировский", "Красноармейский"],
  "Владивосток": ["Ленинский", "Первомайский", "Первореченский", "Советский", "Фрунзенский"],
  "Саратов": ["Волжский", "Заводской", "Кировский", "Ленинский", "Октябрьский", "Фрунзенский"],
  "Тюмень": ["Калининский", "Ленинский", "Восточный", "Центральный"],
  "Тольятти": ["Автозаводский", "Комсомольский", "Центральный"],
  "Ижевск": ["Индустриальный", "Ленинский", "Октябрьский", "Первомайский", "Устиновский"],
  "Барнаул": ["Железнодорожный", "Индустриальный", "Ленинский", "Октябрьский", "Центральный"],
  "Ульяновск": ["Железнодорожный", "Заволжский", "Засвияжский", "Ленинский"],
  "Иркутск": ["Правобережный", "Свердловский", "Октябрьский", "Ленинский"],
  "Хабаровск": ["Индустриальный", "Кировский", "Краснофлотский", "Центральный", "Железнодорожный"],
  "Ярославль": ["Дзержинский", "Заволжский", "Кировский", "Красноперекопский", "Ленинский", "Фрунзенский"],
  "Владикавказ": [],
  "Махачкала": ["Кировский", "Ленинский", "Советский"],
  "Томск": ["Кировский", "Ленинский", "Октябрьский", "Советский"],
  "Оренбург": ["Дзержинский", "Ленинский", "Промышленный", "Центральный"],
  "Кемерово": ["Заводский", "Кировский", "Ленинский", "Рудничный", "Центральный"],
  "Новокузнецк": ["Заводской", "Куйбышевский", "Кузнецкий", "Новоильинский", "Орджоникидзевский", "Центральный"],
  "Рязань": ["Железнодорожный", "Московский", "Октябрьский", "Советский"],
  "Набережные Челны": ["Автозаводский", "Комсомольский", "Центральный"],
  "Астрахань": ["Кировский", "Ленинский", "Советский", "Трусовский"],
  "Пенза": ["Железнодорожный", "Ленинский", "Октябрьский", "Первомайский"],
  "Киров": ["Ленинский", "Нововятский", "Октябрьский", "Первомайский"],
  "Липецк": ["Левобережный", "Октябрьский", "Правобережный", "Советский"],
  "Чебоксары": ["Калининский", "Ленинский", "Московский"],
  "Тула": ["Зареченский", "Привокзальный", "Пролетарский", "Советский", "Центральный"],
  "Калининград": ["Ленинградский", "Московский", "Центральный"],
  "Курск": ["Железнодорожный", "Сеймский", "Центральный"],
  "Севастополь": ["Балаклавский", "Гагаринский", "Ленинский", "Нахимовский"],
  "Сочи": ["Адлерский", "Хостинский", "Центральный", "Лазаревский"],
  "Ставрополь": ["Ленинский", "Октябрьский", "Промышленный"],
  "Улан-Удэ": ["Железнодорожный", "Октябрьский", "Советский"],
  "Тверь": ["Заволжский", "Московский", "Пролетарский", "Центральный"],
  "Магнитогорск": ["Ленинский", "Орджоникидзевский", "Правобережный"],
  "Иваново": ["Ленинский", "Октябрьский", "Советский", "Фрунзенский"],
  "Брянск": ["Бежицкий", "Володарский", "Советский", "Фокинский"],
  "Белгород": [],
  "Сургут": [],
  "Владимир": ["Ленинский", "Октябрьский", "Фрунзенский"],
  "Волжский": [],
  "Чита": ["Железнодорожный", "Ингодинский", "Центральный", "Черновский"],
  "Нижний Тагил": ["Дзержинский", "Ленинский", "Тагилстроевский"],
  "Орёл": [],
  "Вологда": [],
  "Калуга": ["Ленинский", "Московский", "Октябрьский"],
  "Смоленск": [],
  "Саранск": [],
  "Курган": [],
  "Мурманск": ["Ленинский", "Октябрьский", "Первомайский"],
  "Якутск": ["Автодорожный", "Гагаринский", "Губинный", "Октябрьский", "Промышленный", "Сайсарский", "Строительный", "Центральный"],
  "Архангельск": ["Варавино-Фактория", "Исакогорский", "Ломоносовский", "Маймаксанский", "Октябрьский", "Соломбальский", "Цигломенский"],
  "Нижневартовск": [],
  "Симферополь": [],
  "Старый Оскол": [],
  "Грозный": ["Заводской", "Ленинский", "Октябрьский", "Старопромысловский"],
  "Петрозаводск": [],
  "Кострома": [],
  "Новороссийск": [],
  "Йошкар-Ола": [],
  "Таганрог": []
};

export const RequestsFeed = ({ onRegisterClick, onSuggestProperty, isAuthenticated = false }: RequestsFeedProps = {}) => {
  const navigate = useNavigate();
  const [budget, setBudget] = useState([50000]);
  const [currentPage, setCurrentPage] = useState(1);
  const [requests, setRequests] = useState<Request[]>([]);
  const [selectedCity, setSelectedCity] = useState<string | undefined>(undefined);
  const [selectedDistrict, setSelectedDistrict] = useState<string | undefined>(undefined);
  const itemsPerPage = 6;

  const getSortedCities = () => {
    const priorityCities = ["Москва", "Московская область", "Санкт-Петербург", "Ленинградская область"];
    const allCities = Object.keys(citiesWithDistricts);
    const otherCities = allCities
      .filter(city => !priorityCities.includes(city))
      .sort((a, b) => a.localeCompare(b, 'ru'));
    
    return [...priorityCities, ...otherCities];
  };

  const getCityOptions = () => {
    return getSortedCities().map(city => ({
      value: city,
      label: city
    }));
  };

  const handleSuggestClick = (request?: Request) => {
    if (onSuggestProperty) {
      onSuggestProperty();
    } else if (!isAuthenticated && onRegisterClick) {
      onRegisterClick();
    } else {
      navigate("/suggest-property", {
        state: {
          requestId: request?.id,
          requestName: request?.name
        }
      });
    }
  };

  useEffect(() => {
    const allRequests = requestsStore.getRequests();
    const activeRequests = allRequests.filter(r => r.status === 'active');
    setRequests(activeRequests);
    
    const unsubscribe = requestsStore.subscribe(() => {
      const allRequests = requestsStore.getRequests();
      const activeRequests = allRequests.filter(r => r.status === 'active');
      setRequests(activeRequests);
    });
    
    return unsubscribe;
  }, []);

  const filteredRequests = requests.filter(request => {
    if (selectedCity && request.city !== selectedCity) return false;
    if (selectedDistrict && request.district !== selectedDistrict) return false;
    return true;
  });

  useEffect(() => {
    setCurrentPage(1);
  }, [selectedCity, selectedDistrict]);

  const totalPages = Math.ceil(filteredRequests.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const currentRequests = filteredRequests.slice(startIndex, endIndex);

  return (
    <div className="space-y-6">
      <div className="bg-white border border-border rounded-xl p-6">
        <h3 className="text-lg font-semibold text-foreground mb-4">Фильтры</h3>
        
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
          <div>
            <label className="text-sm font-medium text-foreground mb-2 block">Город</label>
            <Combobox
              value={selectedCity}
              onValueChange={(value) => {
                setSelectedCity(value || undefined);
                setSelectedDistrict(undefined);
              }}
              options={getCityOptions()}
              placeholder="Все города"
              searchPlaceholder="Поиск города..."
              emptyText="Город не найден"
            />
          </div>

          <div>
            <label className="text-sm font-medium text-foreground mb-2 block">Район</label>
            <Select 
              value={selectedDistrict} 
              onValueChange={(value) => setSelectedDistrict(value === "all" ? undefined : value)}
              disabled={!selectedCity}
            >
              <SelectTrigger className={!selectedCity ? "opacity-50" : ""}>
                <SelectValue placeholder={selectedCity ? "Все районы" : "Сначала выберите город"} />
              </SelectTrigger>
              <SelectContent className="max-h-[300px]">
                <SelectItem value="all">Все районы</SelectItem>
                {selectedCity && citiesWithDistricts[selectedCity]?.map(district => (
                  <SelectItem key={district} value={district}>{district}</SelectItem>
                ))}
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
            onClick={() => navigate(`/request/${request.id}`)}
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
              onClick={(e) => {
                e.stopPropagation();
                handleSuggestClick(request);
              }}
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