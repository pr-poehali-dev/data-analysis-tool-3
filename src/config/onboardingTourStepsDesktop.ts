export interface OnboardingStep {
  targetId: string;
  title: string;
  description: string;
}

export const onboardingTourStepsDesktop: OnboardingStep[] = [
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
    targetId: "documents",
    title: "Документы",
    description: "Документы по сделкам — договоры и подтверждения, всё хранится здесь.",
  },
  {
    targetId: "balance",
    title: "Баланс",
    description: "Вознаграждения и платежи по сделкам — отслеживайте начисления и выплаты.",
  },
  {
    targetId: "reviews",
    title: "Отзывы",
    description: "Отзывы, которые о вас оставили другие пользователи сервиса.",
  },
  {
    targetId: "settings",
    title: "Настройки профиля",
    description: "Личные данные, контакты и настройки аккаунта.",
  },
];
