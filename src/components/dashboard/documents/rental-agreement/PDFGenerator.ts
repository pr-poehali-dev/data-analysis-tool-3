import pdfMake from "pdfmake/build/pdfmake";
import pdfFonts from "pdfmake/build/vfs_fonts";
import { RentalAgreementData, getPropertyTypeName } from "./types";
import { documentsStore } from "@/store/documentsStore";

pdfMake.vfs = pdfFonts.pdfMake.vfs;

export const generatePDF = (formData: RentalAgreementData, existingDocId?: string) => {
  const petsText = formData.petsAllowed === "allowed" 
    ? "Содержание домашних животных разрешено."
    : formData.petsAllowed === "with-agreement"
    ? "Содержание домашних животных возможно по согласованию с Арендодателем."
    : "Содержание домашних животных запрещено.";

  const content: any[] = [
    { text: "ДОГОВОР АРЕНДЫ ЖИЛОГО ПОМЕЩЕНИЯ", style: "header", alignment: "center", margin: [0, 0, 0, 10] },
    { text: `${formData.contractCity}, ${new Date().toLocaleDateString("ru-RU")}`, alignment: "center", margin: [0, 0, 0, 20] },
    
    { text: `Арендодатель: ${formData.landlordFullName}`, margin: [0, 0, 0, 5] },
    { text: `Паспорт: ${formData.landlordPassport}`, fontSize: 10, margin: [0, 0, 0, 3] },
    { text: `Адрес: ${formData.landlordAddress}`, fontSize: 10, margin: [0, 0, 0, 3] },
    { text: `Телефон: ${formData.landlordPhone}`, fontSize: 10, margin: [0, 0, 0, 15] },
    
    { text: `Арендатор: ${formData.tenantFullName}`, margin: [0, 0, 0, 5] },
    { text: `Паспорт: ${formData.tenantPassport}`, fontSize: 10, margin: [0, 0, 0, 3] },
    { text: `Адрес: ${formData.tenantAddress}`, fontSize: 10, margin: [0, 0, 0, 3] },
    { text: `Телефон: ${formData.tenantPhone}`, fontSize: 10, margin: [0, 0, 0, 20] },
    
    { text: "1. ПРЕДМЕТ ДОГОВОРА", style: "sectionHeader", margin: [0, 0, 0, 10] },
    { 
      text: `Арендодатель передает, а Арендатор принимает во временное владение и пользование ${getPropertyTypeName(formData.propertyType)}, расположенную по адресу: ${formData.propertyAddress}. Площадь: ${formData.propertyArea} кв.м, количество комнат: ${formData.propertyRooms}, этаж: ${formData.propertyFloor}.`,
      alignment: "justify",
      margin: [0, 0, 0, 15]
    },
    
    { text: "2. УСЛОВИЯ ПРОЖИВАНИЯ", style: "sectionHeader", margin: [0, 0, 0, 10] },
    { text: `Количество проживающих: ${formData.residentsCount} чел.`, margin: [0, 0, 0, 5] },
  ];

  if (formData.residentsInfo) {
    content.push({ text: formData.residentsInfo, margin: [0, 0, 0, 5] });
  }

  content.push(
    { text: petsText, margin: [0, 0, 0, 5] }
  );

  if (formData.propertyInventory) {
    content.push(
      { text: "Перечень имущества:", bold: true, margin: [0, 5, 0, 3] },
      { text: formData.propertyInventory, margin: [0, 0, 0, 5] }
    );
  }

  content.push(
    { text: "3. СРОК ДЕЙСТВИЯ ДОГОВОРА", style: "sectionHeader", margin: [0, 15, 0, 10] },
    { text: `Договор действует с ${formData.contractStartDate} по ${formData.contractEndDate}.`, margin: [0, 0, 0, 15] },
    
    { text: "4. АРЕНДНАЯ ПЛАТА", style: "sectionHeader", margin: [0, 0, 0, 10] },
    { text: `Размер арендной платы составляет ${formData.rentalPrice} рублей в месяц.`, margin: [0, 0, 0, 5] },
    { text: `Обеспечительный платеж: ${formData.securityDeposit} рублей.`, margin: [0, 0, 0, 5] },
    { text: `Коммунальные услуги: ${formData.utilitiesIncluded ? "включены в стоимость" : "оплачиваются отдельно"}.`, margin: [0, 0, 0, 15] },
    
    { text: "5. ЗАКЛЮЧИТЕЛЬНЫЕ ПОЛОЖЕНИЯ", style: "sectionHeader", margin: [0, 0, 0, 10] },
    { 
      text: "5.1. Договор составлен в двух экземплярах, имеющих одинаковую юридическую силу, по одному для каждой из сторон.",
      alignment: "justify",
      margin: [0, 0, 0, 8]
    },
    {
      text: "5.2. Все изменения и дополнения к настоящему Договору действительны при условии, если они совершены в письменной форме и подписаны обеими сторонами.",
      alignment: "justify",
      margin: [0, 0, 0, 8]
    },
    { text: "5.3. Расторжение договора:", bold: true, margin: [0, 0, 0, 5] },
    {
      ul: [
        "Договор может быть расторгнут досрочно по соглашению сторон.",
        "Арендодатель имеет право расторгнуть договор в одностороннем порядке при систематической неуплате арендной платы (более двух месяцев подряд), нарушении правил пользования жилым помещением, либо при использовании помещения не по назначению.",
        "Арендатор имеет право расторгнуть договор в одностороннем порядке, уведомив Арендодателя не менее чем за 30 дней до предполагаемой даты расторжения."
      ],
      margin: [0, 0, 0, 8]
    },
    { text: "5.4. Ответственность сторон:", bold: true, margin: [0, 0, 0, 5] },
    {
      ul: [
        "За невыполнение или ненадлежащее выполнение обязательств по настоящему Договору стороны несут ответственность в соответствии с действующим законодательством Российской Федерации.",
        "Арендатор несет ответственность за сохранность имущества и обязан возместить ущерб, причиненный жилому помещению и имуществу Арендодателя, за исключением естественного износа.",
        "При несвоевременной оплате арендной платы Арендатор уплачивает пени в размере 0,1% от суммы задолженности за каждый день просрочки.",
        "Арендодатель несет ответственность за недостатки сданного в аренду помещения, препятствующие его использованию, и обязуется устранить их за свой счет в разумный срок."
      ],
      margin: [0, 0, 0, 8]
    },
    {
      text: "5.5. Споры и разногласия, возникающие в процессе исполнения настоящего Договора, разрешаются путем переговоров между сторонами. В случае недостижения согласия спор передается на рассмотрение в суд в соответствии с действующим законодательством Российской Федерации.",
      alignment: "justify",
      margin: [0, 0, 0, 8]
    },
    {
      text: "5.6. Настоящий Договор вступает в силу с момента его подписания сторонами и действует до полного исполнения сторонами своих обязательств.",
      alignment: "justify",
      margin: [0, 0, 0, 8]
    }
  );

  if (formData.additionalConditions) {
    content.push(
      { text: "5.7. Дополнительные условия:", bold: true, margin: [0, 0, 0, 5] },
      { text: formData.additionalConditions, alignment: "justify", margin: [0, 0, 0, 8] }
    );
  }

  content.push(
    { text: "", pageBreak: "auto" },
    { text: "ПОДПИСИ СТОРОН:", bold: true, margin: [0, 20, 0, 20] },
    {
      columns: [
        { text: "Арендодатель: _______________", width: "50%" },
        { text: "Арендатор: _______________", width: "50%" }
      ]
    }
  );

  const docDefinition = {
    content: content,
    styles: {
      header: {
        fontSize: 16,
        bold: true
      },
      sectionHeader: {
        fontSize: 12,
        bold: true
      }
    },
    defaultStyle: {
      fontSize: 11,
      lineHeight: 1.3
    },
    pageMargins: [40, 40, 40, 40]
  };

  const savedDoc = documentsStore.saveDocument(formData, existingDocId);
  pdfMake.createPdf(docDefinition).download(savedDoc.fileName);
  
  return savedDoc.id;
};
