import { OptionList, formatQuery } from 'react-querybuilder';
import { computed, makeObservable } from 'mobx';
import { customRuleProcessorMongoDB } from 'saltbox-core/shared/utils/queryBulderUtils';
import { FilterStore } from 'saltbox-core/store';

export class JobFilterStore extends FilterStore {
  @computed get searchMongoDBQuery() {
    return JSON.parse(
      formatQuery(this.searchFilters, {
        format: "mongodb",
        valueProcessor: customRuleProcessorMongoDB,
      })
    );
  }

  constructor(schema: OptionList) {
    super();
    this.filterSchema = schema;
    makeObservable(this);
  }
}
