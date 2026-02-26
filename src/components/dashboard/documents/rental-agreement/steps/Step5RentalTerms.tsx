import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { FormStepProps } from "../types";

export const Step5RentalTerms = ({ formData, updateField }: FormStepProps) => {
  return (
    <div className="space-y-4">
      <h3 className="text-xl font-semibold text-foreground mb-4">Условия аренды</h3>
      <div>
        <Label htmlFor="rentalPrice">Арендная плата (₽/мес)</Label>
        <Input
          id="rentalPrice"
          value={formData.rentalPrice}
          onChange={(e) => updateField("rentalPrice", e.target.value)}
          placeholder="30000"
        />
      </div>
      <div>
        <Label htmlFor="securityDeposit">Обеспечительный платеж (₽)</Label>
        <Input
          id="securityDeposit"
          value={formData.securityDeposit}
          onChange={(e) => updateField("securityDeposit", e.target.value)}
          placeholder="30000"
        />
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label htmlFor="contractStartDate">Дата начала</Label>
          <Input
            id="contractStartDate"
            type="date"
            value={formData.contractStartDate}
            onChange={(e) => updateField("contractStartDate", e.target.value)}
          />
        </div>
        <div>
          <Label htmlFor="contractEndDate">Дата окончания</Label>
          <Input
            id="contractEndDate"
            type="date"
            value={formData.contractEndDate}
            onChange={(e) => updateField("contractEndDate", e.target.value)}
          />
        </div>
      </div>
      <div className="flex items-center gap-2">
        <input
          type="checkbox"
          id="utilitiesIncluded"
          checked={formData.utilitiesIncluded}
          onChange={(e) => updateField("utilitiesIncluded", e.target.checked)}
          className="w-4 h-4"
        />
        <Label htmlFor="utilitiesIncluded" className="cursor-pointer">
          Коммунальные услуги включены в стоимость
        </Label>
      </div>
    </div>
  );
};

export default Step5RentalTerms;
