export interface DashboardMenuItem {
  id: string;
  label: string;
  shortLabel?: string;
  profileLabel?: string;
  icon: string;
}

export const dashboardMenuItems: DashboardMenuItem[] = [
  { id: "feed", label: "Лента заявок", shortLabel: "Лента", icon: "List" },
  { id: "requests", label: "Найти жильё", shortLabel: "Жильё", icon: "FileText" },
  { id: "recommendations", label: "Мои рекомендации", shortLabel: "Рекомендации", icon: "ThumbsUp" },
  { id: "messages", label: "Сообщения", icon: "MessageSquare" },
  { id: "documents", label: "Документы", icon: "FolderOpen" },
  { id: "balance", label: "Баланс", icon: "Wallet" },
  { id: "reviews", label: "Отзывы", icon: "Star" },
  { id: "settings", label: "Настройки профиля", profileLabel: "Настройка профиля", icon: "Settings" },
];

export const getDashboardMenuItem = (id: string): DashboardMenuItem | undefined =>
  dashboardMenuItems.find((item) => item.id === id);
