import { parseMongoDB } from 'react-querybuilder/parseMongoDB';
import { action, makeObservable, runInAction } from 'mobx';
import { generateIdsForQuery } from 'saltbox-core/shared/utils/generateIdsForQuery';
import { FilterStore } from 'saltbox-core/store';
import { apiCoreStore } from 'saltbox-core/store';

export class CollectionPopoverFilterStore extends FilterStore {
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

  @action
  initializeFromQuery = (query: object) => {
    this.currentFilters = generateIdsForQuery(parseMongoDB(query));
    this.handelSearch();
  };
}
