import {
  SaltBoxJobValueEditor,
  SaltBoxQueryBuilderContainer,
} from "@saltbox/saltbox-frontend-common";

import type { AuditEventsFilterStore } from "../model/audit-events-filter-store";

const CONTROL_ELEMENTS = { valueEditor: SaltBoxJobValueEditor };

type AuditEventsQueryBuilderProps = {
  filterStore: AuditEventsFilterStore;
  onSearch: () => void;
  onReset: () => void;
};

export function AuditEventsQueryBuilder({
  filterStore,
  onSearch,
  onReset,
}: AuditEventsQueryBuilderProps) {
  return (
    <SaltBoxQueryBuilderContainer
      filterStore={filterStore}
      onSearchButtonClick={onSearch}
      onResetButtonClick={onReset}
      controlElements={CONTROL_ELEMENTS}
    />
  );
}
