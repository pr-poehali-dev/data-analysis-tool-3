import { RentalAgreementData } from "./types";

export const generateDOCXBase64Lazy = async (formData: RentalAgreementData): Promise<string> => {
  console.log('📦 Загрузка библиотек для генерации DOCX в base64...');
  
  const module = await import('./DOCXGeneratorBase64');
  
  console.log('✅ Библиотеки загружены, начинаем генерацию');
  return module.generateDOCXBase64(formData);
};
