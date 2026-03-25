import { AdminRecommendationDetail } from "@/hooks/useAdminApi";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
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
import { STATUS_LABELS, STATUS_BADGE, REC_STATUSES } from "./recConstants";

interface RecDetailPanelProps {
  selected: AdminRecommendationDetail | null;
  panelLoading: boolean;
  mobilePanel: boolean;
  photoIndex: number;
  statusLoading: boolean;
  deleteConfirm: boolean;
  deleteLoading: boolean;
  onClose: () => void;
  onCloseMobile: () => void;
  onPhotoIndex: (fn: (i: number) => number) => void;
  onStatusChange: (newStatus: string) => void;
  onDeleteConfirm: (open: boolean) => void;
  onDelete: () => void;
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

export default function RecDetailPanel({
  selected,
  panelLoading,
  mobilePanel,
  photoIndex,
  statusLoading,
  deleteConfirm,
  deleteLoading,
  onClose,
  onCloseMobile,
  onPhotoIndex,
  onStatusChange,
  onDeleteConfirm,
  onDelete,
}: RecDetailPanelProps) {
  if (!selected && !panelLoading) return null;

  return (
    <>
      <aside className={`
        bg-background overflow-auto border-l
        md:w-80 md:shrink-0 md:static md:block
        ${mobilePanel ? "fixed inset-0 z-30 w-full" : "hidden md:block"}
      `}>
        <div className="flex items-center justify-between px-5 py-4 border-b">
          <div className="flex items-center gap-2">
            <button
              onClick={onCloseMobile}
              className="md:hidden text-muted-foreground hover:text-foreground transition-colors mr-1"
            >
              <Icon name="ArrowLeft" size={18} />
            </button>
            <span className="font-medium text-sm">Детали рекомендации</span>
          </div>
          <button
            onClick={onClose}
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
                        onClick={() => onPhotoIndex((i) => Math.max(0, i - 1))}
                        disabled={photoIndex === 0}
                        className="w-6 h-6 rounded bg-black/50 text-white flex items-center justify-center disabled:opacity-30"
                      >
                        <Icon name="ChevronLeft" size={12} />
                      </button>
                      <button
                        onClick={() => onPhotoIndex((i) => Math.min(selected.photos.length - 1, i + 1))}
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
                    onClick={() => onStatusChange(s)}
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
                onClick={() => onDeleteConfirm(true)}
              >
                <Icon name="Trash2" size={14} className="mr-1.5" />
                Удалить рекомендацию
              </Button>
            </div>
          </div>
        ) : null}
      </aside>

      {/* Диалог подтверждения удаления */}
      <AlertDialog open={deleteConfirm} onOpenChange={onDeleteConfirm}>
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
              onClick={onDelete}
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
    </>
  );
}
