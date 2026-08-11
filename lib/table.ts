import type {
  ColumnDef,
  PaginationState,
  SortingState,
} from "@tanstack/react-table";

export type DataTableColumn<TData> = ColumnDef<TData, unknown>;

export interface DataTableState {
  pagination: PaginationState;
  sorting: SortingState;
}

export const DEFAULT_PAGE_SIZE = 10;

export const defaultTableState: DataTableState = {
  pagination: {
    pageIndex: 0,
    pageSize: DEFAULT_PAGE_SIZE,
  },
  sorting: [],
};
