import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { FormStepProps } from "../types";

export const Step4LivingConditions = ({ formData, updateField }: FormStepProps) => {
  return (
    <div className="space-y-4">
      <h3 className="text-xl font-semibold text-foreground mb-4">Условия проживания</h3>
      <div>
        <Label htmlFor="residentsCount">Количество проживающих (чел.)</Label>
        <Input
          id="residentsCount"
          type="number"
          min="1"
          value={formData.residentsCount}
          onChange={(e) => updateField("residentsCount", e.target.value)}
          placeholder="1"
        />
      </div>
      <div>
        <Label htmlFor="residentsInfo">Информация о проживающих (опционально)</Label>
        <Textarea
          id="residentsInfo"
          value={formData.residentsInfo}
          onChange={(e) => updateField("residentsInfo", e.target.value)}
          placeholder="Укажите ФИО и паспортные данные проживающих..."
          rows={3}
        />
      </div>
      <div>
        <Label htmlFor="petsAllowed">Содержание домашних животных</Label>
        <Select value={formData.petsAllowed} onValueChange={(value) => updateField("petsAllowed", value)}>
          <SelectTrigger id="petsAllowed">
            <SelectValue placeholder="Выберите вариант" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="not-allowed">Запрещено</SelectItem>
            <SelectItem value="allowed">Разрешено</SelectItem>
            <SelectItem value="with-agreement">По согласованию с арендодателем</SelectItem>
          </SelectContent>
        </Select>
      </div>
      <div>
        <Label htmlFor="propertyInventory">Перечень имущества в квартире</Label>
        <Textarea
          id="propertyInventory"
          value={formData.propertyInventory}
          onChange={(e) => updateField("propertyInventory", e.target.value)}
          placeholder="Например: холодильник, стиральная машина, диван, кровать, телевизор..."
          rows={4}
        />
      </div>
    </div>
  );
};

export default Step4LivingConditions;
