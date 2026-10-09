import type { MinionDetailSchema } from "@saltbox/saltbox-core-api-client";
import type { ReactNode } from "react";

export interface OnFilterButtonParams {
  name: string;
  value: unknown;
}

export type OnFilterButtonHandler = ((params: OnFilterButtonParams) => void) & {
  canApply: (field: string, value: unknown) => boolean;
  isActive: (field: string, value: unknown) => boolean;
};

export interface MinionDetailsCommonProps {
  minion: MinionDetailSchema | null;
  isMinionLoading: boolean;
  isMinionRefreshing?: boolean;
  collectionSlug: string;
  onFilterButton?: OnFilterButtonHandler;
  isFullView?: boolean;
  actionsMenu?: ReactNode;
}
