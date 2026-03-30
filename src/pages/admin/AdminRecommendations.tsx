import { useState } from "react";
import {
  adminApi,
  AdminRecommendation,
  AdminRecommendationDetail,
  RecommendationsFilter,
} from "@/hooks/useAdminApi";
import RecFilters from "./recommendations/RecFilters";
import RecTable from "./recommendations/RecTable";
import RecDetailPanel from "./recommendations/RecDetailPanel";
import { useAdminList } from "@/hooks/admin/useAdminList";
import { useAdminPanel } from "@/hooks/admin/useAdminPanel";

export default function AdminRecommendations() {
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
    initialFilter: { search: "", status: "", page: 1, limit: 20 },
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
    onOpen: () => { setDeleteConfirm(false); setPhotoIndex(0); },
  });

  const [statusLoading, setStatusLoading] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState(false);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [photoIndex, setPhotoIndex] = useState(0);

  const handleStatusFilter = (value: string) => handleFilterChange("status", value);
  const openPanel = (rec: AdminRecommendation) => openPanelById(rec.id);

  const handleStatusChange = async (newStatus: string) => {
    if (!selected) return;
    setStatusLoading(true);
    try {
      await adminApi.updateRecStatus(selected.id, newStatus);
      const updated = await adminApi.getRecommendation(selected.id);
      setSelected(updated);
      setFilter((f) => ({ ...f }));
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
      closePanelMobile();
      setDeleteConfirm(false);
      setFilter((f) => ({ ...f }));
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
          <h1 className="text-xl font-semibold text-foreground">Рекомендации</h1>
          <p className="text-sm text-muted-foreground mt-1">Всего: {total}</p>
        </div>

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
        onClose={() => { setSelected(null); setMobilePanel(false); }}
        onCloseMobile={closePanelMobile}
        onPhotoIndex={setPhotoIndex}
        onStatusChange={handleStatusChange}
        onDeleteConfirm={setDeleteConfirm}
        onDelete={handleDelete}
      />
    </div>
  );
}