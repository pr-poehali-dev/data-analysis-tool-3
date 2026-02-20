import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Icon from "@/components/ui/icon";
import { Button } from "@/components/ui/button";
import { RentalAgreementData, initialData } from "./rental-agreement/types";
import { FormSteps } from "./rental-agreement/FormSteps";
import { PreviewModal } from "./rental-agreement/PreviewModal";

interface RentalAgreementConstructorProps {
  documentId?: string;
  initialFormData?: RentalAgreementData;
  onDocumentSaved?: (id: string) => void;
}

export const RentalAgreementConstructor = ({ documentId, initialFormData, onDocumentSaved }: RentalAgreementConstructorProps) => {
  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState<RentalAgreementData>(initialFormData || initialData);
  const [isPreview, setIsPreview] = useState(false);

  const totalSteps = 6;

  const updateField = (field: keyof RentalAgreementData, value: string | boolean) => {
    setFormData({ ...formData, [field]: value });
  };

  const handleReset = () => {
    setFormData(initialData);
    setStep(1);
    setIsPreview(false);
  };

  if (isPreview) {
    return (
      <PreviewModal
        formData={formData}
        onEdit={() => setIsPreview(false)}
        onReset={handleReset}
        documentId={documentId}
        onDocumentSaved={onDocumentSaved}
      />
    );
  }

  return (
    <div className="bg-white border border-border rounded-xl p-4 sm:p-8">
      <div className="mb-4 sm:mb-6">
        <h3 className="text-xl sm:text-2xl font-bold text-foreground mb-2">Конструктор договора аренды</h3>
        <p className="text-sm text-muted-foreground">
          Заполните все поля для автоматического создания договора
        </p>
      </div>

      <div className="mb-6 sm:mb-8">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm font-medium text-foreground">
            Шаг {step} из {totalSteps}
          </span>
          <span className="text-sm text-muted-foreground">
            {Math.round((step / totalSteps) * 100)}%
          </span>
        </div>
        <div className="w-full bg-gray-200 rounded-full h-2">
          <div
            className="bg-primary h-2 rounded-full transition-all duration-300"
            style={{ width: `${(step / totalSteps) * 100}%` }}
          />
        </div>
      </div>

      <AnimatePresence mode="wait">
        <motion.div
          key={step}
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -20 }}
          transition={{ duration: 0.3 }}
        >
          <FormSteps step={step} formData={formData} updateField={updateField} />
        </motion.div>
      </AnimatePresence>

      <div className="flex gap-3 sm:gap-4 mt-6 sm:mt-8 pt-4 sm:pt-6 border-t border-border">
        {step > 1 && (
          <Button variant="outline" onClick={() => setStep(step - 1)}>
            <Icon name="ChevronLeft" size={16} className="mr-2" />
            Назад
          </Button>
        )}
        {step < totalSteps ? (
          <Button onClick={() => setStep(step + 1)} className="ml-auto">
            Далее
            <Icon name="ChevronRight" size={16} className="mr-2" />
          </Button>
        ) : (
          <Button onClick={() => setIsPreview(true)} className="ml-auto">
            <Icon name="Eye" size={16} className="mr-2" />
            Предпросмотр
          </Button>
        )}
      </div>
    </div>
  );
};