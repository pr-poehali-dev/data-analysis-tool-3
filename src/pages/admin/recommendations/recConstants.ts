export const STATUS_LABELS: Record<string, string> = {
  pending: "На модерации",
  accepted: "Принята",
  rejected: "Отклонена",
  deleted: "Удалена",
};

export const STATUS_BADGE: Record<string, string> = {
  pending: "text-yellow-600 border-yellow-200 bg-yellow-50",
  accepted: "text-green-600 border-green-200 bg-green-50",
  rejected: "text-destructive border-destructive/20 bg-destructive/5",
  deleted: "text-muted-foreground border-muted bg-muted/30",
};

export const REC_STATUSES = ["pending", "accepted", "rejected", "deleted"];

export function formatDate(dateStr: string | null): string {
  if (!dateStr) return "—";
  try {
    return new Date(dateStr).toLocaleDateString("ru-RU", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    });
  } catch {
    return "—";
  }
}
