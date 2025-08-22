import { formatQuery, OptionList } from 'react-querybuilder';
import { parseMongoDB } from 'react-querybuilder/parseMongoDB';
import { action, computed, makeObservable, runInAction } from 'mobx';
import { generateIdsForQuery } from 'saltbox-core/shared/utils/generateIdsForQuery';
import { customRuleProcessorMongoDB } from 'saltbox-core/shared/utils/queryBulderUtils';
import { apiCoreStore } from 'saltbox-core/store';
import { FilterStore } from 'saltbox-core/store';

export class CollectionFilterStore extends FilterStore {
  private isFilterSchemeLoading: boolean;
  private isCollectionLoading: boolean;

  constructor() {
    super();
    makeObservable(this);

    this.isFilterSchemeLoading = false;
    this.isCollectionLoading = false;
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
  setIsCollectionLoading(value: boolean) {
    this.isCollectionLoading = value;
    this.isLoading = this.isCollectionLoading || this.isFilterSchemeLoading;
  }
  @action
  setIsFilterSchemeLoading(value: boolean) {
    this.isFilterSchemeLoading = value;
    this.isLoading = this.isCollectionLoading || this.isFilterSchemeLoading;
  }

  @action
  loadFiltersScheme = () => {
    this.setIsCollectionLoading(true);
    apiCoreStore.filtersApi
      ?.filterSchema()
      .then((schema) => {
        runInAction(() => {
          // TODO: This is a temporary solution to convert the schema to the format that react-querybuilder expects.
          this.filterSchema = schema.reduce<OptionList>((filterSchema, item) => {
            filterSchema.push({
              name: item.name,
              value: item.name,
              label: item.name,
              options: [],
            });
            return filterSchema;
          }, []);
        });
      })
      .finally(() => {
        this.setIsCollectionLoading(false);
      });
  };

  @action
  initializeFromQuery = (query: object) => {
    this.currentFilters = generateIdsForQuery(parseMongoDB(query));
    this.handelSearch();
  };
}
