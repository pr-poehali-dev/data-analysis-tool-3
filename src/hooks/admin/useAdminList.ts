import { useState, useEffect, useCallback, useRef } from "react";

interface BaseFilter {
  search?: string;
  page?: number;
  limit?: number;
  [key: string]: unknown;
}

interface UseAdminListOptions<TItem, TFilter extends BaseFilter> {
  initialFilter: TFilter;
  fetchFn: (filter: TFilter) => Promise<{ items: TItem[]; total: number; pages: number; [key: string]: unknown }>;
  errorText?: string;
}

interface UseAdminListResult<TItem, TFilter extends BaseFilter> {
  items: TItem[];
  total: number;
  pages: number;
  filter: TFilter;
  searchInput: string;
  loading: boolean;
  error: string | null;
  extra: Record<string, unknown>;
  setSearchInput: (v: string) => void;
  setFilter: React.Dispatch<React.SetStateAction<TFilter>>;
  handleSearch: () => void;
  handleFilterChange: (key: keyof TFilter, value: string, allValue?: string) => void;
  handlePage: (page: number) => void;
  reload: () => void;
}

export function useAdminList<TItem, TFilter extends BaseFilter>({
  initialFilter,
  fetchFn,
  errorText = "Не удалось загрузить данные",
}: UseAdminListOptions<TItem, TFilter>): UseAdminListResult<TItem, TFilter> {
  const [filter, setFilter] = useState<TFilter>(initialFilter);
  const [searchInput, setSearchInputState] = useState(initialFilter.search ?? "");
  const searchInputRef = useRef(searchInput);
  const setSearchInput = (v: string) => {
    searchInputRef.current = v;
    setSearchInputState(v);
  };
  const [items, setItems] = useState<TItem[]>([]);
  const [total, setTotal] = useState(0);
  const [pages, setPages] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [extra, setExtra] = useState<Record<string, unknown>>({});

  const fetchFnRef = useRef(fetchFn);
  fetchFnRef.current = fetchFn;
  const errorTextRef = useRef(errorText);
  errorTextRef.current = errorText;

  const load = useCallback(async (f: TFilter) => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetchFnRef.current(f);
      const { items: resItems, total: resTotal, pages: resPages, ...rest } = res;
      setItems(resItems as TItem[]);
      setTotal(resTotal);
      setPages(resPages);
      setExtra(rest as Record<string, unknown>);
    } catch {
      setError(errorTextRef.current);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load(filter);
  }, [filter, load]);

  const handleSearch = useCallback(() => {
    setFilter((f) => ({ ...f, search: searchInputRef.current, page: 1 }));
  }, []);

  const handleFilterChange = useCallback((key: keyof TFilter, value: string, allValue = "all") => {
    setFilter((f) => ({ ...f, [key]: value === allValue ? "" : value, page: 1 }));
  }, []);

  const handlePage = useCallback((page: number) => {
    setFilter((f) => ({ ...f, page }));
  }, []);

  const reload = useCallback(() => {
    load(filter);
  }, [filter, load]);

  return {
    items,
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
    reload,
  };
}