export interface OnboardingTourStep {
  /** Должен совпадать с data-tour-id соответствующей кнопки нижнего меню */
  id: string;
  title: string;
  description: string;
}

// Порядок шагов соответствует порядку кнопок в нижнем меню (слева направо)
export const onboardingTourSteps: OnboardingTourStep[] = [
  {
    id: "feed",
    title: "Лента заявок",
    description: "Здесь видны все заявки на поиск жилья от других пользователей. Найдите подходящую и предложите вариант.",
  },
  {
    id: "recommendations",
    title: "Мои рекомендации",
    description: "Варианты жилья, которые вы предложили другим пользователям, и их статус.",
  },
  {
    id: "requests",
    title: "Найти жильё",
    description: "Ваши собственные заявки на поиск жилья: создавайте новые и следите за откликами на них.",
  },
  {
    id: "messages",
    title: "Сообщения",
    description: "Переписка с арендаторами и рекомендателями по заявкам и сделкам.",
  },
  {
    id: "profile",
    title: "Профиль",
    description: "Здесь документы, баланс, отзывы и настройки вашего аккаунта.",
  },
];