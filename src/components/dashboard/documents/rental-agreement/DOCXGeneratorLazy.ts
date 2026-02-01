import { RentalAgreementData } from "./types";

// Lazy wrapper для отложенной загрузки тяжёлых библиотек
export const generateDOCXLazy = async (formData: RentalAgreementData, existingDocId?: string) => {
  console.log('📦 Загрузка библиотек для генерации DOCX...');
  
  // Импортируем модуль только при вызове функции
  const module = await import('./DOCXGenerator');
  
  console.log('✅ Библиотеки загружены, начинаем генерацию');
  return module.generateDOCX(formData, existingDocId);
};
