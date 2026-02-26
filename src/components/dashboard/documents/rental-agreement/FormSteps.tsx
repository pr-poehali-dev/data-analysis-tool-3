import { RentalAgreementData } from "./types";
import { Step1GeneralInfo } from "./steps/Step1GeneralInfo";
import { Step2TenantInfo } from "./steps/Step2TenantInfo";
import { Step3PropertyInfo } from "./steps/Step3PropertyInfo";
import { Step4LivingConditions } from "./steps/Step4LivingConditions";
import { Step5RentalTerms } from "./steps/Step5RentalTerms";
import { Step6AdditionalTerms } from "./steps/Step6AdditionalTerms";

interface FormStepsProps {
  step: number;
  formData: RentalAgreementData;
  updateField: (field: keyof RentalAgreementData, value: string | boolean) => void;
}

const STEPS = [
  Step1GeneralInfo,
  Step2TenantInfo,
  Step3PropertyInfo,
  Step4LivingConditions,
  Step5RentalTerms,
  Step6AdditionalTerms,
];

export const FormSteps = ({ step, formData, updateField }: FormStepsProps) => {
  const StepComponent = STEPS[step - 1];
  if (!StepComponent) return null;
  return <StepComponent formData={formData} updateField={updateField} />;
};
