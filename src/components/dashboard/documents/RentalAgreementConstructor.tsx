import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Icon from "@/components/ui/icon";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { jsPDF } from "jspdf";

interface RentalAgreementData {
  landlordFullName: string;
  landlordPassport: string;
  landlordAddress: string;
  landlordPhone: string;
  tenantFullName: string;
  tenantPassport: string;
  tenantAddress: string;
  tenantPhone: string;
  propertyAddress: string;
  propertyArea: string;
  propertyRooms: string;
  propertyFloor: string;
  rentalPrice: string;
  securityDeposit: string;
  contractStartDate: string;
  contractEndDate: string;
  utilitiesIncluded: boolean;
  additionalConditions: string;
}

const initialData: RentalAgreementData = {
  landlordFullName: "",
  landlordPassport: "",
  landlordAddress: "",
  landlordPhone: "",
  tenantFullName: "",
  tenantPassport: "",
  tenantAddress: "",
  tenantPhone: "",
  propertyAddress: "",
  propertyArea: "",
  propertyRooms: "",
  propertyFloor: "",
  rentalPrice: "",
  securityDeposit: "",
  contractStartDate: "",
  contractEndDate: "",
  utilitiesIncluded: false,
  additionalConditions: "",
};

export const RentalAgreementConstructor = () => {
  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState<RentalAgreementData>(initialData);
  const [isPreview, setIsPreview] = useState(false);

  const totalSteps = 4;

  const updateField = (field: keyof RentalAgreementData, value: string | boolean) => {
    setFormData({ ...formData, [field]: value });
  };

  const generatePDF = () => {
    const doc = new jsPDF();
    let y = 20;

    doc.setFont("helvetica", "bold");
    doc.setFontSize(16);
    doc.text("ДОГОВОР АРЕНДЫ ЖИЛОГО ПОМЕЩЕНИЯ", 105, y, { align: "center" });
    y += 15;

    doc.setFontSize(10);
    doc.setFont("helvetica", "normal");
    doc.text(`г. ${new Date().toLocaleDateString("ru-RU")}`, 105, y, { align: "center" });
    y += 15;

    doc.setFontSize(11);
    doc.text(`Арендодатель: ${formData.landlordFullName}`, 20, y);
    y += 7;
    doc.text(`Паспорт: ${formData.landlordPassport}`, 20, y);
    y += 7;
    doc.text(`Адрес: ${formData.landlordAddress}`, 20, y);
    y += 7;
    doc.text(`Телефон: ${formData.landlordPhone}`, 20, y);
    y += 12;

    doc.text(`Арендатор: ${formData.tenantFullName}`, 20, y);
    y += 7;
    doc.text(`Паспорт: ${formData.tenantPassport}`, 20, y);
    y += 7;
    doc.text(`Адрес: ${formData.tenantAddress}`, 20, y);
    y += 7;
    doc.text(`Телефон: ${formData.tenantPhone}`, 20, y);
    y += 15;

    doc.setFont("helvetica", "bold");
    doc.text("1. ПРЕДМЕТ ДОГОВОРА", 20, y);
    y += 7;
    doc.setFont("helvetica", "normal");
    doc.text(`Арендодатель передает, а Арендатор принимает во временное владение`, 20, y);
    y += 5;
    doc.text(`и пользование жилое помещение, расположенное по адресу:`, 20, y);
    y += 7;
    doc.text(`${formData.propertyAddress}`, 20, y);
    y += 7;
    doc.text(`Площадь: ${formData.propertyArea} кв.м, количество комнат: ${formData.propertyRooms}, этаж: ${formData.propertyFloor}`, 20, y);
    y += 12;

    doc.setFont("helvetica", "bold");
    doc.text("2. СРОК ДЕЙСТВИЯ ДОГОВОРА", 20, y);
    y += 7;
    doc.setFont("helvetica", "normal");
    doc.text(`Договор действует с ${formData.contractStartDate} по ${formData.contractEndDate}`, 20, y);
    y += 12;

    doc.setFont("helvetica", "bold");
    doc.text("3. АРЕНДНАЯ ПЛАТА", 20, y);
    y += 7;
    doc.setFont("helvetica", "normal");
    doc.text(`Размер арендной платы составляет ${formData.rentalPrice} рублей в месяц.`, 20, y);
    y += 7;
    doc.text(`Обеспечительный платеж: ${formData.securityDeposit} рублей.`, 20, y);
    y += 7;
    doc.text(`Коммунальные услуги: ${formData.utilitiesIncluded ? "включены в стоимость" : "оплачиваются отдельно"}`, 20, y);
    y += 12;

    if (formData.additionalConditions) {
      doc.setFont("helvetica", "bold");
      doc.text("4. ДОПОЛНИТЕЛЬНЫЕ УСЛОВИЯ", 20, y);
      y += 7;
      doc.setFont("helvetica", "normal");
      const lines = doc.splitTextToSize(formData.additionalConditions, 170);
      lines.forEach((line: string) => {
        if (y > 270) {
          doc.addPage();
          y = 20;
        }
        doc.text(line, 20, y);
        y += 5;
      });
    }

    if (y > 250) {
      doc.addPage();
      y = 20;
    } else {
      y += 15;
    }

    doc.setFont("helvetica", "bold");
    doc.text("ПОДПИСИ СТОРОН:", 20, y);
    y += 15;

    doc.setFont("helvetica", "normal");
    doc.text("Арендодатель: _______________", 20, y);
    doc.text("Арендатор: _______________", 120, y);

    doc.save("Договор_аренды.pdf");
  };

  const renderStep = () => {
    switch (step) {
      case 1:
        return (
          <div className="space-y-4">
            <h3 className="text-xl font-semibold text-foreground mb-4">Данные арендодателя</h3>
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
            <div>
              <Label htmlFor="additionalConditions">Дополнительные условия (опционально)</Label>
              <Textarea
                id="additionalConditions"
                value={formData.additionalConditions}
                onChange={(e) => updateField("additionalConditions", e.target.value)}
                placeholder="Укажите дополнительные условия договора..."
                rows={4}
              />
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  if (isPreview) {
    return (
      <div className="bg-white border border-border rounded-xl p-8">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-2xl font-bold text-foreground">Предварительный просмотр</h3>
          <Button variant="outline" onClick={() => setIsPreview(false)}>
            <Icon name="Edit" size={16} className="mr-2" />
            Редактировать
          </Button>
        </div>

        <div className="prose max-w-none mb-8 p-6 bg-gray-50 rounded-lg">
          <h2 className="text-center font-bold mb-4">ДОГОВОР АРЕНДЫ ЖИЛОГО ПОМЕЩЕНИЯ</h2>
          <p className="text-center text-sm mb-6">г. {new Date().toLocaleDateString("ru-RU")}</p>

          <div className="mb-4">
            <p><strong>Арендодатель:</strong> {formData.landlordFullName}</p>
            <p className="text-sm">Паспорт: {formData.landlordPassport}</p>
            <p className="text-sm">Адрес: {formData.landlordAddress}</p>
            <p className="text-sm">Телефон: {formData.landlordPhone}</p>
          </div>

          <div className="mb-4">
            <p><strong>Арендатор:</strong> {formData.tenantFullName}</p>
            <p className="text-sm">Паспорт: {formData.tenantPassport}</p>
            <p className="text-sm">Адрес: {formData.tenantAddress}</p>
            <p className="text-sm">Телефон: {formData.tenantPhone}</p>
          </div>

          <h3 className="font-bold mt-6 mb-2">1. ПРЕДМЕТ ДОГОВОРА</h3>
          <p className="text-sm">
            Арендодатель передает, а Арендатор принимает во временное владение и пользование жилое помещение, 
            расположенное по адресу: {formData.propertyAddress}. 
            Площадь: {formData.propertyArea} кв.м, количество комнат: {formData.propertyRooms}, этаж: {formData.propertyFloor}.
          </p>

          <h3 className="font-bold mt-6 mb-2">2. СРОК ДЕЙСТВИЯ ДОГОВОРА</h3>
          <p className="text-sm">
            Договор действует с {formData.contractStartDate} по {formData.contractEndDate}.
          </p>

          <h3 className="font-bold mt-6 mb-2">3. АРЕНДНАЯ ПЛАТА</h3>
          <p className="text-sm">
            Размер арендной платы составляет {formData.rentalPrice} рублей в месяц.<br />
            Обеспечительный платеж: {formData.securityDeposit} рублей.<br />
            Коммунальные услуги: {formData.utilitiesIncluded ? "включены в стоимость" : "оплачиваются отдельно"}.
          </p>

          {formData.additionalConditions && (
            <>
              <h3 className="font-bold mt-6 mb-2">4. ДОПОЛНИТЕЛЬНЫЕ УСЛОВИЯ</h3>
              <p className="text-sm whitespace-pre-wrap">{formData.additionalConditions}</p>
            </>
          )}

          <div className="mt-8 pt-6 border-t border-border">
            <p className="font-bold mb-4">ПОДПИСИ СТОРОН:</p>
            <div className="flex justify-between">
              <p>Арендодатель: _______________</p>
              <p>Арендатор: _______________</p>
            </div>
          </div>
        </div>

        <div className="flex gap-4">
          <Button onClick={generatePDF} className="flex-1">
            <Icon name="Download" size={16} className="mr-2" />
            Скачать PDF
          </Button>
          <Button variant="outline" onClick={() => setFormData(initialData)}>
            <Icon name="RotateCcw" size={16} className="mr-2" />
            Начать заново
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white border border-border rounded-xl p-8">
      <div className="mb-6">
        <h3 className="text-2xl font-bold text-foreground mb-2">Конструктор договора аренды</h3>
        <p className="text-sm text-muted-foreground">
          Заполните все поля для автоматического создания договора
        </p>
      </div>

      <div className="mb-8">
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
          {renderStep()}
        </motion.div>
      </AnimatePresence>

      <div className="flex gap-4 mt-8 pt-6 border-t border-border">
        {step > 1 && (
          <Button variant="outline" onClick={() => setStep(step - 1)}>
            <Icon name="ChevronLeft" size={16} className="mr-2" />
            Назад
          </Button>
        )}
        {step < totalSteps ? (
          <Button onClick={() => setStep(step + 1)} className="ml-auto">
            Далее
            <Icon name="ChevronRight" size={16} className="ml-2" />
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
