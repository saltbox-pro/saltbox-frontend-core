
import { action,  makeObservable, runInAction } from 'mobx';
import { apiCoreStore } from 'saltbox-core/store';
import { FilterStore } from '@saltbox/saltbox-frontend-common';
export class MinionFilterStore extends FilterStore {
  constructor() {
    super();
    makeObservable(this);
  }

  @action
  loadFiltersScheme = () => {
    this.isLoading = true;
    apiCoreStore.filtersApi
      ?.filterSchema()
      .then((schema) => {
        runInAction(() => {
          this.filterSchema = schema as any;
        });
      })
      .finally(() => {
        this.isLoading = false;
      });
  };
}
