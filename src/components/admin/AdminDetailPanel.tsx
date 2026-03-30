import Icon from "@/components/ui/icon";

interface AdminDetailPanelProps {
  title: string;
  mobileOpen: boolean;
  onClose: () => void;
  children: React.ReactNode;
}

export default function AdminDetailPanel({
  title,
  mobileOpen,
  onClose,
  children,
}: AdminDetailPanelProps) {
  return (
    <aside
      className={`bg-background overflow-auto border-l md:w-80 md:shrink-0 md:static md:block ${
        mobileOpen ? "fixed inset-0 z-30 w-full" : "hidden md:block"
      }`}
    >
      <div className="flex items-center justify-between px-5 py-4 border-b">
        <div className="flex items-center gap-2">
          <button
            onClick={onClose}
            className="md:hidden text-muted-foreground hover:text-foreground transition-colors mr-1"
          >
            <Icon name="ArrowLeft" size={18} />
          </button>
          <span className="font-medium text-sm">{title}</span>
        </div>
        <button
          onClick={onClose}
          className="text-muted-foreground hover:text-foreground transition-colors"
        >
          <Icon name="X" size={16} />
        </button>
      </div>
      {children}
    </aside>
  );
}
