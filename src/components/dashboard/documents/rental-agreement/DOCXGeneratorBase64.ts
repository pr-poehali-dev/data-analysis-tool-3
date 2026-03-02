import { Document, Packer, Paragraph, TextRun, AlignmentType } from "docx";
import { RentalAgreementData, getPropertyTypeName } from "./types";

export const generateDOCXBase64 = async (formData: RentalAgreementData): Promise<string> => {
  const petsText = formData.petsAllowed === "allowed" 
    ? "Содержание домашних животных разрешено."
    : formData.petsAllowed === "with-agreement"
    ? "Содержание домашних животных возможно по согласованию с Арендодателем."
    : "Содержание домашних животных запрещено.";

  const sections: Paragraph[] = [];

  sections.push(
    new Paragraph({
      children: [
        new TextRun({ text: "ДОГОВОР АРЕНДЫ ЖИЛОГО ПОМЕЩЕНИЯ", bold: true, size: 24 })
      ],
      alignment: AlignmentType.CENTER,
      spacing: { after: 200 }
    }),
    new Paragraph({
      children: [
        new TextRun({ text: `${formData.contractCity}, ${new Date().toLocaleDateString("ru-RU")}`, size: 24 })
      ],
      alignment: AlignmentType.CENTER,
      spacing: { after: 400 }
    }),
    new Paragraph({
      children: [
        new TextRun({ text: "Арендодатель: ", bold: true, size: 24 }),
        new TextRun({ text: formData.landlordFullName, size: 24 })
      ],
      spacing: { after: 100 }
    }),
    new Paragraph({
      children: [
        new TextRun({ text: `Паспорт: ${formData.landlordPassport}`, size: 24 })
      ],
      spacing: { after: 50 }
    }),
    new Paragraph({
      children: [
        new TextRun({ text: `Адрес: ${formData.landlordAddress}`, size: 24 })
      ],
      spacing: { after: 50 }
    }),
    new Paragraph({
      children: [
        new TextRun({ text: `Телефон: ${formData.landlordPhone}`, size: 24 })
      ],
      spacing: { after: 300 }
    }),
    new Paragraph({
      children: [
        new TextRun({ text: "Арендатор: ", bold: true, size: 24 }),
        new TextRun({ text: formData.tenantFullName, size: 24 })
      ],
      spacing: { after: 100 }
    }),
    new Paragraph({
      children: [
        new TextRun({ text: `Паспорт: ${formData.tenantPassport}`, size: 24 })
      ],
      spacing: { after: 50 }
    }),
    new Paragraph({
      children: [
        new TextRun({ text: `Адрес: ${formData.tenantAddress}`, size: 24 })
      ],
      spacing: { after: 50 }
    }),
    new Paragraph({
      children: [
        new TextRun({ text: `Телефон: ${formData.tenantPhone}`, size: 24 })
      ],
      spacing: { after: 400 }
    }),
    new Paragraph({
      children: [
        new TextRun({ text: "1. ПРЕДМЕТ ДОГОВОРА", bold: true, size: 24 })
      ],
      spacing: { after: 200 }
    }),
    new Paragraph({
      children: [
        new TextRun({ text: `Арендодатель передает, а Арендатор принимает во временное владение и пользование ${getPropertyTypeName(formData.propertyType)}, расположенную по адресу: ${formData.propertyAddress}. Площадь: ${formData.propertyArea} кв.м, количество комнат: ${formData.propertyRooms}, этаж: ${formData.propertyFloor}.`, size: 24 })
      ],
      alignment: AlignmentType.JUSTIFIED,
      spacing: { after: 300 }
    }),
    new Paragraph({
      children: [
        new TextRun({ text: "2. УСЛОВИЯ ПРОЖИВАНИЯ", bold: true, size: 24 })
      ],
      spacing: { after: 200 }
    }),
    new Paragraph({
      children: [
        new TextRun({ text: `Количество проживающих: ${formData.residentsCount} чел.`, size: 24 })
      ],
      spacing: { after: 100 }
    })
  );

  if (formData.residentsInfo) {
    sections.push(
      new Paragraph({
        children: [
          new TextRun({ text: formData.residentsInfo, size: 24 })
        ],
        spacing: { after: 100 }
      })
    );
  }

  sections.push(
    new Paragraph({
      children: [
        new TextRun({ text: petsText, size: 24 })
      ],
      spacing: { after: 100 }
    })
  );

  if (formData.propertyInventory) {
    sections.push(
      new Paragraph({
        children: [
          new TextRun({ text: "Перечень имущества:", bold: true, size: 24 })
        ],
        spacing: { after: 100 }
      }),
      new Paragraph({
        children: [
          new TextRun({ text: formData.propertyInventory, size: 24 })
        ],
        spacing: { after: 200 }
      })
    );
  }

  sections.push(
    new Paragraph({
      children: [
        new TextRun({ text: "3. СРОК ДЕЙСТВИЯ ДОГОВОРА", bold: true, size: 24 })
      ],
      spacing: { before: 200, after: 200 }
    }),
    new Paragraph({
      children: [
        new TextRun({ text: `Договор действует с ${formData.contractStartDate} по ${formData.contractEndDate}.`, size: 24 })
      ],
      spacing: { after: 300 }
    }),
    new Paragraph({
      children: [
        new TextRun({ text: "4. АРЕНДНАЯ ПЛАТА", bold: true, size: 24 })
      ],
      spacing: { after: 200 }
    }),
    new Paragraph({
      children: [
        new TextRun({ text: `Размер арендной платы составляет ${formData.rentalPrice} рублей в месяц.`, size: 24 })
      ],
      spacing: { after: 100 }
    }),
    new Paragraph({
      children: [
        new TextRun({ text: `Обеспечительный платеж: ${formData.securityDeposit} рублей.`, size: 24 })
      ],
      spacing: { after: 100 }
    }),
    new Paragraph({
      children: [
        new TextRun({ text: `Коммунальные услуги: ${formData.utilitiesIncluded ? "включены в стоимость" : "оплачиваются отдельно"}.`, size: 24 })
      ],
      spacing: { after: 300 }
    }),
    new Paragraph({
      children: [
        new TextRun({ text: "5. ЗАКЛЮЧИТЕЛЬНЫЕ ПОЛОЖЕНИЯ", bold: true, size: 24 })
      ],
      spacing: { after: 200 }
    }),
    new Paragraph({
      children: [
        new TextRun({ text: "5.1. Договор составлен в двух экземплярах, имеющих одинаковую юридическую силу, по одному для каждой из сторон.", size: 24 })
      ],
      alignment: AlignmentType.JUSTIFIED,
      spacing: { after: 150 }
    }),
    new Paragraph({
      children: [
        new TextRun({ text: "5.2. Все изменения и дополнения к настоящему Договору действительны при условии, если они совершены в письменной форме и подписаны обеими сторонами.", size: 24 })
      ],
      alignment: AlignmentType.JUSTIFIED,
      spacing: { after: 150 }
    }),
    new Paragraph({
      children: [
        new TextRun({ text: "5.3. Расторжение договора:", bold: true, size: 24 })
      ],
      spacing: { after: 100 }
    }),
    new Paragraph({
      children: [
        new TextRun({ text: "- Договор может быть расторгнут досрочно по соглашению сторон.", size: 24 })
      ],
      spacing: { after: 50 }
    }),
    new Paragraph({
      children: [
        new TextRun({ text: "- Арендодатель имеет право расторгнуть договор в одностороннем порядке при систематической неуплате арендной платы (более двух месяцев подряд), нарушении правил пользования жилым помещением, либо при использовании помещения не по назначению.", size: 24 })
      ],
      alignment: AlignmentType.JUSTIFIED,
      spacing: { after: 50 }
    }),
    new Paragraph({
      children: [
        new TextRun({ text: "- Арендатор имеет право расторгнуть договор в одностороннем порядке, уведомив Арендодателя не менее чем за 30 дней до предполагаемой даты расторжения.", size: 24 })
      ],
      alignment: AlignmentType.JUSTIFIED,
      spacing: { after: 150 }
    }),
    new Paragraph({
      children: [
        new TextRun({ text: "5.4. Ответственность сторон:", bold: true, size: 24 })
      ],
      spacing: { after: 100 }
    }),
    new Paragraph({
      children: [
        new TextRun({ text: "- За невыполнение или ненадлежащее выполнение обязательств по настоящему Договору стороны несут ответственность в соответствии с действующим законодательством Российской Федерации.", size: 24 })
      ],
      alignment: AlignmentType.JUSTIFIED,
      spacing: { after: 50 }
    }),
    new Paragraph({
      children: [
        new TextRun({ text: "- Арендатор несет ответственность за сохранность имущества и обязан возместить ущерб, причиненный жилому помещению и имуществу Арендодателя, за исключением естественного износа.", size: 24 })
      ],
      alignment: AlignmentType.JUSTIFIED,
      spacing: { after: 50 }
    }),
    new Paragraph({
      children: [
        new TextRun({ text: "- При несвоевременной оплате арендной платы Арендатор уплачивает пени в размере 0,1% от суммы задолженности за каждый день просрочки.", size: 24 })
      ],
      alignment: AlignmentType.JUSTIFIED,
      spacing: { after: 50 }
    }),
    new Paragraph({
      children: [
        new TextRun({ text: "- Арендодатель несет ответственность за недостатки сданного в аренду помещения, препятствующие его использованию, и обязуется устранить их за свой счет в разумный срок.", size: 24 })
      ],
      alignment: AlignmentType.JUSTIFIED,
      spacing: { after: 150 }
    }),
    new Paragraph({
      children: [
        new TextRun({ text: "5.5. Споры и разногласия, возникающие в процессе исполнения настоящего Договора, разрешаются путем переговоров между сторонами. В случае недостижения согласия спор передается на рассмотрение в суд в соответствии с действующим законодательством Российской Федерации.", size: 24 })
      ],
      alignment: AlignmentType.JUSTIFIED,
      spacing: { after: 150 }
    }),
    new Paragraph({
      children: [
        new TextRun({ text: "5.6. Настоящий Договор вступает в силу с момента его подписания сторонами и действует до полного исполнения сторонами своих обязательств.", size: 24 })
      ],
      alignment: AlignmentType.JUSTIFIED,
      spacing: { after: 150 }
    })
  );

  if (formData.additionalConditions) {
    sections.push(
      new Paragraph({
        children: [
          new TextRun({ text: "5.7. Дополнительные условия:", bold: true, size: 24 })
        ],
        spacing: { after: 100 }
      }),
      new Paragraph({
        children: [
          new TextRun({ text: formData.additionalConditions, size: 24 })
        ],
        alignment: AlignmentType.JUSTIFIED,
        spacing: { after: 200 }
      })
    );
  }

  sections.push(
    new Paragraph({
      children: [new TextRun({ text: "", size: 24 })],
      spacing: { after: 400 }
    }),
    new Paragraph({
      children: [
        new TextRun({ text: "ПОДПИСИ СТОРОН:", bold: true, size: 24 })
      ],
      spacing: { after: 300 }
    }),
    new Paragraph({
      children: [
        new TextRun({ text: `Арендодатель: _________________ / ${formData.landlordFullName} /`, size: 24 })
      ],
      spacing: { after: 200 }
    }),
    new Paragraph({
      children: [
        new TextRun({ text: `Арендатор: _________________ / ${formData.tenantFullName} /`, size: 24 })
      ],
      spacing: { after: 200 }
    })
  );

  const doc = new Document({
    sections: [{
      properties: {},
      children: sections
    }]
  });

  const blob = await Packer.toBlob(doc);
  const arrayBuffer = await blob.arrayBuffer();
  const bytes = new Uint8Array(arrayBuffer);

  let binary = '';
  for (let i = 0; i < bytes.byteLength; i++) {
    binary += String.fromCharCode(bytes[i]);
  }

  return btoa(binary);
};
