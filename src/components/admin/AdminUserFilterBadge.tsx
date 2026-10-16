import Icon from "@/components/ui/icon";

interface AdminUserFilterBadgeProps {
  userId: string;
  onReset: () => void;
}

export default function AdminUserFilterBadge({ userId, onReset }: AdminUserFilterBadgeProps) {
  return (
    <div className="mb-4 inline-flex items-center gap-2 rounded-lg border border-primary/30 bg-primary/5 px-3 py-1.5 text-sm text-foreground">
      <Icon name="User" size={14} className="text-primary" />
      <span>Только пользователь #{userId}</span>
      <button
        type="button"
        onClick={onReset}
        className="text-muted-foreground hover:text-foreground transition-colors"
        aria-label="Сбросить фильтр по пользователю"
      >
        <Icon name="X" size={14} />
      </button>
    </div>
  );
}
