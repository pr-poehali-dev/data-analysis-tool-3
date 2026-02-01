import Icon from "@/components/ui/icon";
import { Button } from "@/components/ui/button";
import { RentalAgreementData, getPropertyTypeName } from "./types";
import { generatePDF } from "./PDFGenerator";

interface PreviewModalProps {
  formData: RentalAgreementData;
  onEdit: () => void;
  onReset: () => void;
}

export const PreviewModal = ({ formData, onEdit, onReset }: PreviewModalProps) => {
  return (
    <div className="bg-white border border-border rounded-xl p-8">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-2xl font-bold text-foreground">Предварительный просмотр</h3>
        <Button variant="outline" onClick={onEdit}>
          <Icon name="Edit" size={16} className="mr-2" />
          Редактировать
        </Button>
      </div>

      <div className="prose max-w-none mb-8 p-6 bg-gray-50 rounded-lg max-h-[600px] overflow-y-auto">
        <h2 className="text-center font-bold mb-4">ДОГОВОР АРЕНДЫ ЖИЛОГО ПОМЕЩЕНИЯ</h2>
        <p className="text-center text-sm mb-6">{formData.contractCity}, {new Date().toLocaleDateString("ru-RU")}</p>

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
          Арендодатель передает, а Арендатор принимает во временное владение и пользование {getPropertyTypeName(formData.propertyType)}, 
          расположенную по адресу: {formData.propertyAddress}. 
          Площадь: {formData.propertyArea} кв.м, количество комнат: {formData.propertyRooms}, этаж: {formData.propertyFloor}.
        </p>

        <h3 className="font-bold mt-6 mb-2">2. ПРОЖИВАЮЩИЕ ЛИЦА</h3>
        <p className="text-sm">
          Количество проживающих: {formData.residentsCount} чел.
          {formData.residentsInfo && <><br />{formData.residentsInfo}</>}
        </p>

        <h3 className="font-bold mt-6 mb-2">3. ДОМАШНИЕ ЖИВОТНЫЕ</h3>
        <p className="text-sm">
          {formData.petsAllowed === "allowed" 
            ? "Содержание домашних животных разрешено."
            : formData.petsAllowed === "with-agreement"
            ? "Содержание домашних животных возможно по согласованию с Арендодателем."
            : "Содержание домашних животных запрещено."}
        </p>

        {formData.propertyInventory && (
          <>
            <h3 className="font-bold mt-6 mb-2">4. ПЕРЕЧЕНЬ ИМУЩЕСТВА</h3>
            <p className="text-sm whitespace-pre-wrap">{formData.propertyInventory}</p>
          </>
        )}

        <h3 className="font-bold mt-6 mb-2">5. СРОК ДЕЙСТВИЯ ДОГОВОРА</h3>
        <p className="text-sm">
          Договор действует с {formData.contractStartDate} по {formData.contractEndDate}.
        </p>

        <h3 className="font-bold mt-6 mb-2">6. АРЕНДНАЯ ПЛАТА</h3>
        <p className="text-sm">
          Размер арендной платы составляет {formData.rentalPrice} рублей в месяц.<br />
          Обеспечительный платеж: {formData.securityDeposit} рублей.<br />
          Коммунальные услуги: {formData.utilitiesIncluded ? "включены в стоимость" : "оплачиваются отдельно"}.
        </p>

        {formData.additionalConditions && (
          <>
            <h3 className="font-bold mt-6 mb-2">7. ДОПОЛНИТЕЛЬНЫЕ УСЛОВИЯ</h3>
            <p className="text-sm whitespace-pre-wrap">{formData.additionalConditions}</p>
          </>
        )}

        <h3 className="font-bold mt-6 mb-2">8. ЗАКЛЮЧИТЕЛЬНЫЕ ПОЛОЖЕНИЯ</h3>
        <p className="text-sm">
          8.1. Договор составлен в двух экземплярах, имеющих одинаковую юридическую силу, по одному для каждой из сторон.<br /><br />
          8.2. Все изменения и дополнения к настоящему Договору действительны при условии, если они совершены в письменной форме и подписаны обеими сторонами.<br /><br />
          8.3. Споры и разногласия, возникающие в процессе исполнения настоящего Договора, разрешаются путем переговоров между сторонами. В случае недостижения согласия спор передается на рассмотрение в суд в соответствии с действующим законодательством Российской Федерации.<br /><br />
          8.4. Настоящий Договор вступает в силу с момента его подписания сторонами и действует до полного исполнения сторонами своих обязательств.
        </p>

        <div className="mt-8 pt-6 border-t border-border">
          <p className="font-bold mb-4">ПОДПИСИ СТОРОН:</p>
          <div className="flex justify-between">
            <p>Арендодатель: _______________</p>
            <p>Арендатор: _______________</p>
          </div>
        </div>
      </div>

      <div className="flex gap-4">
        <Button onClick={() => generatePDF(formData)} className="flex-1">
          <Icon name="Download" size={16} className="mr-2" />
          Скачать PDF
        </Button>
        <Button variant="outline" onClick={onReset}>
          <Icon name="RotateCcw" size={16} className="mr-2" />
          Начать заново
        </Button>
      </div>
    </div>
  );
};