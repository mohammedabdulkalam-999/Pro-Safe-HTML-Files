"use client";

import { useCallback, useMemo, useState } from "react";

import { DEFAULT_PAGE_SIZE } from "@/lib/table";
import { useDebouncedValue } from "@/hooks/use-debounced-value";
import type {
  CallsListQueryParams,
  CallsListSortField,
} from "@/validators/calls-list";

export interface CallsTableState {
  page: number;
  pageSize: number;
  sortBy: CallsListSortField;
  sortOrder: "asc" | "desc";
  searchInput: string;
  debouncedSearch: string;
  queryParams: CallsListQueryParams;
  setSearchInput: (value: string) => void;
  setPage: (page: number) => void;
  handleSort: (column: CallsListSortField) => void;
}

export function useCallsTableState(
  initialPageSize = DEFAULT_PAGE_SIZE,
): CallsTableState {
  const [page, setPageState] = useState(1);
  const [pageSize] = useState(initialPageSize);
  const [sortBy, setSortBy] = useState<CallsListSortField>("created_at");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc");
  const [searchInput, setSearchInputState] = useState("");
  const debouncedSearch = useDebouncedValue(searchInput, 300);

  const setSearchInput = useCallback((value: string) => {
    setSearchInputState(value);
    setPageState(1);
  }, []);

  const setPage = useCallback((nextPage: number) => {
    setPageState(Math.max(1, nextPage));
  }, []);

  const handleSort = useCallback(
    (column: CallsListSortField) => {
      if (sortBy === column) {
        setSortOrder((order) => (order === "asc" ? "desc" : "asc"));
      } else {
        setSortBy(column);
        setSortOrder("asc");
      }
      setPageState(1);
    },
    [sortBy],
  );

  const queryParams = useMemo<CallsListQueryParams>(
    () => ({
      page,
      limit: pageSize,
      search: debouncedSearch.trim() || undefined,
      sortBy,
      sortOrder,
    }),
    [page, pageSize, debouncedSearch, sortBy, sortOrder],
  );

  return {
    page,
    pageSize,
    sortBy,
    sortOrder,
    searchInput,
    debouncedSearch,
    queryParams,
    setSearchInput,
    setPage,
    handleSort,
  };
}
