import { createLoader, PersistentFilterStore } from "@saltbox/saltbox-frontend-common";
import { action, computed, makeObservable, observable, runInAction } from "mobx";
import { generateID, type Option, type OptionList } from "react-querybuilder";

import { apiAuditStore } from "saltbox-core/store";

import { withValueRule } from "../helpers/with-value-rule";

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

  @action
  applyValueFilter = (field: string, value: string | boolean) => {
    this.currentFilters = withValueRule(this.currentFilters, {
      id: generateID(),
      field,
      operator: "=",
      valueSource: "value",
      value,
    });
    this.filtersRevision += 1;
    this.handleSearch();
  };
}
