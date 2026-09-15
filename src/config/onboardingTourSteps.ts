export interface OnboardingStep {
  targetId: string;
  title: string;
  description: string;
}

export const onboardingTourSteps: OnboardingStep[] = [
  {
    targetId: "feed",
    title: "Лента заявок",
    description: "Здесь видно, кто ищет жильё прямо сейчас. Можно откликнуться и предложить подходящий вариант.",
  },
  {
    targetId: "requests",
    title: "Найти жильё",
    description: "Ваши заявки на поиск жилья — создавайте новые и следите за откликами на них.",
  },
  {
    targetId: "recommendations",
    title: "Мои рекомендации",
    description: "Варианты жилья, которые вы предложили другим пользователям, и их текущий статус.",
  },
  {
    targetId: "messages",
    title: "Сообщения",
    description: "Переписка по заявкам и предложениям — здесь удобно договориться о показе и деталях.",
  },
  {
    targetId: "profile",
    title: "Профиль",
    description: "Документы, баланс, отзывы о вас и настройки аккаунта — всё в одном месте.",
  },
];
