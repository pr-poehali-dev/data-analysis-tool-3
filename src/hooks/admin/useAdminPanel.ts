import { useState, useCallback, useRef, useEffect } from "react";

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

  const fetchFnRef = useRef(fetchFn);
  fetchFnRef.current = fetchFn;
  const onOpenRef = useRef(onOpen);
  onOpenRef.current = onOpen;

  const requestIdRef = useRef(0);

  useEffect(() => {
    return () => {
      requestIdRef.current++;
    };
  }, []);

  const openPanel = useCallback(async (id: number) => {
    const requestId = ++requestIdRef.current;
    setPanelLoading(true);
    setSelected(null);
    setMobilePanel(true);
    onOpenRef.current?.();
    try {
      const detail = await fetchFnRef.current(id);
      if (requestId !== requestIdRef.current) return;
      setSelected(detail);
    } catch (_e) {
      if (requestId !== requestIdRef.current) return;
      console.error("Ошибка загрузки деталей", _e);
    } finally {
      if (requestId === requestIdRef.current) setPanelLoading(false);
    }
  }, []);

  const closePanel = useCallback(() => {
    requestIdRef.current++;
    setPanelLoading(false);
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