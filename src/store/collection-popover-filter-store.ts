import { formatQuery } from 'react-querybuilder';
import { parseMongoDB } from 'react-querybuilder/parseMongoDB';
import { action, computed, makeObservable, runInAction } from 'mobx';
import { customRuleProcessorMongoDB } from 'saltbox-core/shared/utils/queryBulderUtils';
import { generateIdsForQuery } from 'saltbox-core/shared/utils/generateIdsForQuery';
import { FilterStore } from 'saltbox-core/store';
import { apiCoreStore } from 'saltbox-core/store';

export class CollectionPopoverFilterStore extends FilterStore {
  constructor() {
    super();
    makeObservable(this);
  }

  @computed
  get searchMongoDBQuery(): object {
    return JSON.parse(
      formatQuery(this.searchFilters, {
        format: 'mongodb',
        valueProcessor: customRuleProcessorMongoDB,
      }),
    );
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

