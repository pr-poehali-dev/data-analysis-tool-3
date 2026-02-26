export interface RentalAgreementData {
  contractCity: string;
  landlordFullName: string;
  landlordPassport: string;
  landlordAddress: string;
  landlordPhone: string;
  tenantFullName: string;
  tenantPassport: string;
  tenantAddress: string;
  tenantPhone: string;
  propertyType: string;
  propertyAddress: string;
  propertyArea: string;
  propertyRooms: string;
  propertyFloor: string;
  residentsCount: string;
  residentsInfo: string;
  petsAllowed: string;
  propertyInventory: string;
  rentalPrice: string;
  securityDeposit: string;
  contractStartDate: string;
  contractEndDate: string;
  utilitiesIncluded: boolean;
  additionalConditions: string;
}

export const initialData: RentalAgreementData = {
  contractCity: "",
  landlordFullName: "",
  landlordPassport: "",
  landlordAddress: "",
  landlordPhone: "",
  tenantFullName: "",
  tenantPassport: "",
  tenantAddress: "",
  tenantPhone: "",
  propertyType: "apartment",
  propertyAddress: "",
  propertyArea: "",
  propertyRooms: "",
  propertyFloor: "",
  residentsCount: "1",
  residentsInfo: "",
  petsAllowed: "not-allowed",
  propertyInventory: "",
  rentalPrice: "",
  securityDeposit: "",
  contractStartDate: "",
  contractEndDate: "",
  utilitiesIncluded: false,
  additionalConditions: "",
};

export interface FormStepProps {
  formData: RentalAgreementData;
  updateField: (field: keyof RentalAgreementData, value: string | boolean) => void;
}

export const getPropertyTypeName = (type: string) => {
  switch (type) {
    case "apartment": return "квартиру";
    case "room": return "комнату";
    case "house": return "дом";
    default: return "жилое помещение";
  }
};