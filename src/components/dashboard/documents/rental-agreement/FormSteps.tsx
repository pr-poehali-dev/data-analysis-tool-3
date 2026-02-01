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
import { RentalAgreementData } from "./types";

interface FormStepsProps {
  step: number;
  formData: RentalAgreementData;
  updateField: (field: keyof RentalAgreementData, value: string | boolean) => void;
}

export const FormSteps = ({ step, formData, updateField }: FormStepsProps) => {
  switch (step) {
    case 1:
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

    case 2:
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

    case 3:
      return (
        <div className="space-y-4">
          <h3 className="text-xl font-semibold text-foreground mb-4">Объект аренды</h3>
          <div>
            <Label htmlFor="propertyType">Тип жилья</Label>
            <Select value={formData.propertyType} onValueChange={(value) => updateField("propertyType", value)}>
              <SelectTrigger id="propertyType">
                <SelectValue placeholder="Выберите тип жилья" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="apartment">Квартира</SelectItem>
                <SelectItem value="room">Комната</SelectItem>
                <SelectItem value="house">Дом</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label htmlFor="propertyAddress">Адрес объекта</Label>
            <Input
              id="propertyAddress"
              value={formData.propertyAddress}
              onChange={(e) => updateField("propertyAddress", e.target.value)}
              placeholder="г. Москва, ул. Ленина, д. 1, кв. 1"
            />
          </div>
          <div className="grid grid-cols-3 gap-4">
            <div>
              <Label htmlFor="propertyArea">Площадь (кв.м)</Label>
              <Input
                id="propertyArea"
                value={formData.propertyArea}
                onChange={(e) => updateField("propertyArea", e.target.value)}
                placeholder="50"
              />
            </div>
            <div>
              <Label htmlFor="propertyRooms">Комнат</Label>
              <Input
                id="propertyRooms"
                value={formData.propertyRooms}
                onChange={(e) => updateField("propertyRooms", e.target.value)}
                placeholder="2"
              />
            </div>
            <div>
              <Label htmlFor="propertyFloor">Этаж</Label>
              <Input
                id="propertyFloor"
                value={formData.propertyFloor}
                onChange={(e) => updateField("propertyFloor", e.target.value)}
                placeholder="5"
              />
            </div>
          </div>
        </div>
      );

    case 4:
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

    case 5:
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

    case 6:
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

    default:
      return null;
  }
};