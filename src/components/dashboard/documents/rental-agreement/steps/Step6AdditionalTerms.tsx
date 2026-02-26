import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { FormStepProps } from "../types";

export const Step6AdditionalTerms = ({ formData, updateField }: FormStepProps) => {
  return (
    <div className="space-y-4">
      <h3 className="text-xl font-semibold text-foreground mb-4">Дополнительные условия</h3>
      <div>
        <Label htmlFor="additionalConditions">Дополнительные условия (опционально)</Label>
        <Textarea
          id="additionalConditions"
          value={formData.additionalConditions}
          onChange={(e) => updateField("additionalConditions", e.target.value)}
          placeholder="Укажите дополнительные условия договора..."
          rows={6}
        />
      </div>
      <p className="text-sm text-muted-foreground">
        Заключительные положения будут добавлены автоматически при генерации договора
      </p>
    </div>
  );
};

export default Step6AdditionalTerms;
