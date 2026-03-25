import { AdminRecommendation, AdminRecommendationDetail } from "@/hooks/useAdminApi";
import { Badge } from "@/components/ui/badge";
import Icon from "@/components/ui/icon";
import { STATUS_LABELS, STATUS_BADGE, formatDate } from "./recConstants";

interface RecTableProps {
  recs: AdminRecommendation[];
  loading: boolean;
  error: string | null;
  selected: AdminRecommendationDetail | null;
  onRowClick: (rec: AdminRecommendation) => void;
}

export default function RecTable({ recs, loading, error, selected, onRowClick }: RecTableProps) {
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

  if (recs.length === 0) {
    return <div className="text-center py-20 text-muted-foreground">Рекомендации не найдены</div>;
  }

  return (
    <div className="rounded-lg border bg-background overflow-hidden">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b bg-muted/40">
            <th className="text-left px-4 py-3 font-medium text-muted-foreground">Объект</th>
            <th className="text-left px-4 py-3 font-medium text-muted-foreground">Рекомендатель</th>
            <th className="text-left px-4 py-3 font-medium text-muted-foreground">Заявка</th>
            <th className="text-left px-4 py-3 font-medium text-muted-foreground">Дата</th>
            <th className="text-left px-4 py-3 font-medium text-muted-foreground">Статус</th>
          </tr>
        </thead>
        <tbody>
          {recs.map((rec) => (
            <tr
              key={rec.id}
              onClick={() => onRowClick(rec)}
              className={`border-b last:border-0 cursor-pointer transition-colors hover:bg-muted/30 ${
                selected?.id === rec.id ? "bg-primary/5" : ""
              }`}
            >
              <td className="px-4 py-3">
                <div className="font-medium text-foreground">
                  {rec.address || "Адрес не указан"}
                </div>
                <div className="text-xs text-muted-foreground">
                  {rec.rooms ? `${rec.rooms} комн.` : "—"}
                  {rec.area ? ` · ${rec.area} м²` : ""}
                  {rec.rent ? ` · ${rec.rent} ₽` : ""}
                </div>
              </td>
              <td className="px-4 py-3 text-xs text-muted-foreground">
                <div>{rec.author_name || "—"}</div>
                <div>{rec.owner_email}</div>
              </td>
              <td className="px-4 py-3 text-xs text-muted-foreground">
                {rec.request_name || "—"}
              </td>
              <td className="px-4 py-3 text-muted-foreground">
                {formatDate(rec.created_at)}
              </td>
              <td className="px-4 py-3">
                <Badge
                  variant="outline"
                  className={`text-xs ${STATUS_BADGE[rec.status] || ""}`}
                >
                  {STATUS_LABELS[rec.status] || rec.status}
                </Badge>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
