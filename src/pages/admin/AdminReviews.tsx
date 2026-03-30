import { useState } from "react";
import { adminApi, AdminReview, ReviewsFilter } from "@/hooks/useAdminApi";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
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
import { formatDate } from "@/lib/admin";
import AdminSearchBar from "@/components/admin/AdminSearchBar";
import AdminPagination from "@/components/admin/AdminPagination";
import AdminLoadingState from "@/components/admin/AdminLoadingState";
import { useAdminList } from "@/hooks/admin/useAdminList";

function StarRating({ rating }: { rating: number }) {
  return (
    <div className="flex gap-0.5">
      {[1, 2, 3, 4, 5].map((star) => (
        <Icon
          key={star}
          name="Star"
          size={14}
          className={star <= rating ? "text-yellow-400 fill-yellow-400" : "text-muted-foreground/30"}
        />
      ))}
    </div>
  );
}

export default function AdminReviews() {
  const {
    items: reviews,
    total,
    pages,
    filter,
    searchInput,
    loading,
    error,
    extra,
    setSearchInput,
    setFilter,
    handleSearch,
    handleFilterChange,
    handlePage,
  } = useAdminList<AdminReview, ReviewsFilter>({
    initialFilter: { search: "", rating: "", page: 1, limit: 20 },
    fetchFn: async (f) => {
      const res = await adminApi.getReviews(f);
      return { items: res.reviews, total: res.total, pages: res.pages, avg_rating: res.avg_rating };
    },
    errorText: "Не удалось загрузить отзывы",
  });

  const avgRating = (extra.avg_rating as number) ?? 0;

  const [selected, setSelected] = useState<AdminReview | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState(false);
  const [deleteLoading, setDeleteLoading] = useState(false);

  const handleRatingFilter = (value: string) => handleFilterChange("rating", value);

  const handleDelete = async () => {
    if (!selected) return;
    setDeleteLoading(true);
    try {
      await adminApi.deleteReview(selected.id);
      setSelected(null);
      setDeleteConfirm(false);
      setFilter((f) => ({ ...f }));
    } catch (_e) {
      console.error("Ошибка удаления отзыва", _e);
    } finally {
      setDeleteLoading(false);
    }
  };

  return (
    <div className="flex h-full min-h-screen">
      {/* Основная область */}
      <div className="flex-1 p-6 overflow-auto">
        <div className="mb-6">
          <h1 className="text-xl font-semibold text-foreground">Отзывы</h1>
          <div className="flex items-center gap-4 mt-1">
            <p className="text-sm text-muted-foreground">Всего: {total}</p>
            {avgRating > 0 && (
              <div className="flex items-center gap-1.5">
                <StarRating rating={Math.round(avgRating)} />
                <span className="text-sm text-muted-foreground">Средний: {avgRating}</span>
              </div>
            )}
          </div>
        </div>

        {/* Фильтры */}
        <div className="flex flex-wrap gap-3 mb-5">
          <AdminSearchBar
            value={searchInput}
            placeholder="Поиск по имени, email, тексту..."
            onChange={setSearchInput}
            onSearch={handleSearch}
          />
          <Select defaultValue="all" onValueChange={handleRatingFilter}>
            <SelectTrigger className="w-full sm:w-40">
              <SelectValue placeholder="Рейтинг" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Все оценки</SelectItem>
              <SelectItem value="5">★★★★★ 5</SelectItem>
              <SelectItem value="4">★★★★ 4</SelectItem>
              <SelectItem value="3">★★★ 3</SelectItem>
              <SelectItem value="2">★★ 2</SelectItem>
              <SelectItem value="1">★ 1</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Таблица */}
        <AdminLoadingState loading={loading} error={error} empty={reviews.length === 0} emptyText="Отзывы не найдены">
          <>
            <div className="rounded-lg border bg-background overflow-x-auto">
              <table className="w-full text-sm min-w-[640px]">
                <thead>
                  <tr className="border-b bg-muted/40">
                    <th className="text-left px-4 py-3 font-medium text-muted-foreground">Автор</th>
                    <th className="text-left px-4 py-3 font-medium text-muted-foreground">Получатель</th>
                    <th className="text-left px-4 py-3 font-medium text-muted-foreground">Оценка</th>
                    <th className="text-left px-4 py-3 font-medium text-muted-foreground">Отзыв</th>
                    <th className="text-left px-4 py-3 font-medium text-muted-foreground">Дата</th>
                    <th className="px-4 py-3"></th>
                  </tr>
                </thead>
                <tbody>
                  {reviews.map((review) => (
                    <tr key={review.id} className="border-b last:border-0 hover:bg-muted/20 transition-colors">
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <Avatar className="w-7 h-7">
                            <AvatarImage src={review.reviewer_photo || undefined} />
                            <AvatarFallback className="text-xs bg-primary/10 text-primary">
                              {(review.reviewer_name || "?")[0].toUpperCase()}
                            </AvatarFallback>
                          </Avatar>
                          <div>
                            <div className="font-medium text-foreground text-xs">{review.reviewer_name}</div>
                            <div className="text-xs text-muted-foreground">{review.reviewer_email}</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <Avatar className="w-7 h-7">
                            <AvatarImage src={review.reviewee_photo || undefined} />
                            <AvatarFallback className="text-xs bg-muted text-muted-foreground">
                              {(review.reviewee_name || "?")[0].toUpperCase()}
                            </AvatarFallback>
                          </Avatar>
                          <div>
                            <div className="font-medium text-foreground text-xs">{review.reviewee_name}</div>
                            <div className="text-xs text-muted-foreground">{review.reviewee_email}</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <StarRating rating={review.rating} />
                      </td>
                      <td className="px-4 py-3 max-w-[240px]">
                        <p className="text-sm text-foreground line-clamp-2">
                          {review.comment || <span className="text-muted-foreground italic">Без текста</span>}
                        </p>
                      </td>
                      <td className="px-4 py-3 text-muted-foreground text-xs whitespace-nowrap">
                        {formatDate(review.created_at)}
                      </td>
                      <td className="px-4 py-3">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-7 w-7 text-muted-foreground hover:text-destructive"
                          onClick={() => { setSelected(review); setDeleteConfirm(true); }}
                        >
                          <Icon name="Trash2" size={14} />
                        </Button>
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

      {/* Диалог удаления */}
      <AlertDialog open={deleteConfirm} onOpenChange={setDeleteConfirm}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Удалить отзыв?</AlertDialogTitle>
            <AlertDialogDescription>
              Отзыв от {selected?.reviewer_name} ({selected?.rating} ★) будет удалён безвозвратно.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleteLoading}>Отмена</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              disabled={deleteLoading}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {deleteLoading ? <Icon name="Loader2" size={14} className="animate-spin mr-1.5" /> : null}
              Удалить
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}