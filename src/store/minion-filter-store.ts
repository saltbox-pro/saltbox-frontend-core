import { createLoader, PersistentFilterStore } from "@saltbox/saltbox-frontend-common";
import { makeObservable, observable, runInAction } from "mobx";
import { OptionList } from "react-querybuilder";

import { apiCoreStore } from "saltbox-core/store";

export class MinionFilterStore extends PersistentFilterStore {
  @observable.ref rawFilterSchema: OptionList = [];

  readonly filterSchemaLoad = createLoader({
    run: () => apiCoreStore.filtersApi?.filterSchema(),
    onSuccess: (schema) => {
      this.rawFilterSchema = schema as unknown as OptionList;
      this.filterSchema = this.rawFilterSchema;
    },
  });

  constructor(storageKey?: string) {
    super([], storageKey);
    makeObservable(this);
  }

  loadFiltersScheme = () => {
    runInAction(() => {
      this.isLoading = true;
    });
    this.filterSchemaLoad.run().finally(() => {
      runInAction(() => {
        this.isLoading = false;
      });
    });
  };
}
