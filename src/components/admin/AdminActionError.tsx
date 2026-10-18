import Icon from "@/components/ui/icon";

interface AdminActionErrorProps {
  message: string;
  onClose: () => void;
  className?: string;
}

export default function AdminActionError({ message, onClose, className = "" }: AdminActionErrorProps) {
  if (!message) return null;

  return (
    <div
      role="alert"
      className={`flex items-start gap-2 rounded-lg border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive ${className}`}
    >
      <Icon name="AlertCircle" size={14} className="mt-0.5 shrink-0" />
      <span className="flex-1 min-w-0 break-words">{message}</span>
      <button
        type="button"
        onClick={onClose}
        aria-label="Закрыть сообщение об ошибке"
        className="shrink-0 text-destructive/70 hover:text-destructive transition-colors"
      >
        <Icon name="X" size={14} />
      </button>
    </div>
  );
}
