import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import Icon from "@/components/ui/icon";

interface Step1Props {
  formData: {
    whoWillLive: string;
    aboutYourself: string;
    hasPets: string;
  };
  updateFormData: (field: string, value: any) => void;
  onNext: () => void;
  canProceed: boolean;
}

export const Step1AboutYourself = ({
  formData,
  updateFormData,
  onNext,
  canProceed,
}: Step1Props) => {
  return (
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
          onClick={onNext}
          disabled={!canProceed}
          size="lg"
        >
          Далее
          <Icon name="ArrowRight" size={16} className="ml-2" />
        </Button>
      </div>
    </motion.div>
  );
};
