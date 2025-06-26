import { formatQuery } from 'react-querybuilder';
import { action, computed, makeObservable, runInAction } from 'mobx';
import { customRuleProcessorMongoDB } from 'saltbox-core/shared/utils/queryBulderUtils';
import { apiStore } from 'saltbox-core/store';
import { FilterStore } from 'saltbox-core/store';

export class MinionFilterStore extends FilterStore {
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
}
