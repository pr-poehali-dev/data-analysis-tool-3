import { jsPDF } from "jspdf";
import { RentalAgreementData, getPropertyTypeName } from "./types";
import { documentsStore } from "@/store/documentsStore";

export const generatePDF = (formData: RentalAgreementData, existingDocId?: string) => {
  const doc = new jsPDF();
  let y = 20;

  const addText = (text: string, x: number, yPos: number, options?: any) => {
    if (yPos > 270) {
      doc.addPage();
      return 20;
    }
    doc.text(text, x, yPos, options);
    return yPos;
  };

  const checkPageBreak = (currentY: number, neededSpace: number = 15) => {
    if (currentY + neededSpace > 270) {
      doc.addPage();
      return 20;
    }
    return currentY;
  };

  doc.setFont("helvetica", "bold");
  doc.setFontSize(16);
  y = addText("ДОГОВОР АРЕНДЫ ЖИЛОГО ПОМЕЩЕНИЯ", 105, y, { align: "center" });
  y += 15;

  doc.setFontSize(10);
  doc.setFont("helvetica", "normal");
  y = addText(`${formData.contractCity}, ${new Date().toLocaleDateString("ru-RU")}`, 105, y, { align: "center" });
  y += 15;

  doc.setFontSize(11);
  y = addText(`Арендодатель: ${formData.landlordFullName}`, 20, y);
  y += 7;
  y = addText(`Паспорт: ${formData.landlordPassport}`, 20, y);
  y += 7;
  y = addText(`Адрес: ${formData.landlordAddress}`, 20, y);
  y += 7;
  y = addText(`Телефон: ${formData.landlordPhone}`, 20, y);
  y += 12;

  y = addText(`Арендатор: ${formData.tenantFullName}`, 20, y);
  y += 7;
  y = addText(`Паспорт: ${formData.tenantPassport}`, 20, y);
  y += 7;
  y = addText(`Адрес: ${formData.tenantAddress}`, 20, y);
  y += 7;
  y = addText(`Телефон: ${formData.tenantPhone}`, 20, y);
  y += 15;

  y = checkPageBreak(y);
  doc.setFont("helvetica", "bold");
  y = addText("1. ПРЕДМЕТ ДОГОВОРА", 20, y);
  y += 7;
  doc.setFont("helvetica", "normal");
  y = addText(`Арендодатель передает, а Арендатор принимает во временное владение`, 20, y);
  y += 5;
  y = addText(`и пользование ${getPropertyTypeName(formData.propertyType)}, расположенную по адресу:`, 20, y);
  y += 7;
  y = addText(`${formData.propertyAddress}`, 20, y);
  y += 7;
  y = addText(`Площадь: ${formData.propertyArea} кв.м, количество комнат: ${formData.propertyRooms}, этаж: ${formData.propertyFloor}`, 20, y);
  y += 12;

  y = checkPageBreak(y);
  doc.setFont("helvetica", "bold");
  y = addText("2. УСЛОВИЯ ПРОЖИВАНИЯ", 20, y);
  y += 7;
  doc.setFont("helvetica", "normal");
  y = addText(`Количество проживающих: ${formData.residentsCount} чел.`, 20, y);
  y += 5;
  if (formData.residentsInfo) {
    const residentLines = doc.splitTextToSize(formData.residentsInfo, 170);
    residentLines.forEach((line: string) => {
      y = checkPageBreak(y);
      y = addText(line, 20, y);
      y += 5;
    });
  }
  y += 7;

  const petsText = formData.petsAllowed === "allowed" 
    ? "Содержание домашних животных разрешено."
    : formData.petsAllowed === "with-agreement"
    ? "Содержание домашних животных возможно по согласованию с Арендодателем."
    : "Содержание домашних животных запрещено.";
  y = addText(petsText, 20, y);
  y += 7;

  if (formData.propertyInventory) {
    y = addText("Перечень имущества:", 20, y);
    y += 5;
    const inventoryLines = doc.splitTextToSize(formData.propertyInventory, 170);
    inventoryLines.forEach((line: string) => {
      y = checkPageBreak(y);
      y = addText(line, 20, y);
      y += 5;
    });
  }
  y += 7;

  y = checkPageBreak(y);
  doc.setFont("helvetica", "bold");
  y = addText("3. СРОК ДЕЙСТВИЯ ДОГОВОРА", 20, y);
  y += 7;
  doc.setFont("helvetica", "normal");
  y = addText(`Договор действует с ${formData.contractStartDate} по ${formData.contractEndDate}`, 20, y);
  y += 12;

  y = checkPageBreak(y);
  doc.setFont("helvetica", "bold");
  y = addText("4. АРЕНДНАЯ ПЛАТА", 20, y);
  y += 7;
  doc.setFont("helvetica", "normal");
  y = addText(`Размер арендной платы составляет ${formData.rentalPrice} рублей в месяц.`, 20, y);
  y += 7;
  y = addText(`Обеспечительный платеж: ${formData.securityDeposit} рублей.`, 20, y);
  y += 7;
  y = addText(`Коммунальные услуги: ${formData.utilitiesIncluded ? "включены в стоимость" : "оплачиваются отдельно"}`, 20, y);
  y += 12;

  y = checkPageBreak(y);
  doc.setFont("helvetica", "bold");
  y = addText("5. ЗАКЛЮЧИТЕЛЬНЫЕ ПОЛОЖЕНИЯ", 20, y);
  y += 7;
  doc.setFont("helvetica", "normal");
  
  let finalProvisionsText = `5.1. Договор составлен в двух экземплярах, имеющих одинаковую юридическую силу, по одному для каждой из сторон.

5.2. Все изменения и дополнения к настоящему Договору действительны при условии, если они совершены в письменной форме и подписаны обеими сторонами.

5.3. Расторжение договора:
- Договор может быть расторгнут досрочно по соглашению сторон.
- Арендодатель имеет право расторгнуть договор в одностороннем порядке при систематической неуплате арендной платы (более двух месяцев подряд), нарушении правил пользования жилым помещением, либо при использовании помещения не по назначению.
- Арендатор имеет право расторгнуть договор в одностороннем порядке, уведомив Арендодателя не менее чем за 30 дней до предполагаемой даты расторжения.

5.4. Ответственность сторон:
- За невыполнение или ненадлежащее выполнение обязательств по настоящему Договору стороны несут ответственность в соответствии с действующим законодательством Российской Федерации.
- Арендатор несет ответственность за сохранность имущества и обязан возместить ущерб, причиненный жилому помещению и имуществу Арендодателя, за исключением естественного износа.
- При несвоевременной оплате арендной платы Арендатор уплачивает пени в размере 0,1% от суммы задолженности за каждый день просрочки.
- Арендодатель несет ответственность за недостатки сданного в аренду помещения, препятствующие его использованию, и обязуется устранить их за свой счет в разумный срок.

5.5. Споры и разногласия, возникающие в процессе исполнения настоящего Договора, разрешаются путем переговоров между сторонами. В случае недостижения согласия спор передается на рассмотрение в суд в соответствии с действующим законодательством Российской Федерации.

5.6. Настоящий Договор вступает в силу с момента его подписания сторонами и действует до полного исполнения сторонами своих обязательств.`;
  
  if (formData.additionalConditions) {
    finalProvisionsText += `

5.7. Дополнительные условия:
${formData.additionalConditions}`;
  }

  const finalLines = doc.splitTextToSize(finalProvisionsText, 170);
  finalLines.forEach((line: string) => {
    y = checkPageBreak(y);
    y = addText(line, 20, y);
    y += 5;
  });
  y += 7;

  y = checkPageBreak(y, 30);
  y += 10;

  doc.setFont("helvetica", "bold");
  y = addText("ПОДПИСИ СТОРОН:", 20, y);
  y += 15;

  doc.setFont("helvetica", "normal");
  addText("Арендодатель: _______________", 20, y);
  addText("Арендатор: _______________", 120, y);

  const savedDoc = documentsStore.saveDocument(formData, existingDocId);
  doc.save(savedDoc.fileName);
  
  return savedDoc.id;
};