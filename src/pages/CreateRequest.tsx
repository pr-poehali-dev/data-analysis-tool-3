import { useState } from "react";
import { AnimatePresence } from "framer-motion";
import { PortfolioNavbar, Footer } from "@/components/landing";
import { useNavigate } from "react-router-dom";
import { requestsStore } from "@/store/requestsStore";
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
      formData.moveInDate &&
      formData.reward >= 3000
    );
  };

  const handleSubmit = () => {
    const districtsText = formData.districts.join(", ");
    
    requestsStore.addRequest({
      name: "Вы",
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
      <PortfolioNavbar onLogout={() => navigate("/")} />

      <main className="max-w-4xl mx-auto px-6 py-8 mt-20 mb-20">
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-foreground mb-2">
            Создание заявки на аренду
          </h1>
          <p className="text-lg text-muted-foreground">
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
              cities={cities}
              moscowDistricts={moscowDistricts}
              housingTypes={housingTypes}
              roomsCounts={roomsCounts}
              rentalPeriods={rentalPeriods}
            />
          )}
        </AnimatePresence>
      </main>

      <Footer />
    </div>
  );
};
