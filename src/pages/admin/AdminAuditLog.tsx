import { useEffect, useState } from "react";
import { adminApi, AuditLogEntry, AuditLogResponse } from "@/hooks/useAdminApi";
import Icon from "@/components/ui/icon";
import AdminPagination from "@/components/admin/AdminPagination";
import {
  formatDateShort as formatDateTime,
  ACTION_LABELS,
  ACTION_ICONS,
  ACTION_COLORS,
  ENTITY_LABELS,
} from "@/lib/admin";

const ALL_ACTIONS = Object.keys(ACTION_LABELS);

function DetailsBadge({ details }: { details: Record<string, unknown> }) {
  const entries = Object.entries(details).filter(([, v]) => v !== null && v !== "" && v !== undefined);
  if (entries.length === 0) return null;
  return (
    <div className="flex flex-wrap gap-1 mt-1">
      {entries.map(([k, v]) => (
        <span key={k} className="text-xs bg-muted px-2 py-0.5 rounded text-muted-foreground">
          {k}: <span className="text-foreground font-medium">{String(v)}</span>
        </span>
      ))}
    </div>
  );
}

export default function AdminAuditLog() {
  const [data, setData] = useState<AuditLogResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [page, setPage] = useState(1);
  const [actionFilter, setActionFilter] = useState("all");

  const load = async (p: number, af: string) => {
    setLoading(true);
    setError("");
    try {
      const res = await adminApi.getAuditLog({ page: p, limit: 50, action_filter: af === "all" ? undefined : af });
      setData(res);
    } catch {
      setError("Не удалось загрузить журнал");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load(page, actionFilter);
  }, [page, actionFilter]);

  const handleFilterChange = (val: string) => {
    setActionFilter(val);
    setPage(1);
  };

  return (
    <div className="flex-1 overflow-y-auto p-4 md:p-6">
      <div className="max-w-5xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-xl font-semibold text-foreground">Журнал действий</h1>
            <p className="text-sm text-muted-foreground mt-0.5">
              История всех административных действий
            </p>
          </div>
          {data && (
            <span className="text-sm text-muted-foreground">
              Всего записей: <span className="font-medium text-foreground">{data.total}</span>
            </span>
          )}
        </div>

        {/* Фильтр по типу действия */}
        <div className="mb-4 flex flex-wrap gap-2">
          <button
            onClick={() => handleFilterChange("all")}
            className={`px-3 py-1.5 rounded-lg text-sm transition-colors ${
              actionFilter === "all"
                ? "bg-primary text-primary-foreground font-medium"
                : "bg-muted text-muted-foreground hover:text-foreground"
            }`}
          >
            Все
          </button>
          {ALL_ACTIONS.map((a) => (
            <button
              key={a}
              onClick={() => handleFilterChange(a)}
              className={`px-3 py-1.5 rounded-lg text-sm transition-colors ${
                actionFilter === a
                  ? "bg-primary text-primary-foreground font-medium"
                  : "bg-muted text-muted-foreground hover:text-foreground"
              }`}
            >
              {ACTION_LABELS[a]}
            </button>
          ))}
        </div>

        {loading && (
          <div className="flex items-center justify-center py-20">
            <Icon name="Loader2" size={24} className="animate-spin text-muted-foreground" />
          </div>
        )}

        {error && (
          <div className="bg-red-50 text-red-700 rounded-lg px-4 py-3 text-sm">{error}</div>
        )}

        {!loading && !error && data && data.entries.length === 0 && (
          <div className="flex flex-col items-center justify-center py-20 text-muted-foreground">
            <Icon name="ClipboardList" size={40} className="mb-3 opacity-30" />
            <p className="text-sm">Журнал пуст — действия появятся после первых операций в админке</p>
          </div>
        )}

        {!loading && !error && data && data.entries.length > 0 && (
          <>
            <div className="bg-background rounded-xl border overflow-hidden">
              <div className="divide-y">
                {data.entries.map((entry: AuditLogEntry) => (
                  <div key={entry.id} className="flex items-start gap-3 px-4 py-3 hover:bg-muted/30 transition-colors">
                    <div className={`mt-0.5 w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${ACTION_COLORS[entry.action] || "bg-muted text-muted-foreground"}`}>
                      <Icon name={ACTION_ICONS[entry.action] || "Activity"} size={15} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-sm font-medium text-foreground">
                          {ACTION_LABELS[entry.action] || entry.action}
                        </span>
                        {entry.entity_type && (
                          <span className="text-xs text-muted-foreground">
                            {ENTITY_LABELS[entry.entity_type] || entry.entity_type}
                            {entry.entity_id ? ` #${entry.entity_id}` : ""}
                          </span>
                        )}
                      </div>
                      <DetailsBadge details={entry.details} />
                    </div>
                    <span className="text-xs text-muted-foreground shrink-0 mt-0.5">
                      {formatDateTime(entry.created_at)}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* Пагинация */}
            <AdminPagination page={page} pages={data.pages} onPage={setPage} />
          </>
        )}
      </div>
    </div>
  );
}