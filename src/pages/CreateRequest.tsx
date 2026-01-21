import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { PortfolioNavbar, Footer } from "@/components/landing";
import { Button } from "@/components/ui/button";
import Icon from "@/components/ui/icon";
import { useNavigate } from "react-router-dom";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

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
      formData.moveInDate
    );
  };

  const handleSubmit = () => {
    console.log("Форма отправлена:", formData);
    navigate("/dashboard");
  };

  return (
    <div className="min-h-screen bg-background">
      <PortfolioNavbar />

      <main className="max-w-4xl mx-auto px-6 py-8 mt-20 mb-20">
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-foreground mb-2">
            Создание заявки на аренду
          </h1>
          <p className="text-lg text-muted-foreground">
            Заполните форму, чтобы получить рекомендации жилья
          </p>
        </div>

        <div className="mb-8">
          <div className="flex items-center gap-4">
            <div
              className={`flex items-center gap-2 ${
                currentStep >= 1 ? "text-primary" : "text-muted-foreground"
              }`}
            >
              <div
                className={`w-10 h-10 rounded-full flex items-center justify-center font-semibold ${
                  currentStep >= 1
                    ? "bg-primary text-white"
                    : "bg-gray-200 text-gray-500"
                }`}
              >
                1
              </div>
              <span className="font-medium hidden sm:inline">О себе</span>
            </div>
            <div
              className={`flex-1 h-1 rounded ${
                currentStep >= 2 ? "bg-primary" : "bg-gray-200"
              }`}
            />
            <div
              className={`flex items-center gap-2 ${
                currentStep >= 2 ? "text-primary" : "text-muted-foreground"
              }`}
            >
              <div
                className={`w-10 h-10 rounded-full flex items-center justify-center font-semibold ${
                  currentStep >= 2
                    ? "bg-primary text-white"
                    : "bg-gray-200 text-gray-500"
                }`}
              >
                2
              </div>
              <span className="font-medium hidden sm:inline">
                Параметры жилья
              </span>
            </div>
          </div>
        </div>

        <AnimatePresence mode="wait">
          {currentStep === 1 && (
            <motion.div
              key="step1"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.3 }}
              className="bg-white border border-border rounded-xl p-8"
            >
              <h2 className="text-2xl font-bold text-foreground mb-6">
                Шаг 1: О себе
              </h2>

              <div className="space-y-6">
                <div>
                  <label className="text-sm font-medium text-foreground mb-3 block">
                    Кто будет жить? <span className="text-red-500">*</span>
                  </label>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    {["Я один", "Пара", "Семья с детьми"].map((option) => (
                      <button
                        key={option}
                        onClick={() => updateFormData("whoWillLive", option)}
                        className={`p-4 border-2 rounded-lg text-center font-medium transition-all ${
                          formData.whoWillLive === option
                            ? "border-primary bg-primary/5 text-primary"
                            : "border-border hover:border-primary/50"
                        }`}
                      >
                        {option}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="text-sm font-medium text-foreground mb-2 block">
                    О себе <span className="text-red-500">*</span>
                  </label>
                  <textarea
                    value={formData.aboutYourself}
                    onChange={(e) =>
                      updateFormData("aboutYourself", e.target.value)
                    }
                    placeholder="Расскажите о себе: род деятельности, увлечения, образ жизни. Это поможет рекомендателям подобрать подходящее жилье."
                    className="w-full px-4 py-3 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary min-h-[120px] resize-none"
                  />
                  <p className="text-sm text-muted-foreground mt-1">
                    Минимум 20 символов ({formData.aboutYourself.length}/20)
                  </p>
                </div>

                <div>
                  <label className="text-sm font-medium text-foreground mb-3 block">
                    Есть ли животные? <span className="text-red-500">*</span>
                  </label>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    {["Нет", "Кошка", "Собака"].map((option) => (
                      <button
                        key={option}
                        onClick={() => updateFormData("hasPets", option)}
                        className={`p-4 border-2 rounded-lg text-center font-medium transition-all ${
                          formData.hasPets === option
                            ? "border-primary bg-primary/5 text-primary"
                            : "border-border hover:border-primary/50"
                        }`}
                      >
                        {option}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              <div className="flex justify-end mt-8">
                <Button
                  onClick={() => setCurrentStep(2)}
                  disabled={!canProceedStep1()}
                  size="lg"
                >
                  Далее
                  <Icon name="ArrowRight" size={16} className="ml-2" />
                </Button>
              </div>
            </motion.div>
          )}

          {currentStep === 2 && (
            <motion.div
              key="step2"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.3 }}
              className="bg-white border border-border rounded-xl p-8"
            >
              <h2 className="text-2xl font-bold text-foreground mb-6">
                Шаг 2: Параметры жилья
              </h2>

              <div className="space-y-6">
                <div>
                  <label className="text-sm font-medium text-foreground mb-2 block">
                    Город <span className="text-red-500">*</span>
                  </label>
                  <Select
                    value={formData.city}
                    onValueChange={(value) => updateFormData("city", value)}
                  >
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Выберите город" />
                    </SelectTrigger>
                    <SelectContent>
                      {cities.map((city) => (
                        <SelectItem key={city} value={city}>
                          {city}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <label className="text-sm font-medium text-foreground mb-2 block">
                    Районы/метро <span className="text-red-500">*</span>
                  </label>
                  <p className="text-sm text-muted-foreground mb-3">
                    Выберите один или несколько районов
                  </p>
                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2 max-h-[200px] overflow-y-auto p-2 border border-border rounded-lg">
                    {moscowDistricts.map((district) => (
                      <button
                        key={district}
                        onClick={() => toggleDistrict(district)}
                        className={`px-3 py-2 border rounded-lg text-sm font-medium transition-all ${
                          formData.districts.includes(district)
                            ? "border-primary bg-primary text-white"
                            : "border-border hover:border-primary"
                        }`}
                      >
                        {district}
                      </button>
                    ))}
                  </div>
                  {formData.districts.length > 0 && (
                    <p className="text-sm text-muted-foreground mt-2">
                      Выбрано: {formData.districts.length}
                    </p>
                  )}
                </div>

                <div>
                  <label className="text-sm font-medium text-foreground mb-2 block">
                    Бюджет <span className="text-red-500">*</span>
                  </label>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <input
                        type="number"
                        value={formData.budgetMin}
                        onChange={(e) =>
                          updateFormData("budgetMin", e.target.value)
                        }
                        placeholder="От"
                        className="w-full px-4 py-2 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                      />
                    </div>
                    <div>
                      <input
                        type="number"
                        value={formData.budgetMax}
                        onChange={(e) =>
                          updateFormData("budgetMax", e.target.value)
                        }
                        placeholder="До"
                        className="w-full px-4 py-2 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                      />
                    </div>
                  </div>
                  <p className="text-sm text-muted-foreground mt-1">
                    Укажите бюджет в рублях в месяц
                  </p>
                </div>

                <div className="grid sm:grid-cols-2 gap-6">
                  <div>
                    <label className="text-sm font-medium text-foreground mb-2 block">
                      Тип жилья <span className="text-red-500">*</span>
                    </label>
                    <Select
                      value={formData.housingType}
                      onValueChange={(value) =>
                        updateFormData("housingType", value)
                      }
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Выберите тип" />
                      </SelectTrigger>
                      <SelectContent>
                        {housingTypes.map((type) => (
                          <SelectItem key={type} value={type}>
                            {type}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <label className="text-sm font-medium text-foreground mb-2 block">
                      Количество комнат <span className="text-red-500">*</span>
                    </label>
                    <Select
                      value={formData.roomsCount}
                      onValueChange={(value) =>
                        updateFormData("roomsCount", value)
                      }
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Выберите" />
                      </SelectTrigger>
                      <SelectContent>
                        {roomsCounts.map((count) => (
                          <SelectItem key={count} value={count}>
                            {count}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div>
                  <label className="text-sm font-medium text-foreground mb-2 block">
                    Срок аренды <span className="text-red-500">*</span>
                  </label>
                  <Select
                    value={formData.rentalPeriod}
                    onValueChange={(value) =>
                      updateFormData("rentalPeriod", value)
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Выберите срок" />
                    </SelectTrigger>
                    <SelectContent>
                      {rentalPeriods.map((period) => (
                        <SelectItem key={period} value={period}>
                          {period}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <label className="text-sm font-medium text-foreground mb-2 block">
                    Дата заселения <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="date"
                    value={formData.moveInDate}
                    onChange={(e) =>
                      updateFormData("moveInDate", e.target.value)
                    }
                    className="w-full px-4 py-2 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                  />
                </div>
              </div>

              <div className="flex justify-between mt-8">
                <Button
                  variant="outline"
                  onClick={() => setCurrentStep(1)}
                  size="lg"
                >
                  <Icon name="ArrowLeft" size={16} className="mr-2" />
                  Назад
                </Button>
                <Button
                  onClick={handleSubmit}
                  disabled={!canProceedStep2()}
                  size="lg"
                >
                  Отправить заявку
                  <Icon name="Send" size={16} className="ml-2" />
                </Button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      <Footer />
    </div>
  );
};
