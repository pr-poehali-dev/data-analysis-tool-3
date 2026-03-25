import { useState, useEffect, useCallback } from "react";
import {
  adminApi,
  AdminEscrow,
  AdminEscrowDetail,
  EscrowFilter,
  EscrowSummary,
} from "@/hooks/useAdminApi";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import Icon from "@/components/ui/icon";

const STATUS_LABELS: Record<string, string> = {
  pending: "Ожидает",
  frozen: "Заморожена",
  completed: "Завершена",
  cancelled: "Отменена",
  refunded: "Возврат",
};

const STATUS_BADGE: Record<string, string> = {
  pending: "text-yellow-600 border-yellow-200 bg-yellow-50",
  frozen: "text-blue-600 border-blue-200 bg-blue-50",
  completed: "text-green-600 border-green-200 bg-green-50",
  cancelled: "text-destructive border-destructive/20 bg-destructive/5",
  refunded: "text-orange-600 border-orange-200 bg-orange-50",
};

const ESCROW_STATUSES = ["pending", "frozen", "completed", "cancelled", "refunded"];

function formatDate(dateStr: string | null): string {
  if (!dateStr) return "—";
  try {
    return new Date(dateStr).toLocaleDateString("ru-RU", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  } catch {
    return "—";
  }
}

function formatMoney(amount: number): string {
  return amount.toLocaleString("ru-RU", { minimumFractionDigits: 0, maximumFractionDigits: 2 }) + " ₽";
}

export default function AdminEscrow() {
  const [filter, setFilter] = useState<EscrowFilter>({
    search: "",
    status: "",
    page: 1,
    limit: 20,
  });
  const [searchInput, setSearchInput] = useState("");
  const [transactions, setTransactions] = useState<AdminEscrow[]>([]);
  const [total, setTotal] = useState(0);
  const [pages, setPages] = useState(1);
  const [summary, setSummary] = useState<EscrowSummary | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [selected, setSelected] = useState<AdminEscrowDetail | null>(null);
  const [panelLoading, setPanelLoading] = useState(false);
  const [mobilePanel, setMobilePanel] = useState(false);
  const [statusLoading, setStatusLoading] = useState(false);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);

  const loadEscrow = useCallback(async (f: EscrowFilter) => {
    setLoading(true);
    setError(null);
    try {
      const res = await adminApi.getEscrow(f);
      setTransactions(res.transactions);
      setTotal(res.total);
      setPages(res.pages);
      setSummary(res.summary);
    } catch (_e) {
      setError("Не удалось загрузить список сделок");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadEscrow(filter);
  }, [filter, loadEscrow]);

  const handleSearch = () =>
    setFilter((f) => ({ ...f, search: searchInput, page: 1 }));

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") handleSearch();
  };

  const handleStatusFilter = (value: string) =>
    setFilter((f) => ({ ...f, status: value === "all" ? "" : value, page: 1 }));

  const handlePage = (newPage: number) =>
    setFilter((f) => ({ ...f, page: newPage }));

  const openPanel = async (tx: AdminEscrow) => {
    setPanelLoading(true);
    setSelected(null);
    setStatusMessage(null);
    setMobilePanel(true);
    try {
      const detail = await adminApi.getEscrowDetail(tx.id);
      setSelected(detail);
    } catch (_e) {
      console.error("Ошибка загрузки сделки", _e);
    } finally {
      setPanelLoading(false);
    }
  };

  const closePanelMobile = () => {
    setMobilePanel(false);
    setSelected(null);
  };

  const handleStatusChange = async (newStatus: string) => {
    if (!selected) return;
    setStatusLoading(true);
    setStatusMessage(null);
    try {
      await adminApi.updateEscrowStatus(selected.id, newStatus);
      const updated = await adminApi.getEscrowDetail(selected.id);
      setSelected(updated);
      setTransactions((prev) =>
        prev.map((t) =>
          t.id === updated.id ? { ...t, status: updated.status, completed_at: updated.completed_at } : t
        )
      );
      setStatusMessage(`Статус изменён на «${STATUS_LABELS[newStatus]}»`);
    } catch (_e) {
      console.error("Ошибка изменения статуса", _e);
      setStatusMessage("Ошибка при изменении статуса");
    } finally {
      setStatusLoading(false);
    }
  };

  return (
    <div className="flex h-full min-h-screen">
      {/* Основная область — скрываем на мобильных когда открыта панель */}
      <div className={`flex-1 p-6 overflow-auto ${mobilePanel ? "hidden md:block" : "block"}`}>
        <div className="mb-6">
          <h1 className="text-xl font-semibold text-foreground">Сделки (Escrow)</h1>
          <p className="text-sm text-muted-foreground mt-1">Всего: {total}</p>
        </div>

        {/* Карточки-суммы */}
        {summary && (
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
            <SummaryCard
              label="Заморожено"
              value={formatMoney(summary.frozen_amount)}
              icon="Lock"
              color="text-blue-600"
            />
            <SummaryCard
              label="Выплачено"
              value={formatMoney(summary.completed_amount)}
              icon="CheckCircle"
              color="text-green-600"
            />
            <SummaryCard
              label="Всего оборот"
              value={formatMoney(summary.total_amount)}
              icon="Wallet"
              color="text-foreground"
            />
          </div>
        )}

        {/* Фильтры */}
        <div className="flex flex-wrap gap-3 mb-5">
          <div className="flex gap-2 w-full sm:flex-1 sm:min-w-[220px]">
            <Input
              placeholder="Поиск по заявке, арендатору, рекомендателю..."
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              onKeyDown={handleKeyDown}
              className="flex-1"
            />
            <Button variant="outline" size="icon" onClick={handleSearch}>
              <Icon name="Search" size={16} />
            </Button>
          </div>

          <Select defaultValue="all" onValueChange={handleStatusFilter}>
            <SelectTrigger className="w-full sm:w-44">
              <SelectValue placeholder="Статус" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Все статусы</SelectItem>
              <SelectItem value="pending">Ожидает</SelectItem>
              <SelectItem value="frozen">Заморожена</SelectItem>
              <SelectItem value="completed">Завершена</SelectItem>
              <SelectItem value="cancelled">Отменена</SelectItem>
              <SelectItem value="refunded">Возврат</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Таблица */}
        {loading ? (
          <div className="flex items-center justify-center py-20 text-muted-foreground">
            <Icon name="Loader2" size={24} className="animate-spin mr-2" />
            Загрузка...
          </div>
        ) : error ? (
          <div className="text-center py-20 text-destructive">{error}</div>
        ) : transactions.length === 0 ? (
          <div className="text-center py-20 text-muted-foreground">Сделки не найдены</div>
        ) : (
          <>
            <div className="rounded-lg border bg-background overflow-x-auto">
              <table className="w-full text-sm min-w-[680px]">
                <thead>
                  <tr className="border-b bg-muted/40">
                    <th className="text-left px-4 py-3 font-medium text-muted-foreground">Заявка</th>
                    <th className="text-left px-4 py-3 font-medium text-muted-foreground">Арендатор</th>
                    <th className="text-left px-4 py-3 font-medium text-muted-foreground">Рекомендатель</th>
                    <th className="text-left px-4 py-3 font-medium text-muted-foreground">Комиссия</th>
                    <th className="text-left px-4 py-3 font-medium text-muted-foreground">Дата</th>
                    <th className="text-left px-4 py-3 font-medium text-muted-foreground">Статус</th>
                  </tr>
                </thead>
                <tbody>
                  {transactions.map((tx) => (
                    <tr
                      key={tx.id}
                      onClick={() => openPanel(tx)}
                      className={`border-b last:border-0 cursor-pointer transition-colors hover:bg-muted/30 ${
                        selected?.id === tx.id ? "bg-primary/5" : ""
                      }`}
                    >
                      <td className="px-4 py-3">
                        <div className="font-medium text-foreground">{tx.request_name}</div>
                        <div className="text-xs text-muted-foreground">#{tx.id}</div>
                      </td>
                      <td className="px-4 py-3 text-xs text-muted-foreground">
                        <div>{tx.tenant_name}</div>
                        <div>{tx.tenant_email}</div>
                      </td>
                      <td className="px-4 py-3 text-xs text-muted-foreground">
                        <div>{tx.recommender_name}</div>
                        <div>{tx.recommender_email}</div>
                      </td>
                      <td className="px-4 py-3 font-medium text-foreground">
                        {formatMoney(tx.commission_amount)}
                      </td>
                      <td className="px-4 py-3 text-muted-foreground text-xs">
                        {formatDate(tx.created_at)}
                      </td>
                      <td className="px-4 py-3">
                        <Badge
                          variant="outline"
                          className={`text-xs ${STATUS_BADGE[tx.status] || ""}`}
                        >
                          {STATUS_LABELS[tx.status] || tx.status}
                        </Badge>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {pages > 1 && (
              <div className="flex items-center justify-center gap-2 mt-5">
                <Button
                  variant="outline"
                  size="sm"
                  disabled={(filter.page || 1) <= 1}
                  onClick={() => handlePage((filter.page || 1) - 1)}
                >
                  <Icon name="ChevronLeft" size={16} />
                </Button>
                <span className="text-sm text-muted-foreground">
                  Страница {filter.page || 1} из {pages}
                </span>
                <Button
                  variant="outline"
                  size="sm"
                  disabled={(filter.page || 1) >= pages}
                  onClick={() => handlePage((filter.page || 1) + 1)}
                >
                  <Icon name="ChevronRight" size={16} />
                </Button>
              </div>
            )}
          </>
        )}
      </div>

      {/* Боковая панель */}
      {(selected || panelLoading) && (
        <aside className={`
          bg-background overflow-auto border-l
          md:w-80 md:shrink-0 md:static md:block
          ${mobilePanel ? "fixed inset-0 z-30 w-full" : "hidden md:block"}
        `}>
          <div className="flex items-center justify-between px-5 py-4 border-b">
            <div className="flex items-center gap-2">
              <button
                onClick={closePanelMobile}
                className="md:hidden text-muted-foreground hover:text-foreground transition-colors mr-1"
              >
                <Icon name="ArrowLeft" size={18} />
              </button>
              <span className="font-medium text-sm">Детали сделки</span>
            </div>
            <button
              onClick={() => { setSelected(null); setMobilePanel(false); }}
              className="text-muted-foreground hover:text-foreground transition-colors"
            >
              <Icon name="X" size={16} />
            </button>
          </div>

          {panelLoading ? (
            <div className="flex items-center justify-center py-20 text-muted-foreground">
              <Icon name="Loader2" size={20} className="animate-spin mr-2" />
              Загрузка...
            </div>
          ) : selected ? (
            <div className="p-5 space-y-5">
              {/* Заголовок */}
              <div>
                <div className="font-semibold text-foreground">{selected.request_name}</div>
                <div className="text-xs text-muted-foreground mt-1">Сделка #{selected.id}</div>
                <Badge
                  variant="outline"
                  className={`text-xs mt-2 ${STATUS_BADGE[selected.status] || ""}`}
                >
                  {STATUS_LABELS[selected.status] || selected.status}
                </Badge>
              </div>

              {/* Финансы */}
              <div className="rounded-lg border bg-muted/10 p-4 space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Аренда</span>
                  <span className="font-medium">{formatMoney(selected.rent_amount)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Комиссия</span>
                  <span className="font-semibold text-primary">{formatMoney(selected.commission_amount)}</span>
                </div>
              </div>

              {/* Участники */}
              <div className="space-y-3">
                <div className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Участники</div>
                <div className="space-y-1">
                  <div className="text-xs text-muted-foreground">Арендатор</div>
                  <div className="text-sm font-medium">{selected.tenant_name}</div>
                  <div className="text-xs text-muted-foreground">{selected.tenant_email}</div>
                </div>
                <div className="space-y-1">
                  <div className="text-xs text-muted-foreground">Рекомендатель</div>
                  <div className="text-sm font-medium">{selected.recommender_name}</div>
                  <div className="text-xs text-muted-foreground">{selected.recommender_email}</div>
                </div>
              </div>

              {/* Даты */}
              <div className="space-y-2">
                <div className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Даты</div>
                <InfoRow icon="CalendarPlus" label="Создана" value={formatDate(selected.created_at)} />
                {selected.completed_at && (
                  <InfoRow icon="CalendarCheck" label="Завершена" value={formatDate(selected.completed_at)} />
                )}
              </div>

              {/* История статусов */}
              {selected.history && selected.history.length > 0 && (
                <div className="space-y-2">
                  <div className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                    История статусов
                  </div>
                  <div className="space-y-2">
                    {selected.history.map((h, i) => (
                      <div key={i} className="flex items-start gap-2">
                        <div className="w-2 h-2 rounded-full bg-primary mt-1.5 shrink-0" />
                        <div>
                          <div className="text-sm text-foreground">{h.label}</div>
                          <div className="text-xs text-muted-foreground">{formatDate(h.date)}</div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Смена статуса */}
              <div className="space-y-2 pt-2 border-t">
                <div className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                  Изменить статус
                </div>
                <div className="text-xs text-muted-foreground mb-2">
                  Только для административной коррекции. Email-уведомления пользователям не отправляются.
                </div>
                <div className="flex flex-wrap gap-2">
                  {ESCROW_STATUSES.filter((s) => s !== selected.status).map((s) => (
                    <Button
                      key={s}
                      variant="outline"
                      size="sm"
                      disabled={statusLoading}
                      onClick={() => handleStatusChange(s)}
                      className="text-xs"
                    >
                      {statusLoading ? (
                        <Icon name="Loader2" size={12} className="animate-spin mr-1" />
                      ) : null}
                      → {STATUS_LABELS[s]}
                    </Button>
                  ))}
                </div>
                {statusMessage && (
                  <div className={`text-xs mt-1 ${statusMessage.startsWith("Ошибка") ? "text-destructive" : "text-green-600"}`}>
                    {statusMessage}
                  </div>
                )}
              </div>
            </div>
          ) : null}
        </aside>
      )}
    </div>
  );
}

function SummaryCard({
  label,
  value,
  icon,
  color,
}: {
  label: string;
  value: string;
  icon: string;
  color: string;
}) {
  return (
    <div className="rounded-lg border bg-background p-4 flex items-center gap-3">
      <div className={`${color}`}>
        <Icon name={icon} size={20} />
      </div>
      <div>
        <div className="text-xs text-muted-foreground">{label}</div>
        <div className={`font-semibold text-base ${color}`}>{value}</div>
      </div>
    </div>
  );
}

function InfoRow({ icon, label, value }: { icon: string; label: string; value: string | null | undefined }) {
  return (
    <div className="flex items-start gap-2 text-sm">
      <Icon name={icon} size={14} className="text-muted-foreground mt-0.5 shrink-0" />
      <div className="min-w-0">
        <span className="text-muted-foreground">{label}: </span>
        <span className="text-foreground">{value || "—"}</span>
      </div>
    </div>
  );
}