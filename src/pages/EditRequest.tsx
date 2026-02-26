import { useState, useEffect } from "react";
import { AnimatePresence } from "framer-motion";
import { PortfolioNavbar, Footer } from "@/components/landing";
import { useNavigate, useParams } from "react-router-dom";
import Icon from "@/components/ui/icon";
import { requestsStore } from "@/store/requestsStore";
import { authStore } from "@/store/authStore";
import { StepIndicator } from "@/components/request/StepIndicator";
import { Step1AboutYourself } from "@/components/request/Step1AboutYourself";
import { Step2HousingParameters } from "@/components/request/Step2HousingParameters";
import { useToast } from "@/hooks/use-toast";

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

const cities = [
  "Москва",
  "Санкт-Петербург",
  "Новосибирск",
  "Екатеринбург",
  "Казань",
  "Нижний Новгород",
  "Челябинск",
  "Самара",
  "Омск",
  "Ростов-на-Дону",
];

const moscowDistricts = [
  "ЦАО",
  "САО",
  "СВАО",
  "ВАО",
  "ЮВАО",
  "ЮАО",
  "ЮЗАО",
  "ЗАО",
  "СЗАО",
  "Зеленоград",
  "Новомосковский",
  "Троицкий",
];

const housingTypes = [
  "Квартира",
  "Студия",
  "Комната",
  "Дом",
  "Таунхаус",
];

const roomsCounts = ["Студия", "1", "2", "3", "4+"];

const rentalPeriods = [
  "1-3 месяца",
  "3-6 месяцев",
  "6-12 месяцев",
  "Более года",
];

export const EditRequest = () => {
  const navigate = useNavigate();
  const { requestId } = useParams<{ requestId: string }>();
  const { toast } = useToast();
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

  useEffect(() => {
    if (!requestId) {
      navigate("/dashboard");
      return;
    }

    const loadRequest = async () => {
      let request = requestsStore.getRequestById(requestId);
      if (!request) {
        request = await requestsStore.fetchRequestById(requestId);
      }
      if (!request) {
        toast({
          title: "Ошибка",
          description: "Заявка не найдена",
          variant: "destructive",
        });
        navigate("/dashboard");
        return;
      }

      const user = authStore.getUser();
      if (!user || (request.userId !== user.email && request.userEmail !== user.email)) {
        toast({
          title: "Ошибка",
          description: "У вас нет прав для редактирования этой заявки",
          variant: "destructive",
        });
        navigate("/dashboard");
        return;
      }

      setFormData({
        whoWillLive: request.whoWillLive,
        aboutYourself: request.aboutYourself,
        hasPets: request.hasPets,
        city: request.city,
        districts: request.districts,
        budgetMin: request.budgetMin,
        budgetMax: request.budgetMax,
        housingType: request.housingType,
        roomsCount: request.roomsCount,
        rentalPeriod: request.rentalPeriod,
        moveInDate: request.moveInDate,
        reward: parseInt(request.reward.replace(/[^\d]/g, '')),
      });
    };

    loadRequest();
  }, [requestId, navigate, toast]);

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
      formData.moveInDate &&
      formData.reward >= 3000
    );
  };

  const handleSubmit = async () => {
    if (!requestId) return;

    const districtsText = formData.districts.join(", ");
    
    await requestsStore.updateRequest(requestId, {
      location: `${formData.city}, ${districtsText}`,
      budget: `${parseInt(formData.budgetMin).toLocaleString('ru-RU')} - ${parseInt(formData.budgetMax).toLocaleString('ru-RU')} ₽`,
      reward: `${formData.reward.toLocaleString('ru-RU')} ₽`,
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

    toast({
      title: "Успешно",
      description: "Заявка обновлена",
    });

    navigate("/dashboard");
  };

  return (
    <div className="min-h-screen bg-background">
      <PortfolioNavbar onLogout={() => navigate("/")} showNavigation={false} />

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
            Редактирование заявки
          </h1>
          <p className="text-sm sm:text-lg text-muted-foreground">
            Внесите необходимые изменения в заявку
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
              cities={cities}
              moscowDistricts={moscowDistricts}
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