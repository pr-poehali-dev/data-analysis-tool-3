import Icon from "@/components/ui/icon";

interface AdminLoadingStateProps {
  loading: boolean;
  error?: string | null;
  empty?: boolean;
  emptyText?: string;
  children: React.ReactNode;
}

export default function AdminLoadingState({
  loading,
  error,
  empty,
  emptyText = "Ничего не найдено",
  children,
}: AdminLoadingStateProps) {
  if (loading) {
    return (
      <div className="flex items-center justify-center py-20 text-muted-foreground">
        <Icon name="Loader2" size={24} className="animate-spin mr-2" />
        Загрузка...
      </div>
    );
  }

  if (error) {
    return <div className="text-center py-20 text-destructive">{error}</div>;
  }

  if (empty) {
    return <div className="text-center py-20 text-muted-foreground">{emptyText}</div>;
  }

  return <>{children}</>;
}
