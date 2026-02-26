import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { FormStepProps } from "../types";

export const Step1GeneralInfo = ({ formData, updateField }: FormStepProps) => {
  return (
    <div className="space-y-4">
      <h3 className="text-xl font-semibold text-foreground mb-4">Общие данные</h3>
      <div>
        <Label htmlFor="contractCity">Место заключения договора (город)</Label>
        <Input
          id="contractCity"
          value={formData.contractCity}
          onChange={(e) => updateField("contractCity", e.target.value)}
          placeholder="Москва"
        />
      </div>
      <div>
        <Label htmlFor="landlordFullName">ФИО арендодателя</Label>
        <Input
          id="landlordFullName"
          value={formData.landlordFullName}
          onChange={(e) => updateField("landlordFullName", e.target.value)}
          placeholder="Иванов Иван Иванович"
        />
      </div>
      <div>
        <Label htmlFor="landlordPassport">Паспортные данные</Label>
        <Input
          id="landlordPassport"
          value={formData.landlordPassport}
          onChange={(e) => updateField("landlordPassport", e.target.value)}
          placeholder="1234 567890, выдан ..."
        />
      </div>
      <div>
        <Label htmlFor="landlordAddress">Адрес регистрации</Label>
        <Input
          id="landlordAddress"
          value={formData.landlordAddress}
          onChange={(e) => updateField("landlordAddress", e.target.value)}
          placeholder="г. Москва, ул. ..."
        />
      </div>
      <div>
        <Label htmlFor="landlordPhone">Телефон</Label>
        <Input
          id="landlordPhone"
          value={formData.landlordPhone}
          onChange={(e) => updateField("landlordPhone", e.target.value)}
          placeholder="+7 (999) 123-45-67"
        />
      </div>
    </div>
  );
};

export default Step1GeneralInfo;
