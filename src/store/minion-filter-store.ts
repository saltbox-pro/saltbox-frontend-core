import {formatQuery} from 'react-querybuilder';
import { action, computed, makeObservable, runInAction } from 'mobx';
import { customRuleProcessorMongoDB } from '@packages/utils/queryBulderUtils';
import { apiStore } from '@store/api-store';
import { FilterStore } from '@store/filter-store';

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
