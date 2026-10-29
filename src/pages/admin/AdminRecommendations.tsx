import { useEffect, useState } from "react";
import { useSearchParams } from "@/lib/router-compat";
import {
  adminApi,
  AdminRecommendation,
  AdminRecommendationDetail,
  RecommendationsFilter,
} from "@/hooks/useAdminApi";
import AdminUserFilterBadge from "@/components/admin/AdminUserFilterBadge";
import RecFilters from "./recommendations/RecFilters";
import RecTable from "./recommendations/RecTable";
import RecDetailPanel from "./recommendations/RecDetailPanel";
import { useAdminList } from "@/hooks/admin/useAdminList";
import { useAdminPanel } from "@/hooks/admin/useAdminPanel";

export default function AdminRecommendations() {
  const [searchParams, setSearchParams] = useSearchParams();
  const userIdParam = searchParams.get("user_id") || "";

  const {
    items: recs,
    total,
    pages,
    filter,
    searchInput,
    loading,
    error,
    setSearchInput,
    setFilter,
    handleSearch,
    handleFilterChange,
    handlePage,
  } = useAdminList<AdminRecommendation, RecommendationsFilter>({
    initialFilter: { search: "", status: "", user_id: userIdParam, page: 1, limit: 20 },
    fetchFn: async (f) => {
      const res = await adminApi.getRecommendations(f);
      return { items: res.recommendations, total: res.total, pages: res.pages };
    },
    errorText: "Не удалось загрузить список рекомендаций",
  });

  const {
    selected,
    panelLoading,
    mobilePanel,
    setSelected,
    openPanel: openPanelById,
    closePanel: closePanelMobile,
  } = useAdminPanel<AdminRecommendationDetail>({
    fetchFn: (id) => adminApi.getRecommendation(id),
    onOpen: () => { setDeleteConfirm(false); setPhotoIndex(0); setActionError(""); },
  });

  const [actionError, setActionError] = useState("");
  const [statusLoading, setStatusLoading] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState(false);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [photoIndex, setPhotoIndex] = useState(0);

  const handleStatusFilter = (value: string) => handleFilterChange("status", value);

  useEffect(() => {
    setFilter((f) => (f.user_id === userIdParam ? f : { ...f, user_id: userIdParam, page: 1 }));
  }, [userIdParam, setFilter]);

  const handleResetUserFilter = () => {
    setSearchParams({});
    setFilter((f) => ({ ...f, user_id: "", page: 1 }));
  };
  const openPanel = (rec: AdminRecommendation) => openPanelById(rec.id);

  const handleStatusChange = async (newStatus: string) => {
    if (!selected) return;
    setStatusLoading(true);
    setActionError("");
    try {
      await adminApi.updateRecStatus(selected.id, newStatus);
      const updated = await adminApi.getRecommendation(selected.id);
      setSelected(updated);
      setFilter((f) => ({ ...f }));
    } catch (_e) {
      console.error("Ошибка изменения статуса", _e);
      setActionError(_e instanceof Error ? _e.message : "Не удалось изменить статус рекомендации");
    } finally {
      setStatusLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!selected) return;
    setDeleteLoading(true);
    setActionError("");
    try {
      await adminApi.deleteRecommendation(selected.id);
      closePanelMobile();
      setDeleteConfirm(false);
      setFilter((f) => ({ ...f }));
    } catch (_e) {
      console.error("Ошибка удаления", _e);
      setActionError(_e instanceof Error ? _e.message : "Не удалось удалить рекомендацию");
    } finally {
      setDeleteLoading(false);
    }
  };

  return (
    <div className="flex h-full min-h-screen">
      {/* Основная область — скрываем на мобильных когда открыта панель */}
      <div className={`flex-1 p-6 overflow-auto ${mobilePanel ? "hidden md:block" : "block"}`}>
        <div className="mb-6">
          <h1 className="text-xl font-semibold text-foreground">Рекомендации</h1>
          <p className="text-sm text-muted-foreground mt-1">Всего: {total}</p>
        </div>

        {filter.user_id && (
          <AdminUserFilterBadge userId={filter.user_id} onReset={handleResetUserFilter} />
        )}

        <RecFilters
          searchInput={searchInput}
          filter={filter}
          pages={pages}
          onSearchInputChange={setSearchInput}
          onSearch={handleSearch}
          onKeyDown={(e: React.KeyboardEvent) => { if (e.key === "Enter") handleSearch(); }}
          onStatusFilter={handleStatusFilter}
          onPage={handlePage}
        />

        <RecTable
          recs={recs}
          loading={loading}
          error={error}
          selected={selected}
          onRowClick={openPanel}
        />
      </div>

      <RecDetailPanel
        selected={selected}
        panelLoading={panelLoading}
        mobilePanel={mobilePanel}
        photoIndex={photoIndex}
        statusLoading={statusLoading}
        deleteConfirm={deleteConfirm}
        deleteLoading={deleteLoading}
        actionError={actionError}
        onClearError={() => setActionError("")}
        onClose={closePanelMobile}
        onCloseMobile={closePanelMobile}
        onPhotoIndex={setPhotoIndex}
        onStatusChange={handleStatusChange}
        onDeleteConfirm={setDeleteConfirm}
        onDelete={handleDelete}
      />
    </div>
  );
}