import { useState, useEffect, useCallback } from "react";
import {
  adminApi,
  AdminRecommendation,
  AdminRecommendationDetail,
  RecommendationsFilter,
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

const STATUS_LABELS: Record<string, string> = {
  pending: "На модерации",
  accepted: "Принята",
  rejected: "Отклонена",
  deleted: "Удалена",
};

const STATUS_BADGE: Record<string, string> = {
  pending: "text-yellow-600 border-yellow-200 bg-yellow-50",
  accepted: "text-green-600 border-green-200 bg-green-50",
  rejected: "text-destructive border-destructive/20 bg-destructive/5",
  deleted: "text-muted-foreground border-muted bg-muted/30",
};

const REC_STATUSES = ["pending", "accepted", "rejected", "deleted"];

function formatDate(dateStr: string | null): string {
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

export default function AdminRecommendations() {
  const [filter, setFilter] = useState<RecommendationsFilter>({
    search: "",
    status: "",
    page: 1,
    limit: 20,
  });
  const [searchInput, setSearchInput] = useState("");
  const [recs, setRecs] = useState<AdminRecommendation[]>([]);
  const [total, setTotal] = useState(0);
  const [pages, setPages] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [selected, setSelected] = useState<AdminRecommendationDetail | null>(null);
  const [panelLoading, setPanelLoading] = useState(false);
  const [statusLoading, setStatusLoading] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState(false);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [photoIndex, setPhotoIndex] = useState(0);

  const loadRecs = useCallback(async (f: RecommendationsFilter) => {
    setLoading(true);
    setError(null);
    try {
      const res = await adminApi.getRecommendations(f);
      setRecs(res.recommendations);
      setTotal(res.total);
      setPages(res.pages);
    } catch (_e) {
      setError("Не удалось загрузить список рекомендаций");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadRecs(filter);
  }, [filter, loadRecs]);

  const handleSearch = () =>
    setFilter((f) => ({ ...f, search: searchInput, page: 1 }));

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") handleSearch();
  };

  const handleStatusFilter = (value: string) =>
    setFilter((f) => ({ ...f, status: value === "all" ? "" : value, page: 1 }));

  const handlePage = (newPage: number) =>
    setFilter((f) => ({ ...f, page: newPage }));

  const openPanel = async (rec: AdminRecommendation) => {
    setPanelLoading(true);
    setSelected(null);
    setDeleteConfirm(false);
    setPhotoIndex(0);
    try {
      const detail = await adminApi.getRecommendation(rec.id);
      setSelected(detail);
    } catch (_e) {
      console.error("Ошибка загрузки рекомендации", _e);
    } finally {
      setPanelLoading(false);
    }
  };

  const handleStatusChange = async (newStatus: string) => {
    if (!selected) return;
    setStatusLoading(true);
    try {
      await adminApi.updateRecStatus(selected.id, newStatus);
      const updated = await adminApi.getRecommendation(selected.id);
      setSelected(updated);
      setRecs((prev) =>
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
      await adminApi.deleteRecommendation(selected.id);
      setRecs((prev) => prev.filter((r) => r.id !== selected.id));
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
      {/* Основная область */}
      <div className="flex-1 p-6 overflow-auto">
        <div className="mb-6">
          <h1 className="text-xl font-semibold text-foreground">Рекомендации</h1>
          <p className="text-sm text-muted-foreground mt-1">Всего: {total}</p>
        </div>

        {/* Фильтры */}
        <div className="flex flex-wrap gap-3 mb-5">
          <div className="flex gap-2 flex-1 min-w-[220px]">
            <Input
              placeholder="Поиск по адресу, заявке, email..."
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
            <SelectTrigger className="w-44">
              <SelectValue placeholder="Статус" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Все статусы</SelectItem>
              <SelectItem value="pending">На модерации</SelectItem>
              <SelectItem value="accepted">Принятые</SelectItem>
              <SelectItem value="rejected">Отклонённые</SelectItem>
              <SelectItem value="deleted">Удалённые</SelectItem>
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
        ) : recs.length === 0 ? (
          <div className="text-center py-20 text-muted-foreground">Рекомендации не найдены</div>
        ) : (
          <>
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
                      onClick={() => openPanel(rec)}
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
        <aside className="w-80 shrink-0 border-l bg-background overflow-auto">
          <div className="flex items-center justify-between px-5 py-4 border-b">
            <span className="font-medium text-sm">Детали рекомендации</span>
            <button
              onClick={() => setSelected(null)}
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
              {/* Статус */}
              <div>
                <div className="font-semibold text-foreground">
                  {selected.address || "Адрес не указан"}
                </div>
                <div className="text-xs text-muted-foreground mt-1">#{selected.id}</div>
                <Badge
                  variant="outline"
                  className={`text-xs mt-2 ${STATUS_BADGE[selected.status] || ""}`}
                >
                  {STATUS_LABELS[selected.status] || selected.status}
                </Badge>
              </div>

              {/* Фото */}
              {selected.photos && selected.photos.length > 0 && (
                <div className="space-y-2">
                  <div className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                    Фото ({selected.photos.length})
                  </div>
                  <div className="relative rounded-lg overflow-hidden bg-muted aspect-video">
                    <img
                      src={selected.photos[photoIndex]}
                      alt="Фото объекта"
                      className="w-full h-full object-cover"
                    />
                    {selected.photos.length > 1 && (
                      <div className="absolute bottom-2 right-2 flex gap-1">
                        <button
                          onClick={() => setPhotoIndex((i) => Math.max(0, i - 1))}
                          disabled={photoIndex === 0}
                          className="w-6 h-6 rounded bg-black/50 text-white flex items-center justify-center disabled:opacity-30"
                        >
                          <Icon name="ChevronLeft" size={12} />
                        </button>
                        <button
                          onClick={() =>
                            setPhotoIndex((i) => Math.min(selected.photos.length - 1, i + 1))
                          }
                          disabled={photoIndex === selected.photos.length - 1}
                          className="w-6 h-6 rounded bg-black/50 text-white flex items-center justify-center disabled:opacity-30"
                        >
                          <Icon name="ChevronRight" size={12} />
                        </button>
                      </div>
                    )}
                  </div>
                  <div className="text-xs text-muted-foreground text-center">
                    {photoIndex + 1} / {selected.photos.length}
                  </div>
                </div>
              )}

              {/* Параметры объекта */}
              <div className="space-y-2">
                <div className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Объект</div>
                <InfoRow icon="Home" label="Комнат" value={selected.rooms} />
                <InfoRow icon="Maximize2" label="Площадь" value={selected.area ? `${selected.area} м²` : null} />
                <InfoRow icon="Layers" label="Этаж" value={
                  selected.floor && selected.total_floors
                    ? `${selected.floor} из ${selected.total_floors}`
                    : selected.floor || null
                } />
                <InfoRow icon="Wallet" label="Аренда" value={selected.rent ? `${selected.rent} ₽/мес.` : null} />
                <div className="flex gap-3 text-sm">
                  <span className={`flex items-center gap-1 ${selected.has_furniture ? "text-green-600" : "text-muted-foreground"}`}>
                    <Icon name={selected.has_furniture ? "CheckCircle" : "Circle"} size={13} />
                    Мебель
                  </span>
                  <span className={`flex items-center gap-1 ${selected.has_appliances ? "text-green-600" : "text-muted-foreground"}`}>
                    <Icon name={selected.has_appliances ? "CheckCircle" : "Circle"} size={13} />
                    Техника
                  </span>
                </div>
              </div>

              {/* Заявка */}
              {selected.request_name && (
                <div className="space-y-1">
                  <div className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Заявка</div>
                  <InfoRow icon="FileText" label="Название" value={selected.request_name} />
                </div>
              )}

              {/* Рекомендатель */}
              <div className="space-y-2">
                <div className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Рекомендатель</div>
                <InfoRow icon="User" label="Имя" value={selected.author_name} />
                <InfoRow icon="Mail" label="Email" value={selected.author_email} />
                <InfoRow icon="Phone" label="Телефон" value={selected.author_phone} />
              </div>

              {/* Владелец объекта */}
              <div className="space-y-1">
                <div className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Владелец объекта</div>
                <InfoRow icon="Mail" label="Email" value={selected.owner_email} />
              </div>

              {/* Комментарий */}
              {selected.property_comments && (
                <div className="space-y-1">
                  <div className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Комментарий</div>
                  <p className="text-sm text-foreground leading-relaxed">{selected.property_comments}</p>
                </div>
              )}

              {/* Управление статусом */}
              <div className="space-y-2 pt-2 border-t">
                <div className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Изменить статус</div>
                <div className="flex flex-wrap gap-2">
                  {REC_STATUSES.filter((s) => s !== selected.status).map((s) => (
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
                  Удалить рекомендацию
                </Button>
              </div>
            </div>
          ) : null}
        </aside>
      )}

      {/* Диалог подтверждения удаления */}
      <AlertDialog open={deleteConfirm} onOpenChange={setDeleteConfirm}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Удалить рекомендацию?</AlertDialogTitle>
            <AlertDialogDescription>
              Рекомендация по адресу «{selected?.address || "без адреса"}» будет удалена безвозвратно.
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
