import type { PaginationState } from "@tanstack/react-table";

export type TableRow = Record<string, unknown>;

export type BackendTableViewProps = {
  columns: string[];
  rows: TableRow[];
  total: number;
  pagination: PaginationState;
  isLoading: boolean;
  loadError: boolean;
  onLazyLoad: (pagination: PaginationState) => void;
  isInfoAlertVisible?: boolean;
  onInfoAlertClose?: () => void;
};
