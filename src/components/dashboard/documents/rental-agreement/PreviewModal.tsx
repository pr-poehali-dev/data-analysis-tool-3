import Icon from "@/components/ui/icon";
import { Button } from "@/components/ui/button";
import { RentalAgreementData, getPropertyTypeName } from "./types";
import { generateDOCX } from "./DOCXGenerator";

interface PreviewModalProps {
  formData: RentalAgreementData;
  onEdit: () => void;
  onReset: () => void;
  documentId?: string;
  onDocumentSaved?: (id: string) => void;
}

export const PreviewModal = ({ formData, onEdit, onReset, documentId, onDocumentSaved }: PreviewModalProps) => {
  const handleDownload = async () => {
    const docId = await generateDOCX(formData, documentId);
    if (onDocumentSaved) {
      onDocumentSaved(docId);
    }
  };
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

        <h3 className="font-bold mt-6 mb-2">2. УСЛОВИЯ ПРОЖИВАНИЯ</h3>
        <p className="text-sm">
          Количество проживающих: {formData.residentsCount} чел.
          {formData.residentsInfo && <><br />{formData.residentsInfo}</>}
          <br /><br />
          {formData.petsAllowed === "allowed" 
            ? "Содержание домашних животных разрешено."
            : formData.petsAllowed === "with-agreement"
            ? "Содержание домашних животных возможно по согласованию с Арендодателем."
            : "Содержание домашних животных запрещено."}
          {formData.propertyInventory && (
            <>
              <br /><br />
              <strong>Перечень имущества:</strong><br />
              {formData.propertyInventory}
            </>
          )}
        </p>

        <h3 className="font-bold mt-6 mb-2">3. СРОК ДЕЙСТВИЯ ДОГОВОРА</h3>
        <p className="text-sm">
          Договор действует с {formData.contractStartDate} по {formData.contractEndDate}.
        </p>

        <h3 className="font-bold mt-6 mb-2">4. АРЕНДНАЯ ПЛАТА</h3>
        <p className="text-sm">
          Размер арендной платы составляет {formData.rentalPrice} рублей в месяц.<br />
          Обеспечительный платеж: {formData.securityDeposit} рублей.<br />
          Коммунальные услуги: {formData.utilitiesIncluded ? "включены в стоимость" : "оплачиваются отдельно"}.
        </p>

        <h3 className="font-bold mt-6 mb-2">5. ЗАКЛЮЧИТЕЛЬНЫЕ ПОЛОЖЕНИЯ</h3>
        <p className="text-sm">
          <strong>5.1.</strong> Договор составлен в двух экземплярах, имеющих одинаковую юридическую силу, по одному для каждой из сторон.<br /><br />
          
          <strong>5.2.</strong> Все изменения и дополнения к настоящему Договору действительны при условии, если они совершены в письменной форме и подписаны обеими сторонами.<br /><br />
          
          <strong>5.3. Расторжение договора:</strong><br />
          - Договор может быть расторгнут досрочно по соглашению сторон.<br />
          - Арендодатель имеет право расторгнуть договор в одностороннем порядке при систематической неуплате арендной платы (более двух месяцев подряд), нарушении правил пользования жилым помещением, либо при использовании помещения не по назначению.<br />
          - Арендатор имеет право расторгнуть договор в одностороннем порядке, уведомив Арендодателя не менее чем за 30 дней до предполагаемой даты расторжения.<br /><br />
          
          <strong>5.4. Ответственность сторон:</strong><br />
          - За невыполнение или ненадлежащее выполнение обязательств по настоящему Договору стороны несут ответственность в соответствии с действующим законодательством Российской Федерации.<br />
          - Арендатор несет ответственность за сохранность имущества и обязан возместить ущерб, причиненный жилому помещению и имуществу Арендодателя, за исключением естественного износа.<br />
          - При несвоевременной оплате арендной платы Арендатор уплачивает пени в размере 0,1% от суммы задолженности за каждый день просрочки.<br />
          - Арендодатель несет ответственность за недостатки сданного в аренду помещения, препятствующие его использованию, и обязуется устранить их за свой счет в разумный срок.<br /><br />
          
          <strong>5.5.</strong> Споры и разногласия, возникающие в процессе исполнения настоящего Договора, разрешаются путем переговоров между сторонами. В случае недостижения согласия спор передается на рассмотрение в суд в соответствии с действующим законодательством Российской Федерации.<br /><br />
          
          <strong>5.6.</strong> Настоящий Договор вступает в силу с момента его подписания сторонами и действует до полного исполнения сторонами своих обязательств.
          {formData.additionalConditions && (
            <>
              <br /><br />
              <strong>5.7. Дополнительные условия:</strong><br />
              {formData.additionalConditions}
            </>
          )}
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
        <Button onClick={handleDownload} className="flex-1">
          <Icon name="Download" size={16} className="mr-2" />
          Скачать DOCX
        </Button>
        <Button variant="outline" onClick={onReset}>
          <Icon name="RotateCcw" size={16} className="mr-2" />
          Начать заново
        </Button>
      </div>
    </div>
  );
};