import { useState, useCallback } from "react";

interface UseAdminPanelOptions<TDetail> {
  fetchFn: (id: number) => Promise<TDetail>;
  onOpen?: () => void;
}

interface UseAdminPanelResult<TDetail> {
  selected: TDetail | null;
  panelLoading: boolean;
  mobilePanel: boolean;
  setSelected: React.Dispatch<React.SetStateAction<TDetail | null>>;
  openPanel: (id: number) => Promise<void>;
  closePanel: () => void;
}

export function useAdminPanel<TDetail>({
  fetchFn,
  onOpen,
}: UseAdminPanelOptions<TDetail>): UseAdminPanelResult<TDetail> {
  const [selected, setSelected] = useState<TDetail | null>(null);
  const [panelLoading, setPanelLoading] = useState(false);
  const [mobilePanel, setMobilePanel] = useState(false);

  const openPanel = useCallback(async (id: number) => {
    setPanelLoading(true);
    setSelected(null);
    setMobilePanel(true);
    onOpen?.();
    try {
      const detail = await fetchFn(id);
      setSelected(detail);
    } catch (_e) {
      console.error("Ошибка загрузки деталей", _e);
    } finally {
      setPanelLoading(false);
    }
  }, [fetchFn, onOpen]);

  const closePanel = useCallback(() => {
    setMobilePanel(false);
    setSelected(null);
  }, []);

  return {
    selected,
    panelLoading,
    mobilePanel,
    setSelected,
    openPanel,
    closePanel,
  };
}
