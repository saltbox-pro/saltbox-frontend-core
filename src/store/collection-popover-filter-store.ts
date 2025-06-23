import { parseMongoDB } from 'react-querybuilder/parseMongoDB';
import { action, makeObservable, runInAction } from 'mobx';
import { generateIdsForQuery } from '@packages/utils/generateIdsForQuery';
import { FilterStore } from '@store/filter-store';
import { apiStore } from './api-store';

export class CollectionPopoverFilterStore extends FilterStore {
  constructor() {
    super();
    makeObservable(this);
  }

  @action
  loadFiltersScheme = () => {
    this.isLoading = true;
    apiStore.filtersApi
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
