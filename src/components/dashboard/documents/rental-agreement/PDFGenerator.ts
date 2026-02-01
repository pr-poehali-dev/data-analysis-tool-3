import { jsPDF } from "jspdf";
import { RentalAgreementData, getPropertyTypeName } from "./types";
import { documentsStore } from "@/store/documentsStore";

export const generatePDF = (formData: RentalAgreementData, existingDocId?: string) => {
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4'
  });

  let y = 20;
  const pageHeight = 280;
  const marginLeft = 20;
  const maxWidth = 170;

  const checkPageBreak = (neededSpace: number = 10) => {
    if (y + neededSpace > pageHeight) {
      doc.addPage();
      y = 20;
    }
  };

  doc.setFont("times", "bold");
  doc.setFontSize(16);
  const title = "DOGOVOR ARENDY ZHILOGO POMESHCHENIYA";
  const titleWidth = doc.getTextWidth(title);
  doc.text(title, (210 - titleWidth) / 2, y);
  y += 15;

  doc.setFontSize(10);
  doc.setFont("times", "normal");
  const dateText = `${formData.contractCity}, ${new Date().toLocaleDateString("ru-RU")}`;
  const dateWidth = doc.getTextWidth(dateText);
  doc.text(dateText, (210 - dateWidth) / 2, y);
  y += 15;

  doc.setFontSize(11);
  doc.text(`Arendodatel': ${formData.landlordFullName}`, marginLeft, y);
  y += 7;
  doc.text(`Pasport: ${formData.landlordPassport}`, marginLeft, y);
  y += 7;
  doc.text(`Adres: ${formData.landlordAddress}`, marginLeft, y);
  y += 7;
  doc.text(`Telefon: ${formData.landlordPhone}`, marginLeft, y);
  y += 12;

  doc.text(`Arendator: ${formData.tenantFullName}`, marginLeft, y);
  y += 7;
  doc.text(`Pasport: ${formData.tenantPassport}`, marginLeft, y);
  y += 7;
  doc.text(`Adres: ${formData.tenantAddress}`, marginLeft, y);
  y += 7;
  doc.text(`Telefon: ${formData.tenantPhone}`, marginLeft, y);
  y += 15;

  checkPageBreak(20);
  doc.setFont("times", "bold");
  doc.text("1. PREDMET DOGOVORA", marginLeft, y);
  y += 7;
  doc.setFont("times", "normal");
  
  const section1 = `Arendodatel' peredaet, a Arendator prinimaet vo vremennoe vladenie i pol'zovanie ${getPropertyTypeName(formData.propertyType)}, raspolozhennuyu po adresu: ${formData.propertyAddress}. Ploshchad': ${formData.propertyArea} kv.m, kolichestvo komnat: ${formData.propertyRooms}, etazh: ${formData.propertyFloor}.`;
  const section1Lines = doc.splitTextToSize(section1, maxWidth);
  section1Lines.forEach((line: string) => {
    checkPageBreak();
    doc.text(line, marginLeft, y);
    y += 5;
  });
  y += 7;

  checkPageBreak(20);
  doc.setFont("times", "bold");
  doc.text("2. USLOVIYA PROZHIVANIYA", marginLeft, y);
  y += 7;
  doc.setFont("times", "normal");
  doc.text(`Kolichestvo prozhivayushchikh: ${formData.residentsCount} chel.`, marginLeft, y);
  y += 7;

  if (formData.residentsInfo) {
    const residentLines = doc.splitTextToSize(formData.residentsInfo, maxWidth);
    residentLines.forEach((line: string) => {
      checkPageBreak();
      doc.text(line, marginLeft, y);
      y += 5;
    });
    y += 5;
  }

  const petsText = formData.petsAllowed === "allowed" 
    ? "Soderzhanie domashnikh zhivotnykh razresheno."
    : formData.petsAllowed === "with-agreement"
    ? "Soderzhanie domashnikh zhivotnykh vozmozhno po soglasovaniyu s Arendodatelem."
    : "Soderzhanie domashnikh zhivotnykh zapreshcheno.";
  doc.text(petsText, marginLeft, y);
  y += 7;

  if (formData.propertyInventory) {
    checkPageBreak(15);
    doc.setFont("times", "bold");
    doc.text("Perechen' imushchestva:", marginLeft, y);
    y += 5;
    doc.setFont("times", "normal");
    const inventoryLines = doc.splitTextToSize(formData.propertyInventory, maxWidth);
    inventoryLines.forEach((line: string) => {
      checkPageBreak();
      doc.text(line, marginLeft, y);
      y += 5;
    });
    y += 5;
  }

  checkPageBreak(20);
  doc.setFont("times", "bold");
  doc.text("3. SROK DEJSTVIYA DOGOVORA", marginLeft, y);
  y += 7;
  doc.setFont("times", "normal");
  doc.text(`Dogovor dejstvuet s ${formData.contractStartDate} po ${formData.contractEndDate}.`, marginLeft, y);
  y += 12;

  checkPageBreak(20);
  doc.setFont("times", "bold");
  doc.text("4. ARENDNAYA PLATA", marginLeft, y);
  y += 7;
  doc.setFont("times", "normal");
  doc.text(`Razmer arendnoj platy sostavlyaet ${formData.rentalPrice} rublej v mesyac.`, marginLeft, y);
  y += 7;
  doc.text(`Obespechitel'nyj platezh: ${formData.securityDeposit} rublej.`, marginLeft, y);
  y += 7;
  doc.text(`Kommunal'nye uslugi: ${formData.utilitiesIncluded ? "vklyucheny v stoimost'" : "oplachivayutsya otdel'no"}.`, marginLeft, y);
  y += 12;

  checkPageBreak(30);
  doc.setFont("times", "bold");
  doc.text("5. ZAKLYUCHITEL'NYE POLOZHENIYA", marginLeft, y);
  y += 7;
  doc.setFont("times", "normal");

  const provisions = [
    "5.1. Dogovor sostavlen v dvukh ekzemplyarakh, imeyushchikh odinakovuyu yuridicheskuyu silu, po odnomu dlya kazhdoj iz storon.",
    "",
    "5.2. Vse izmeneniya i dopolneniya k nastoyashchemu Dogovoru dejstvitel'ny pri uslovii, esli oni soversheny v pis'mennoj forme i podpisany obeimi storonami.",
    "",
    "5.3. Rastorzhenie dogovora:",
    "- Dogovor mozhet byt' rastorgnut dosrochno po soglasheniyu storon.",
    "- Arendodatel' imeet pravo rastorgnut' dogovor v odnostoronnem poryadke pri sistematicheskoj neup late arendnoj platy (bolee dvukh mesyacev podryad), narushenii pravil pol'zovaniya zhilym pomeshcheniem, libo pri ispol'zovanii pomeshcheniya ne po naznacheniyu.",
    "- Arendator imeet pravo rastorgnut' dogovor v odnostoronnem poryadke, uvedomiv Arendodatelya ne menee chem za 30 dnej do predpolagaemoj daty rastorzheniya.",
    "",
    "5.4. Otvetstvennost' storon:",
    "- Za nevypolnenie ili nenadlezhashchee vypolnenie obyazatel'stv po nastoyashchemu Dogovoru storony nesut otvetstvennost' v sootvetstvii s dejstvuyushchim zakonodatel'stvom Rossijskoj Federacii.",
    "- Arendator neset otvetstvennost' za sokhrannost' imushchestva i obyazan vozmestit' ushcherb, prichinennyj zhilomu pomeshcheniyu i imushchestvu Arendodatelya, za isklyucheniem estestvennogo iznosa.",
    "- Pri nesvoevremennoi oplate arendnoi platy Arendator uplachivaet peni v razmere 0,1% ot summy zadolzhennosti za kazhdyi den' prosrochki.",
    "- Arendodatel' neset otvetstvennost' za nedostatki sdannogo v arendu pomeshcheniya, prepyatstvuyushchie ego ispol'zovaniyu, i obyazuetsya ustranit' ikh za svoj schet v razumnyj srok.",
    "",
    "5.5. Spory i raznoglasiya, voznikayushchie v processe ispolneniya nastoyashchego Dogovora, razreshayutsya putem peregovorov mezhdu storonami. V sluchae nedostizheniya soglasiya spor peredaetsya na rassmotrenie v sud v sootvetstvii s dejstvuyushchim zakonodatel'stvom Rossijskoj Federacii.",
    "",
    "5.6. Nastoyashchij Dogovor vstupaet v silu s momenta ego podpisaniya storonami i dejstvuet do polnogo ispolneniya storonami svoikh obyazatel'stv."
  ];

  if (formData.additionalConditions) {
    provisions.push("");
    provisions.push("5.7. Dopolnitel'nye usloviya:");
    const additionalLines = doc.splitTextToSize(formData.additionalConditions, maxWidth);
    provisions.push(...additionalLines);
  }

  provisions.forEach((line) => {
    if (line === "") {
      y += 4;
    } else {
      checkPageBreak();
      doc.text(line, marginLeft, y);
      y += 5;
    }
  });

  checkPageBreak(30);
  y += 10;
  doc.setFont("times", "bold");
  doc.text("PODPISI STORON:", marginLeft, y);
  y += 15;

  doc.setFont("times", "normal");
  doc.text("Arendodatel': _______________", marginLeft, y);
  doc.text("Arendator: _______________", 120, y);

  const savedDoc = documentsStore.saveDocument(formData, existingDocId);
  doc.save(savedDoc.fileName);
  
  return savedDoc.id;
};
