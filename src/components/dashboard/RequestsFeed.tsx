import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { requestsStore, Request } from "@/store/requestsStore";
import { RequestsFeedFilters } from "./feed/RequestsFeedFilters";
import { RequestCard } from "./feed/RequestCard";
import { RequestsPagination } from "./feed/RequestsPagination";

interface RequestsFeedProps {
  onRegisterClick?: () => void;
  onSuggestProperty?: (requestId?: string, requestName?: string) => void;
  isAuthenticated?: boolean;
}

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
  const [selectedHousingType, setSelectedHousingType] = useState<string | undefined>(undefined);
  const [selectedRentalPeriod, setSelectedRentalPeriod] = useState<string | undefined>(undefined);
  const [selectedRoomsCount, setSelectedRoomsCount] = useState<string | undefined>(undefined);
  const [filtersApplied, setFiltersApplied] = useState(false);
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
    console.log('handleSuggestClick called', {
      request,
      isAuthenticated,
      hasOnSuggestProperty: !!onSuggestProperty,
      hasOnRegisterClick: !!onRegisterClick
    });

    if (!isAuthenticated && onRegisterClick) {
      console.log('Calling onRegisterClick');
      onRegisterClick();
      return;
    }
    
    if (onSuggestProperty) {
      console.log('Calling onSuggestProperty with', request?.id, request?.name);
      onSuggestProperty(request?.id, request?.name);
    } else {
      console.log('Navigating directly');
      navigate("/suggest-property", {
        state: {
          requestId: request?.id,
          requestName: request?.name,
          fromDashboard: false
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
    if (!filtersApplied) return true;
    
    if (selectedCity && request.city !== selectedCity) return false;
    if (selectedDistrict && request.district !== selectedDistrict) return false;
    
    if (selectedHousingType && request.housingType !== selectedHousingType) return false;
    
    if (selectedRentalPeriod) {
      const requestMonths = parseInt(request.rentalPeriod);
      if (selectedRentalPeriod === "1-3") {
        if (isNaN(requestMonths) || requestMonths < 1 || requestMonths > 3) return false;
      } else if (selectedRentalPeriod === "3-6") {
        if (isNaN(requestMonths) || requestMonths < 3 || requestMonths > 6) return false;
      } else if (selectedRentalPeriod === "6-12") {
        if (isNaN(requestMonths) || requestMonths < 6 || requestMonths > 12) return false;
      } else if (selectedRentalPeriod === "12+") {
        if (isNaN(requestMonths) || requestMonths <= 12) return false;
      }
    }
    
    if (selectedRoomsCount) {
      const requestRooms = parseInt(request.roomsCount?.replace(/\D/g, '') || '0');
      if (selectedRoomsCount === "4+") {
        if (requestRooms < 4) return false;
      } else {
        const filterRooms = parseInt(selectedRoomsCount);
        if (requestRooms !== filterRooms) return false;
      }
    }
    
    const requestBudget = parseInt(request.budgetMax?.replace(/\D/g, '') || request.budget?.replace(/\D/g, '') || '0');
    if (requestBudget > budget[0]) return false;
    
    return true;
  });

  useEffect(() => {
    setCurrentPage(1);
  }, [filtersApplied]);

  const handleApplyFilters = () => {
    setFiltersApplied(true);
  };

  const handleResetFilters = () => {
    setSelectedCity(undefined);
    setSelectedDistrict(undefined);
    setSelectedHousingType(undefined);
    setSelectedRentalPeriod(undefined);
    setSelectedRoomsCount(undefined);
    setBudget([50000]);
    setFiltersApplied(false);
  };

  const totalPages = Math.ceil(filteredRequests.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const currentRequests = filteredRequests.slice(startIndex, endIndex);

  return (
    <div className="space-y-3">
      <RequestsFeedFilters
        selectedCity={selectedCity}
        setSelectedCity={setSelectedCity}
        selectedDistrict={selectedDistrict}
        setSelectedDistrict={setSelectedDistrict}
        selectedHousingType={selectedHousingType}
        setSelectedHousingType={setSelectedHousingType}
        selectedRoomsCount={selectedRoomsCount}
        setSelectedRoomsCount={setSelectedRoomsCount}
        selectedRentalPeriod={selectedRentalPeriod}
        setSelectedRentalPeriod={setSelectedRentalPeriod}
        budget={budget}
        setBudget={setBudget}
        getCityOptions={getCityOptions}
        citiesWithDistricts={citiesWithDistricts}
        handleApplyFilters={handleApplyFilters}
        handleResetFilters={handleResetFilters}
      />

      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
        {currentRequests.map((request, index) => (
          <RequestCard
            key={request.id}
            request={request}
            index={index}
            handleSuggestClick={handleSuggestClick}
          />
        ))}
      </div>

      <RequestsPagination
        currentPage={currentPage}
        totalPages={totalPages}
        setCurrentPage={setCurrentPage}
      />
    </div>
  );
};
