import { RentalAgreementData, getPropertyTypeName } from "./types";
import { documentsStore } from "@/store/documentsStore";

export const generateDOCX = async (formData: RentalAgreementData, existingDocId?: string) => {
  const { Document, Packer, Paragraph, TextRun, AlignmentType, HeadingLevel } = await import("docx");
  const { saveAs } = await import("file-saver");
  const petsText = formData.petsAllowed === "allowed" 
    ? "Содержание домашних животных разрешено."
    : formData.petsAllowed === "with-agreement"
    ? "Содержание домашних животных возможно по согласованию с Арендодателем."
    : "Содержание домашних животных запрещено.";

  const sections = [];

  sections.push(
    new Paragraph({
      text: "ДОГОВОР АРЕНДЫ ЖИЛОГО ПОМЕЩЕНИЯ",
      heading: HeadingLevel.TITLE,
      alignment: AlignmentType.CENTER,
      spacing: { after: 200 }
    }),
    new Paragraph({
      text: `${formData.contractCity}, ${new Date().toLocaleDateString("ru-RU")}`,
      alignment: AlignmentType.CENTER,
      spacing: { after: 400 }
    }),
    new Paragraph({
      children: [
        new TextRun({ text: "Арендодатель: ", bold: true }),
        new TextRun(formData.landlordFullName)
      ],
      spacing: { after: 100 }
    }),
    new Paragraph({
      text: `Паспорт: ${formData.landlordPassport}`,
      spacing: { after: 50 }
    }),
    new Paragraph({
      text: `Адрес: ${formData.landlordAddress}`,
      spacing: { after: 50 }
    }),
    new Paragraph({
      text: `Телефон: ${formData.landlordPhone}`,
      spacing: { after: 300 }
    }),
    new Paragraph({
      children: [
        new TextRun({ text: "Арендатор: ", bold: true }),
        new TextRun(formData.tenantFullName)
      ],
      spacing: { after: 100 }
    }),
    new Paragraph({
      text: `Паспорт: ${formData.tenantPassport}`,
      spacing: { after: 50 }
    }),
    new Paragraph({
      text: `Адрес: ${formData.tenantAddress}`,
      spacing: { after: 50 }
    }),
    new Paragraph({
      text: `Телефон: ${formData.tenantPhone}`,
      spacing: { after: 400 }
    }),
    new Paragraph({
      text: "1. ПРЕДМЕТ ДОГОВОРА",
      heading: HeadingLevel.HEADING_1,
      spacing: { after: 200 }
    }),
    new Paragraph({
      text: `Арендодатель передает, а Арендатор принимает во временное владение и пользование ${getPropertyTypeName(formData.propertyType)}, расположенную по адресу: ${formData.propertyAddress}. Площадь: ${formData.propertyArea} кв.м, количество комнат: ${formData.propertyRooms}, этаж: ${formData.propertyFloor}.`,
      alignment: AlignmentType.JUSTIFIED,
      spacing: { after: 300 }
    }),
    new Paragraph({
      text: "2. УСЛОВИЯ ПРОЖИВАНИЯ",
      heading: HeadingLevel.HEADING_1,
      spacing: { after: 200 }
    }),
    new Paragraph({
      text: `Количество проживающих: ${formData.residentsCount} чел.`,
      spacing: { after: 100 }
    })
  );

  if (formData.residentsInfo) {
    sections.push(
      new Paragraph({
        text: formData.residentsInfo,
        spacing: { after: 100 }
      })
    );
  }

  sections.push(
    new Paragraph({
      text: petsText,
      spacing: { after: 100 }
    })
  );

  if (formData.propertyInventory) {
    sections.push(
      new Paragraph({
        children: [
          new TextRun({ text: "Перечень имущества:", bold: true })
        ],
        spacing: { after: 100 }
      }),
      new Paragraph({
        text: formData.propertyInventory,
        spacing: { after: 200 }
      })
    );
  }

  sections.push(
    new Paragraph({
      text: "3. СРОК ДЕЙСТВИЯ ДОГОВОРА",
      heading: HeadingLevel.HEADING_1,
      spacing: { before: 200, after: 200 }
    }),
    new Paragraph({
      text: `Договор действует с ${formData.contractStartDate} по ${formData.contractEndDate}.`,
      spacing: { after: 300 }
    }),
    new Paragraph({
      text: "4. АРЕНДНАЯ ПЛАТА",
      heading: HeadingLevel.HEADING_1,
      spacing: { after: 200 }
    }),
    new Paragraph({
      text: `Размер арендной платы составляет ${formData.rentalPrice} рублей в месяц.`,
      spacing: { after: 100 }
    }),
    new Paragraph({
      text: `Обеспечительный платеж: ${formData.securityDeposit} рублей.`,
      spacing: { after: 100 }
    }),
    new Paragraph({
      text: `Коммунальные услуги: ${formData.utilitiesIncluded ? "включены в стоимость" : "оплачиваются отдельно"}.`,
      spacing: { after: 300 }
    }),
    new Paragraph({
      text: "5. ЗАКЛЮЧИТЕЛЬНЫЕ ПОЛОЖЕНИЯ",
      heading: HeadingLevel.HEADING_1,
      spacing: { after: 200 }
    }),
    new Paragraph({
      text: "5.1. Договор составлен в двух экземплярах, имеющих одинаковую юридическую силу, по одному для каждой из сторон.",
      alignment: AlignmentType.JUSTIFIED,
      spacing: { after: 150 }
    }),
    new Paragraph({
      text: "5.2. Все изменения и дополнения к настоящему Договору действительны при условии, если они совершены в письменной форме и подписаны обеими сторонами.",
      alignment: AlignmentType.JUSTIFIED,
      spacing: { after: 150 }
    }),
    new Paragraph({
      children: [
        new TextRun({ text: "5.3. Расторжение договора:", bold: true })
      ],
      spacing: { after: 100 }
    }),
    new Paragraph({
      text: "- Договор может быть расторгнут досрочно по соглашению сторон.",
      spacing: { after: 50 }
    }),
    new Paragraph({
      text: "- Арендодатель имеет право расторгнуть договор в одностороннем порядке при систематической неуплате арендной платы (более двух месяцев подряд), нарушении правил пользования жилым помещением, либо при использовании помещения не по назначению.",
      alignment: AlignmentType.JUSTIFIED,
      spacing: { after: 50 }
    }),
    new Paragraph({
      text: "- Арендатор имеет право расторгнуть договор в одностороннем порядке, уведомив Арендодателя не менее чем за 30 дней до предполагаемой даты расторжения.",
      alignment: AlignmentType.JUSTIFIED,
      spacing: { after: 150 }
    }),
    new Paragraph({
      children: [
        new TextRun({ text: "5.4. Ответственность сторон:", bold: true })
      ],
      spacing: { after: 100 }
    }),
    new Paragraph({
      text: "- За невыполнение или ненадлежащее выполнение обязательств по настоящему Договору стороны несут ответственность в соответствии с действующим законодательством Российской Федерации.",
      alignment: AlignmentType.JUSTIFIED,
      spacing: { after: 50 }
    }),
    new Paragraph({
      text: "- Арендатор несет ответственность за сохранность имущества и обязан возместить ущерб, причиненный жилому помещению и имуществу Арендодателя, за исключением естественного износа.",
      alignment: AlignmentType.JUSTIFIED,
      spacing: { after: 50 }
    }),
    new Paragraph({
      text: "- При несвоевременной оплате арендной платы Арендатор уплачивает пени в размере 0,1% от суммы задолженности за каждый день просрочки.",
      alignment: AlignmentType.JUSTIFIED,
      spacing: { after: 50 }
    }),
    new Paragraph({
      text: "- Арендодатель несет ответственность за недостатки сданного в аренду помещения, препятствующие его использованию, и обязуется устранить их за свой счет в разумный срок.",
      alignment: AlignmentType.JUSTIFIED,
      spacing: { after: 150 }
    }),
    new Paragraph({
      text: "5.5. Споры и разногласия, возникающие в процессе исполнения настоящего Договора, разрешаются путем переговоров между сторонами. В случае недостижения согласия спор передается на рассмотрение в суд в соответствии с действующим законодательством Российской Федерации.",
      alignment: AlignmentType.JUSTIFIED,
      spacing: { after: 150 }
    }),
    new Paragraph({
      text: "5.6. Настоящий Договор вступает в силу с момента его подписания сторонами и действует до полного исполнения сторонами своих обязательств.",
      alignment: AlignmentType.JUSTIFIED,
      spacing: { after: 150 }
    })
  );

  if (formData.additionalConditions) {
    sections.push(
      new Paragraph({
        children: [
          new TextRun({ text: "5.7. Дополнительные условия:", bold: true })
        ],
        spacing: { after: 100 }
      }),
      new Paragraph({
        text: formData.additionalConditions,
        alignment: AlignmentType.JUSTIFIED,
        spacing: { after: 200 }
      })
    );
  }

  sections.push(
    new Paragraph({
      text: "",
      spacing: { after: 400 }
    }),
    new Paragraph({
      children: [
        new TextRun({ text: "ПОДПИСИ СТОРОН:", bold: true })
      ],
      spacing: { after: 300 }
    }),
    new Paragraph({
      text: "Арендодатель: _______________                    Арендатор: _______________"
    })
  );

  const doc = new Document({
    sections: [{
      properties: {},
      children: sections
    }]
  });

  const savedDoc = documentsStore.saveDocument(formData, existingDocId);
  const fileName = savedDoc.fileName.replace('.pdf', '.docx');
  
  const blob = await Packer.toBlob(doc);
  saveAs(blob, fileName);
  
  return savedDoc.id;
};