import { useState, useEffect, useCallback } from "react";
import {
  adminApi,
  AdminRequest,
  AdminRequestDetail,
  RequestsFilter,
} from "@/hooks/useAdminApi";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import Icon from "@/components/ui/icon";
import {
  formatDate,
  REQUEST_STATUS_LABELS as STATUS_LABELS,
  REQUEST_STATUS_BADGE as STATUS_BADGE,
  REQUEST_STATUSES,
} from "@/lib/admin";
import AdminSearchBar from "@/components/admin/AdminSearchBar";
import AdminPagination from "@/components/admin/AdminPagination";
import AdminLoadingState from "@/components/admin/AdminLoadingState";
import AdminDetailPanel from "@/components/admin/AdminDetailPanel";
import StatusBadge from "@/components/admin/StatusBadge";

export default function AdminRequests() {
  const [filter, setFilter] = useState<RequestsFilter>({
    search: "",
    status: "",
    page: 1,
    limit: 20,
  });
  const [searchInput, setSearchInput] = useState("");
  const [requests, setRequests] = useState<AdminRequest[]>([]);
  const [total, setTotal] = useState(0);
  const [pages, setPages] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [selected, setSelected] = useState<AdminRequestDetail | null>(null);
  const [panelLoading, setPanelLoading] = useState(false);
  const [mobilePanel, setMobilePanel] = useState(false);

  const [statusLoading, setStatusLoading] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState(false);
  const [deleteLoading, setDeleteLoading] = useState(false);

  const loadRequests = useCallback(async (f: RequestsFilter) => {
    setLoading(true);
    setError(null);
    try {
      const res = await adminApi.getRequests(f);
      setRequests(res.requests);
      setTotal(res.total);
      setPages(res.pages);
    } catch (_e) {
      setError("Не удалось загрузить список заявок");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadRequests(filter);
  }, [filter, loadRequests]);

  const handleSearch = () =>
    setFilter((f) => ({ ...f, search: searchInput, page: 1 }));

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") handleSearch();
  };

  const handleStatusFilter = (value: string) =>
    setFilter((f) => ({ ...f, status: value === "all" ? "" : value, page: 1 }));

  const handlePage = (newPage: number) =>
    setFilter((f) => ({ ...f, page: newPage }));

  const openPanel = async (req: AdminRequest) => {
    setPanelLoading(true);
    setSelected(null);
    setDeleteConfirm(false);
    setMobilePanel(true);
    try {
      const detail = await adminApi.getRequest(req.id);
      setSelected(detail);
    } catch (_e) {
      console.error("Ошибка загрузки заявки", _e);
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
    try {
      await adminApi.updateRequestStatus(selected.id, newStatus);
      const updated = await adminApi.getRequest(selected.id);
      setSelected(updated);
      setRequests((prev) =>
        prev.map((r) => (r.id === updated.id ? { ...r, status: updated.status } : r))
      );
    } catch (_e) {
      console.error("Ошибка изменения статуса", _e);
    } finally {
      setStatusLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!selected) return;
    setDeleteLoading(true);
    try {
      await adminApi.deleteRequest(selected.id);
      setRequests((prev) => prev.filter((r) => r.id !== selected.id));
      setTotal((t) => t - 1);
      setSelected(null);
      setDeleteConfirm(false);
    } catch (_e) {
      console.error("Ошибка удаления", _e);
    } finally {
      setDeleteLoading(false);
    }
  };

  return (
    <div className="flex h-full min-h-screen">
      {/* Основная область — скрываем на мобильных когда открыта панель */}
      <div className={`flex-1 p-6 overflow-auto ${mobilePanel ? "hidden md:block" : "block"}`}>
        <div className="mb-6">
          <h1 className="text-xl font-semibold text-foreground">Заявки</h1>
          <p className="text-sm text-muted-foreground mt-1">Всего: {total}</p>
        </div>

        {/* Фильтры */}
        <div className="flex flex-wrap gap-3 mb-5">
          <AdminSearchBar
            value={searchInput}
            placeholder="Поиск по названию, городу, email..."
            onChange={setSearchInput}
            onSearch={handleSearch}
          />
          <Select defaultValue="all" onValueChange={handleStatusFilter}>
            <SelectTrigger className="w-full sm:w-44">
              <SelectValue placeholder="Статус" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Все статусы</SelectItem>
              <SelectItem value="active">Активные</SelectItem>
              <SelectItem value="in_progress">В процессе</SelectItem>
              <SelectItem value="archived">Архив</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Таблица */}
        <AdminLoadingState loading={loading} error={error} empty={requests.length === 0} emptyText="Заявки не найдены">
          <>
            <div className="rounded-lg border bg-background overflow-x-auto">
              <table className="w-full text-sm min-w-[620px]">
                <thead>
                  <tr className="border-b bg-muted/40">
                    <th className="text-left px-4 py-3 font-medium text-muted-foreground">Заявка</th>
                    <th className="text-left px-4 py-3 font-medium text-muted-foreground">Автор</th>
                    <th className="text-left px-4 py-3 font-medium text-muted-foreground">Город</th>
                    <th className="text-left px-4 py-3 font-medium text-muted-foreground">Офферов</th>
                    <th className="text-left px-4 py-3 font-medium text-muted-foreground">Дата</th>
                    <th className="text-left px-4 py-3 font-medium text-muted-foreground">Статус</th>
                  </tr>
                </thead>
                <tbody>
                  {requests.map((req) => (
                    <tr
                      key={req.id}
                      onClick={() => openPanel(req)}
                      className={`border-b last:border-0 cursor-pointer transition-colors hover:bg-muted/30 ${
                        selected?.id === req.id ? "bg-primary/5" : ""
                      }`}
                    >
                      <td className="px-4 py-3">
                        <div className="font-medium text-foreground">{req.name}</div>
                        <div className="text-xs text-muted-foreground">
                          {req.housing_type || "—"} · {req.rooms_count ? `${req.rooms_count} комн.` : "—"}
                        </div>
                      </td>
                      <td className="px-4 py-3 text-muted-foreground text-xs">
                        <div>{req.author_name || "—"}</div>
                        <div>{req.user_email}</div>
                      </td>
                      <td className="px-4 py-3 text-muted-foreground">{req.city || "—"}</td>
                      <td className="px-4 py-3 text-muted-foreground">{req.offers_count}</td>
                      <td className="px-4 py-3 text-muted-foreground">{formatDate(req.created_at)}</td>
                      <td className="px-4 py-3">
                        <StatusBadge status={req.status} labels={STATUS_LABELS} styles={STATUS_BADGE} />
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
        <AdminDetailPanel
          title="Детали заявки"
          mobileOpen={mobilePanel}
          onClose={closePanelMobile}
        >
          {panelLoading ? (
            <div className="flex items-center justify-center py-20 text-muted-foreground">
              <Icon name="Loader2" size={20} className="animate-spin mr-2" />
              Загрузка...
            </div>
          ) : selected ? (
            <div className="p-5 space-y-5">
              {/* Заголовок */}
              <div>
                <div className="font-semibold text-foreground">{selected.name}</div>
                <div className="text-xs text-muted-foreground mt-1">#{selected.id}</div>
                <StatusBadge status={selected.status} labels={STATUS_LABELS} styles={STATUS_BADGE} className="mt-2" />
              </div>

              {/* Параметры */}
              <div className="space-y-2">
                <div className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Параметры</div>
                <InfoRow icon="MapPin" label="Город" value={selected.city} />
                <InfoRow icon="Home" label="Тип жилья" value={selected.housing_type} />
                <InfoRow icon="LayoutGrid" label="Комнат" value={selected.rooms_count} />
                <InfoRow icon="Wallet" label="Бюджет" value={
                  selected.budget_min || selected.budget_max
                    ? `${selected.budget_min || "—"} – ${selected.budget_max || "—"} ₽`
                    : selected.budget || null
                } />
                <InfoRow icon="Gift" label="Вознаграждение" value={selected.reward} />
                <InfoRow icon="Calendar" label="Дата въезда" value={selected.move_in_date} />
                <InfoRow icon="Clock" label="Срок аренды" value={selected.rental_period} />
                <InfoRow icon="Users" label="Кто живёт" value={selected.who_will_live} />
                <InfoRow icon="PawPrint" label="Питомцы" value={selected.has_pets} />
              </div>

              {/* Автор */}
              <div className="space-y-2">
                <div className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Автор</div>
                <InfoRow icon="User" label="Имя" value={selected.author_name} />
                <InfoRow icon="Mail" label="Email" value={selected.user_email} />
                <InfoRow icon="Phone" label="Телефон" value={selected.author_phone} />
              </div>

              {/* Офферы */}
              <div className="rounded-lg border bg-muted/20 p-3 text-center">
                <div className="text-2xl font-bold text-foreground">{selected.offers_count}</div>
                <div className="text-xs text-muted-foreground">предложений от рекомендателей</div>
              </div>

              {/* О себе */}
              {selected.about_yourself && (
                <div className="space-y-1">
                  <div className="text-xs font-medium text-muted-foreground uppercase tracking-wide">О себе</div>
                  <p className="text-sm text-foreground leading-relaxed">{selected.about_yourself}</p>
                </div>
              )}

              {/* Управление статусом */}
              <div className="space-y-2 pt-2 border-t">
                <div className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Изменить статус</div>
                <div className="flex flex-wrap gap-2">
                  {REQUEST_STATUSES.filter((s) => s !== selected.status).map((s) => (
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
              </div>

              {/* Удаление */}
              <div className="pt-1">
                <Button
                  variant="outline"
                  size="sm"
                  className="w-full text-destructive border-destructive/30 hover:bg-destructive/5"
                  onClick={() => setDeleteConfirm(true)}
                >
                  <Icon name="Trash2" size={14} className="mr-1.5" />
                  Удалить заявку
                </Button>
              </div>
            </div>
          ) : null}
        </AdminDetailPanel>
      )}

      {/* Диалог подтверждения удаления */}
      <AlertDialog open={deleteConfirm} onOpenChange={setDeleteConfirm}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Удалить заявку?</AlertDialogTitle>
            <AlertDialogDescription>
              Заявка «{selected?.name}» будет удалена безвозвратно. Все связанные рекомендации останутся в системе.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleteLoading}>Отмена</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              disabled={deleteLoading}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {deleteLoading ? (
                <Icon name="Loader2" size={14} className="animate-spin mr-1.5" />
              ) : null}
              Удалить
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
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