import { createLoader, PersistentFilterStore } from "@saltbox/saltbox-frontend-common";
import { action, computed, makeObservable, observable, runInAction } from "mobx";
import { type Option, type OptionList } from "react-querybuilder";

import { hasFilterRule, toggleFilterRule } from "saltbox-core/shared/helpers/toggle-filter-rule";
import { apiAuditStore } from "saltbox-core/store";

export class AuditEventsFilterStore extends PersistentFilterStore {
  @observable.ref rawFilterSchema: OptionList = [];

  readonly filterSchemaLoad = createLoader({
    run: () => apiAuditStore.auditEventsApi?.auditEventsFilterSchema(),
    onSuccess: (schema) => {
      this.rawFilterSchema = schema as unknown as OptionList;
      this.filterSchema = this.rawFilterSchema;
    },
  });

  constructor(storageKey?: string) {
    super([], storageKey);
    makeObservable(this);
  }

  @computed get valueFilterFields(): ReadonlySet<string> {
    const fields = (this.rawFilterSchema as Option[]).filter((field) => {
      const operators = field.operators as Option[] | undefined;
      return !operators || operators.some((operator) => operator.name === "=");
    });
    return new Set(fields.map((field) => field.name));
  }

  loadFilterSchema = () => {
    runInAction(() => {
      this.isLoading = true;
    });
    return this.filterSchemaLoad.run().finally(() => {
      runInAction(() => {
        this.isLoading = false;
      });
    });
  };

  hasValueFilter = (field: string, value: string | boolean): boolean => {
    return hasFilterRule(this.currentFilters, {
      field,
      operator: "=",
      value,
    });
  };

  @action
  applyValueFilter = (field: string, value: string | boolean) => {
    const { group } = toggleFilterRule(
      this.currentFilters,
      { field, operator: "=", value },
      "replace-field"
    );
    this.handleFiltersChange(group);
    this.filtersRevision += 1;
    this.handleSearch();
  };
}
