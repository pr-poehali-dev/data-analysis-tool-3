import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import Icon from "@/components/ui/icon";
import { Slider } from "@/components/ui/slider";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Combobox } from "@/components/ui/combobox";
import { useState } from "react";

interface Step2Props {
  formData: {
    city: string;
    districts: string[];
    budgetMin: string;
    budgetMax: string;
    housingType: string;
    roomsCount: string;
    rentalPeriod: string;
    moveInDate: string;
    reward: number;
  };
  updateFormData: (field: string, value: any) => void;
  toggleDistrict: (district: string) => void;
  onBack: () => void;
  onSubmit: () => void;
  canProceed: boolean;
  citiesWithDistricts: Record<string, string[]>;
  getSortedCities: () => string[];
  housingTypes: string[];
  roomsCounts: string[];
  rentalPeriods: string[];
}

export const Step2HousingParameters = ({
  formData,
  updateFormData,
  toggleDistrict,
  onBack,
  onSubmit,
  canProceed,
  citiesWithDistricts,
  getSortedCities,
  housingTypes,
  roomsCounts,
  rentalPeriods,
}: Step2Props) => {
  const [rewardError, setRewardError] = useState<string>("");
  const [budgetError, setBudgetError] = useState<string>("");

  const getCityOptions = () => {
    return getSortedCities().map(city => ({
      value: city,
      label: city
    }));
  };

  const validateReward = (value: number) => {
    if (value < 3000) {
      setRewardError("Минимальная сумма вознаграждения — 3 000 ₽");
      return false;
    } else if (value > 50000) {
      setRewardError("Максимальная сумма вознаграждения — 50 000 ₽");
      return false;
    } else {
      setRewardError("");
      return true;
    }
  };

  const validateBudget = (min: string, max: string) => {
    if (min === "" || max === "") {
      setBudgetError("");
      return true;
    }
    const minValue = parseInt(min);
    const maxValue = parseInt(max);
    if (isNaN(minValue) || isNaN(maxValue)) {
      setBudgetError("");
      return true;
    }
    if (minValue >= maxValue) {
      setBudgetError("Значение «От» должно быть меньше значения «До»");
      return false;
    }
    setBudgetError("");
    return true;
  };

  const currentDistricts = formData.city ? citiesWithDistricts[formData.city] || [] : [];
  return (
    <motion.div
      key="step2"
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
      transition={{ duration: 0.3 }}
      className="bg-white border border-border rounded-xl p-4 sm:p-8"
    >
      <h2 className="text-xl sm:text-2xl font-bold text-foreground mb-4 sm:mb-6">
        Шаг 2: Параметры жилья
      </h2>

      <div className="space-y-4 sm:space-y-6">
        <div>
          <label className="text-sm font-medium text-foreground mb-2 block">
            Город <span className="text-red-500">*</span>
          </label>
          <Combobox
            value={formData.city}
            onValueChange={(value) => {
              updateFormData("city", value);
              updateFormData("districts", []);
            }}
            options={getCityOptions()}
            placeholder="Выберите город"
            searchPlaceholder="Поиск города..."
            emptyText="Город не найден"
          />
        </div>

        <div>
          <label className="text-sm font-medium text-foreground mb-2 block">
            Районы/Округа <span className="text-red-500">*</span>
          </label>
          <p className="text-sm text-muted-foreground mb-3">
            Выберите один или несколько районов
          </p>
          {currentDistricts.length > 0 ? (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2 max-h-[200px] overflow-y-auto p-2 border border-border rounded-lg">
              {currentDistricts.map((district) => (
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
          ) : (
            <p className="text-sm text-muted-foreground p-4 border border-border rounded-lg bg-gray-50">
              {formData.city ? "Для этого города районы не указаны" : "Сначала выберите город"}
            </p>
          )}
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
                onChange={(e) => {
                  const value = e.target.value;
                  updateFormData("budgetMin", value);
                  validateBudget(value, formData.budgetMax);
                }}
                placeholder="От"
                className={`w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 ${
                  budgetError
                    ? "border-red-500 focus:ring-red-500"
                    : "border-border focus:ring-primary"
                }`}
              />
            </div>
            <div>
              <input
                type="number"
                value={formData.budgetMax}
                onChange={(e) => {
                  const value = e.target.value;
                  updateFormData("budgetMax", value);
                  validateBudget(formData.budgetMin, value);
                }}
                placeholder="До"
                className={`w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 ${
                  budgetError
                    ? "border-red-500 focus:ring-red-500"
                    : "border-border focus:ring-primary"
                }`}
              />
            </div>
          </div>
          {budgetError ? (
            <p className="text-xs text-red-500 mt-1 flex items-center gap-1">
              <Icon name="AlertCircle" size={12} />
              {budgetError}
            </p>
          ) : (
            <p className="text-sm text-muted-foreground mt-1">
              Укажите бюджет в рублях в месяц
            </p>
          )}
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
                    {count === "4+" ? "Более" : count}
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

        <div className="border-t border-border pt-4 sm:pt-6">
          <label className="text-sm font-medium text-foreground mb-3 block">
            Вознаграждение рекомендателю <span className="text-red-500">*</span>
          </label>
          <p className="text-sm text-muted-foreground mb-4">
            Укажите сумму, которую вы готовы заплатить рекомендателю за успешный подбор жилья
          </p>
          <div className="bg-gray-50 border border-border rounded-lg p-6">
            <div className="flex items-center justify-between mb-4">
              <span className="text-2xl font-bold text-primary">
                {formData.reward.toLocaleString('ru-RU')} ₽
              </span>
              <span className="text-sm text-muted-foreground">
                Минимум: 3 000 ₽
              </span>
            </div>
            <Slider
              value={[formData.reward]}
              onValueChange={(value) => {
                updateFormData("reward", value[0]);
                setRewardError("");
              }}
              min={3000}
              max={50000}
              step={1000}
              className="mb-4"
            />
            <div className="flex justify-between text-xs text-muted-foreground mb-4">
              <span>3 000 ₽</span>
              <span>50 000 ₽</span>
            </div>
            <div className="mt-4">
              <label className="text-xs text-muted-foreground mb-1 block">
                Или введите сумму вручную
              </label>
              <input
                type="text"
                value={formData.reward === 0 ? '' : formData.reward}
                onChange={(e) => {
                  const inputValue = e.target.value;
                  if (inputValue === '') {
                    updateFormData("reward", 0);
                    setRewardError("Минимальная сумма вознаграждения — 3 000 ₽");
                  } else {
                    const value = parseInt(inputValue);
                    if (!isNaN(value)) {
                      updateFormData("reward", value);
                      validateReward(value);
                    }
                  }
                }}
                placeholder="Введите сумму"
                className={`w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 ${
                  rewardError 
                    ? 'border-red-500 focus:ring-red-500' 
                    : 'border-border focus:ring-primary'
                }`}
              />
              {rewardError && (
                <p className="text-xs text-red-500 mt-1 flex items-center gap-1">
                  <Icon name="AlertCircle" size={12} />
                  {rewardError}
                </p>
              )}
            </div>
          </div>
          <p className="text-xs text-muted-foreground mt-3">
            Чем выше вознаграждение, тем больше рекомендателей заинтересуются вашей заявкой
          </p>
        </div>
      </div>

      <div className="flex flex-col sm:flex-row justify-between gap-3 sm:gap-4 mt-6 sm:mt-8">
        <Button
          onClick={onBack}
          variant="outline"
          size="lg"
          className="w-full sm:w-auto"
        >
          <Icon name="ArrowLeft" size={16} className="mr-2" />
          Назад
        </Button>
        <Button
          onClick={onSubmit}
          disabled={!canProceed}
          size="lg"
          className="w-full sm:w-auto"
        >
          Создать заявку
          <Icon name="Check" size={16} className="ml-2" />
        </Button>
      </div>
    </motion.div>
  );
};