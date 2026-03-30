import { useState } from "react";
import {
  adminApi,
  AdminEscrow,
  AdminEscrowDetail,
  EscrowFilter,
  EscrowSummary,
} from "@/hooks/useAdminApi";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import Icon from "@/components/ui/icon";
import {
  formatDateTime as formatDate,
  formatMoney,
  ESCROW_STATUS_LABELS as STATUS_LABELS,
  ESCROW_STATUS_BADGE as STATUS_BADGE,
  ESCROW_STATUSES,
} from "@/lib/admin";
import AdminSearchBar from "@/components/admin/AdminSearchBar";
import AdminPagination from "@/components/admin/AdminPagination";
import AdminLoadingState from "@/components/admin/AdminLoadingState";
import AdminDetailPanel from "@/components/admin/AdminDetailPanel";
import StatusBadge from "@/components/admin/StatusBadge";
import { useAdminList } from "@/hooks/admin/useAdminList";
import { useAdminPanel } from "@/hooks/admin/useAdminPanel";

export default function AdminEscrow() {
  const {
    items: transactions,
    total,
    pages,
    filter,
    searchInput,
    loading,
    error,
    extra,
    setSearchInput,
    handleSearch,
    handleFilterChange,
    handlePage,
  } = useAdminList<AdminEscrow, EscrowFilter>({
    initialFilter: { search: "", status: "", page: 1, limit: 20 },
    fetchFn: async (f) => {
      const res = await adminApi.getEscrow(f);
      return { items: res.transactions, total: res.total, pages: res.pages, summary: res.summary };
    },
    errorText: "Не удалось загрузить список сделок",
  });

  const summary = (extra.summary as EscrowSummary | null) ?? null;

  const {
    selected,
    panelLoading,
    mobilePanel,
    setSelected,
    openPanel: openPanelById,
    closePanel: closePanelMobile,
  } = useAdminPanel<AdminEscrowDetail>({
    fetchFn: (id) => adminApi.getEscrowDetail(id),
    onOpen: () => setStatusMessage(null),
  });

  const [statusLoading, setStatusLoading] = useState(false);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);

  const handleStatusFilter = (value: string) => handleFilterChange("status", value);
  const openPanel = (tx: AdminEscrow) => openPanelById(tx.id);

  const handleStatusChange = async (newStatus: string) => {
    if (!selected) return;
    setStatusLoading(true);
    setStatusMessage(null);
    try {
      await adminApi.updateEscrowStatus(selected.id, newStatus);
      const updated = await adminApi.getEscrowDetail(selected.id);
      setSelected(updated);
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
          <AdminSearchBar
            value={searchInput}
            placeholder="Поиск по заявке, арендатору, рекомендателю..."
            onChange={setSearchInput}
            onSearch={handleSearch}
          />

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
        <AdminLoadingState loading={loading} error={error} empty={transactions.length === 0} emptyText="Сделки не найдены">
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
                        <StatusBadge status={tx.status} labels={STATUS_LABELS} styles={STATUS_BADGE} />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <AdminPagination page={filter.page || 1} pages={pages} onPage={handlePage} />
          </>
        </AdminLoadingState>
      </div>

      {/* Боковая панель */}
      {(selected || panelLoading) && (
        <AdminDetailPanel title="Детали сделки" mobileOpen={mobilePanel} onClose={closePanelMobile}>
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
                <StatusBadge status={selected.status} labels={STATUS_LABELS} styles={STATUS_BADGE} className="mt-2" />
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
        </AdminDetailPanel>
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