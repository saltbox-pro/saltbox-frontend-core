import { MinionFilterStore } from "saltbox-core/store";

export const applyFieldValueFilter = (
  filterStore: MinionFilterStore,
  field: string,
  value: unknown
) => {
  filterStore.addFilter({
    field,
    operator: "=",
    valueSource: "value",
    value: String(value ?? ""),
  });
  filterStore.handleSearch();
};
