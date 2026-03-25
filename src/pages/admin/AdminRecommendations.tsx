import { useState, useEffect, useCallback } from "react";
import {
  adminApi,
  AdminRecommendation,
  AdminRecommendationDetail,
  RecommendationsFilter,
} from "@/hooks/useAdminApi";
import RecFilters from "./recommendations/RecFilters";
import RecTable from "./recommendations/RecTable";
import RecDetailPanel from "./recommendations/RecDetailPanel";

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
  const [mobilePanel, setMobilePanel] = useState(false);
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
    setMobilePanel(true);
    try {
      const detail = await adminApi.getRecommendation(rec.id);
      setSelected(detail);
    } catch (_e) {
      console.error("Ошибка загрузки рекомендации", _e);
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
          onKeyDown={handleKeyDown}
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
