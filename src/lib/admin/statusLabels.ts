export const REC_STATUS_LABELS: Record<string, string> = {
  pending: "На модерации",
  accepted: "Принята",
  rejected: "Отклонена",
  deleted: "Удалена",
};

export const REC_STATUS_BADGE: Record<string, string> = {
  pending: "text-yellow-600 border-yellow-200 bg-yellow-50",
  accepted: "text-green-600 border-green-200 bg-green-50",
  rejected: "text-destructive border-destructive/20 bg-destructive/5",
  deleted: "text-muted-foreground border-muted bg-muted/30",
};

export const REC_STATUSES = ["pending", "accepted", "rejected", "deleted"];

export const REQUEST_STATUS_LABELS: Record<string, string> = {
  active: "Активна",
  in_progress: "В процессе",
  archived: "Архив",
};

export const REQUEST_STATUS_BADGE: Record<string, string> = {
  active: "text-green-600 border-green-200 bg-green-50",
  in_progress: "text-blue-600 border-blue-200 bg-blue-50",
  archived: "text-muted-foreground border-muted bg-muted/30",
};

export const REQUEST_STATUSES = ["active", "in_progress", "archived"];

export const ESCROW_STATUS_LABELS: Record<string, string> = {
  pending: "Ожидает",
  frozen: "Заморожена",
  completed: "Завершена",
  cancelled: "Отменена",
  refunded: "Возврат",
};

export const ESCROW_STATUS_BADGE: Record<string, string> = {
  pending: "text-yellow-600 border-yellow-200 bg-yellow-50",
  frozen: "text-blue-600 border-blue-200 bg-blue-50",
  completed: "text-green-600 border-green-200 bg-green-50",
  cancelled: "text-destructive border-destructive/20 bg-destructive/5",
  refunded: "text-orange-600 border-orange-200 bg-orange-50",
};

export const ESCROW_STATUSES = ["pending", "frozen", "completed", "cancelled", "refunded"];

export const FEEDBACK_STATUS_LABELS: Record<string, string> = {
  new: "Новое",
  read: "Прочитано",
  replied: "Отвечено",
};

export const FEEDBACK_STATUS_BADGE: Record<string, string> = {
  new: "text-blue-600 border-blue-200 bg-blue-50",
  read: "text-muted-foreground border-muted bg-muted/30",
  replied: "text-green-600 border-green-200 bg-green-50",
};

export const FEEDBACK_SUBJECT_BADGE: Record<string, string> = {
  Проблема: "text-destructive border-destructive/20 bg-destructive/5",
  Вопрос: "text-yellow-600 border-yellow-200 bg-yellow-50",
  Предложение: "text-blue-600 border-blue-200 bg-blue-50",
};

export const ROLE_LABELS: Record<string, string> = {
  tenant: "Арендатор",
  recommender: "Рекомендатель",
  landlord: "Арендодатель",
};

export const ROLE_LABELS_PLURAL: Record<string, string> = {
  tenant: "Арендаторы",
  recommender: "Рекомендатели",
  landlord: "Арендодатели",
};

export const ACTION_LABELS: Record<string, string> = {
  block_user: "Блокировка пользователя",
  unblock_user: "Разблокировка пользователя",
  update_request_status: "Смена статуса заявки",
  delete_request: "Удаление заявки",
  update_rec_status: "Смена статуса рекомендации",
  delete_recommendation: "Удаление рекомендации",
  update_escrow_status: "Смена статуса сделки",
  delete_review: "Удаление отзыва",
  mark_feedback_read: "Прочитано обращение",
  reply_feedback: "Ответ на обращение",
};

export const ACTION_ICONS: Record<string, string> = {
  block_user: "UserX",
  unblock_user: "UserCheck",
  update_request_status: "RefreshCw",
  delete_request: "Trash2",
  update_rec_status: "RefreshCw",
  delete_recommendation: "Trash2",
  update_escrow_status: "RefreshCw",
  delete_review: "Trash2",
  mark_feedback_read: "MailOpen",
  reply_feedback: "Reply",
};

export const ACTION_COLORS: Record<string, string> = {
  block_user: "bg-red-100 text-red-600",
  unblock_user: "bg-green-100 text-green-600",
  delete_request: "bg-red-100 text-red-600",
  delete_recommendation: "bg-red-100 text-red-600",
  delete_review: "bg-red-100 text-red-600",
  update_request_status: "bg-blue-100 text-blue-600",
  update_rec_status: "bg-blue-100 text-blue-600",
  update_escrow_status: "bg-blue-100 text-blue-600",
  mark_feedback_read: "bg-yellow-100 text-yellow-600",
  reply_feedback: "bg-purple-100 text-purple-600",
};

export const ENTITY_LABELS: Record<string, string> = {
  user: "Пользователь",
  request: "Заявка",
  recommendation: "Рекомендация",
  escrow: "Сделка",
  review: "Отзыв",
  feedback: "Обращение",
};

export const CHART_COLORS = ["#6366f1", "#22c55e", "#f59e0b", "#ef4444", "#8b5cf6", "#06b6d4"];

export const PERIOD_LABELS: Record<string, string> = {
  "1-3": "1–3 мес.",
  "3-6": "3–6 мес.",
  "6-12": "6–12 мес.",
  "12+": "12+ мес.",
};
