interface StepIndicatorProps {
  currentStep: number;
}

export const StepIndicator = ({ currentStep }: StepIndicatorProps) => {
  return (
    <div className="mb-6 sm:mb-8">
      <div className="flex items-center gap-4">
        <div
          className={`flex items-center gap-2 ${
            currentStep >= 1 ? "text-primary" : "text-muted-foreground"
          }`}
        >
          <div
            className={`w-8 h-8 sm:w-10 sm:h-10 rounded-full flex items-center justify-center font-semibold ${
              currentStep >= 1
                ? "bg-primary text-white"
                : "bg-gray-200 text-gray-500"
            }`}
          >
            1
          </div>
          <span className="font-medium hidden sm:inline">О себе</span>
        </div>
        <div
          className={`flex-1 h-1 rounded ${
            currentStep >= 2 ? "bg-primary" : "bg-gray-200"
          }`}
        />
        <div
          className={`flex items-center gap-2 ${
            currentStep >= 2 ? "text-primary" : "text-muted-foreground"
          }`}
        >
          <div
            className={`w-8 h-8 sm:w-10 sm:h-10 rounded-full flex items-center justify-center font-semibold ${
              currentStep >= 2
                ? "bg-primary text-white"
                : "bg-gray-200 text-gray-500"
            }`}
          >
            2
          </div>
          <span className="font-medium hidden sm:inline">
            Параметры жилья
          </span>
        </div>
      </div>
    </div>
  );
};