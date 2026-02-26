import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { FormStepProps } from "../types";

export const Step2TenantInfo = ({ formData, updateField }: FormStepProps) => {
  return (
    <div className="space-y-4">
      <h3 className="text-xl font-semibold text-foreground mb-4">Данные арендатора</h3>
      <div>
        <Label htmlFor="tenantFullName">ФИО арендатора</Label>
        <Input
          id="tenantFullName"
          value={formData.tenantFullName}
          onChange={(e) => updateField("tenantFullName", e.target.value)}
          placeholder="Петров Петр Петрович"
        />
      </div>
      <div>
        <Label htmlFor="tenantPassport">Паспортные данные</Label>
        <Input
          id="tenantPassport"
          value={formData.tenantPassport}
          onChange={(e) => updateField("tenantPassport", e.target.value)}
          placeholder="1234 567890, выдан ..."
        />
      </div>
      <div>
        <Label htmlFor="tenantAddress">Адрес регистрации</Label>
        <Input
          id="tenantAddress"
          value={formData.tenantAddress}
          onChange={(e) => updateField("tenantAddress", e.target.value)}
          placeholder="г. Москва, ул. ..."
        />
      </div>
      <div>
        <Label htmlFor="tenantPhone">Телефон</Label>
        <Input
          id="tenantPhone"
          value={formData.tenantPhone}
          onChange={(e) => updateField("tenantPhone", e.target.value)}
          placeholder="+7 (999) 123-45-67"
        />
      </div>
    </div>
  );
};

export default Step2TenantInfo;
