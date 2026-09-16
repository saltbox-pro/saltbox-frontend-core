import { createLoader, FilterStore } from "@saltbox/saltbox-frontend-common";
import { makeObservable, runInAction } from "mobx";
import type { OptionList } from "react-querybuilder";

import { apiCoreStore } from "saltbox-core/store";

export class CollectionPopoverFilterStore extends FilterStore {
  readonly filterSchemaLoad = createLoader({
    run: () => apiCoreStore.filtersApi?.filterSchema(),
    onSuccess: (schema) => {
      this.filterSchema = schema as unknown as OptionList;
    },
  });

  constructor() {
    super();
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
