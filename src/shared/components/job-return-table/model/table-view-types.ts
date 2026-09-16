import type { LoadSource } from "@saltbox/saltbox-frontend-common";
import type { PaginationState } from "@tanstack/react-table";

export type TableRow = Record<string, unknown>;

export type BackendTableViewProps = {
  columns: string[];
  rows: TableRow[];
  total: number;
  pagination: PaginationState;
  isLoading: boolean;
  loader?: LoadSource;
  onLazyLoad: (pagination: PaginationState) => void;
  isInfoAlertVisible?: boolean;
  onInfoAlertClose?: () => void;
};
