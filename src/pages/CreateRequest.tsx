import { useState } from "react";
import { AnimatePresence } from "framer-motion";
import { PortfolioNavbar, Footer } from "@/components/landing";
import { useNavigate } from "react-router-dom";
import Icon from "@/components/ui/icon";
import { requestsStore } from "@/store/requestsStore";
import { authStore } from "@/store/authStore";
import { StepIndicator } from "@/components/request/StepIndicator";
import { Step1AboutYourself } from "@/components/request/Step1AboutYourself";
import { Step2HousingParameters } from "@/components/request/Step2HousingParameters";

interface RequestFormData {
  whoWillLive: string;
  aboutYourself: string;
  hasPets: string;
  city: string;
  districts: string[];
  budgetMin: string;
  budgetMax: string;
  housingType: string;
  roomsCount: string;
  rentalPeriod: string;
  moveInDate: string;
  reward: number;
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

const getSortedCities = () => {
  const priorityCities = ["Москва", "Московская область", "Санкт-Петербург", "Ленинградская область"];
  const allCities = Object.keys(citiesWithDistricts);
  const otherCities = allCities
    .filter(city => !priorityCities.includes(city))
    .sort((a, b) => a.localeCompare(b, 'ru'));
  return [...priorityCities, ...otherCities];
};

const housingTypes = [
  "Квартира",
  "Студия",
  "Комната",
  "Дом",
];

const roomsCounts = ["1", "2", "3", "4", "4+"];

const rentalPeriods = [
  "1-3 месяца",
  "3-6 месяцев",
  "6-12 месяцев",
  "Более года",
];

export const CreateRequest = () => {
  const navigate = useNavigate();
  const [currentStep, setCurrentStep] = useState(1);
  const [formData, setFormData] = useState<RequestFormData>({
    whoWillLive: "",
    aboutYourself: "",
    hasPets: "",
    city: "",
    districts: [],
    budgetMin: "",
    budgetMax: "",
    housingType: "",
    roomsCount: "",
    rentalPeriod: "",
    moveInDate: "",
    reward: 10000,
  });

  const updateFormData = (field: keyof RequestFormData, value: any) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const toggleDistrict = (district: string) => {
    setFormData((prev) => ({
      ...prev,
      districts: prev.districts.includes(district)
        ? prev.districts.filter((d) => d !== district)
        : [...prev.districts, district],
    }));
  };

  const canProceedStep1 = () => {
    return (
      formData.whoWillLive &&
      formData.aboutYourself.trim().length >= 20 &&
      formData.hasPets
    );
  };

  const canProceedStep2 = () => {
    return (
      formData.city &&
      formData.districts.length > 0 &&
      formData.budgetMin &&
      formData.budgetMax &&
      formData.housingType &&
      formData.roomsCount &&
      formData.rentalPeriod &&
      formData.reward >= 3000
    );
  };

  const handleSubmit = async () => {
    const districtsText = formData.districts.join(", ");
    const user = authStore.getUser();
    const userId = user?.email || `user_${Date.now()}`;
    
    await requestsStore.addRequest({
      userId,
      name: user ? `${user.firstName} ${user.lastName}` : "Вы",
      avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=NewUser",
      location: `${formData.city}, ${districtsText}`,
      budget: `${parseInt(formData.budgetMin).toLocaleString('ru-RU')} - ${parseInt(formData.budgetMax).toLocaleString('ru-RU')} ₽`,
      reward: `${formData.reward.toLocaleString('ru-RU')} ₽`,
      bonus: "",
      whoWillLive: formData.whoWillLive,
      aboutYourself: formData.aboutYourself,
      hasPets: formData.hasPets,
      city: formData.city,
      districts: formData.districts,
      budgetMin: formData.budgetMin,
      budgetMax: formData.budgetMax,
      housingType: formData.housingType,
      roomsCount: formData.roomsCount,
      rentalPeriod: formData.rentalPeriod,
      moveInDate: formData.moveInDate,
    });

    navigate("/feed");
  };

  return (
    <div className="min-h-screen bg-background">
      <PortfolioNavbar onLogout={() => navigate("/")} showNavigation={false} showMobileMenu={false} />

      <main className="max-w-4xl mx-auto px-4 sm:px-6 py-6 sm:py-8 mt-20 mb-20">
        <button
          onClick={() => navigate("/dashboard", { state: { activeSection: "requests" } })}
          className="inline-flex items-center gap-1.5 text-sm font-medium text-foreground border border-border rounded-lg px-3 py-2 hover:bg-gray-100 transition-colors mb-4"
        >
          <Icon name="ArrowLeft" size={16} />
          Назад к заявкам
        </button>

        <div className="mb-8">
          <h1 className="text-2xl sm:text-4xl font-bold text-foreground mb-2">
            Создание заявки на аренду
          </h1>
          <p className="text-sm sm:text-lg text-muted-foreground">
            Заполните форму, чтобы получить рекомендации жилья
          </p>
        </div>

        <StepIndicator currentStep={currentStep} />

        <AnimatePresence mode="wait">
          {currentStep === 1 && (
            <Step1AboutYourself
              formData={formData}
              updateFormData={updateFormData}
              onNext={() => setCurrentStep(2)}
              canProceed={canProceedStep1()}
            />
          )}

          {currentStep === 2 && (
            <Step2HousingParameters
              formData={formData}
              updateFormData={updateFormData}
              toggleDistrict={toggleDistrict}
              onBack={() => setCurrentStep(1)}
              onSubmit={handleSubmit}
              canProceed={canProceedStep2()}
              citiesWithDistricts={citiesWithDistricts}
              getSortedCities={getSortedCities}
              housingTypes={housingTypes}
              roomsCounts={roomsCounts}
              rentalPeriods={rentalPeriods}
            />
          )}
        </AnimatePresence>
      </main>

      <Footer hiddenOnMobile />
    </div>
  );
};