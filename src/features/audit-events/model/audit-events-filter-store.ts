import { createLoader, PersistentFilterStore } from "@saltbox/saltbox-frontend-common";
import { makeObservable, observable, runInAction } from "mobx";
import type { OptionList } from "react-querybuilder";

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
}
