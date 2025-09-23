import { OptionList, RuleGroupType, formatQuery } from "react-querybuilder";
import { computed, makeObservable } from "mobx";
import { customRuleProcessorMongoDB } from "saltbox-core/shared/utils/queryBulderUtils";
import { FilterStore } from "./filter-store";

const defaultFilters: RuleGroupType = {
  rules: [
    {
      field: "source.type",
      operator: "in",
      value: "rest",
      valueSource: "value",
    },
  ],
  combinator: 'and',
};

export class TasksFilterStore extends FilterStore {
  constructor(filterSchema: OptionList) {
    super();
    makeObservable(this);
    this.filterSchema = filterSchema;
    this.searchFilters = defaultFilters;
    this.currentFilters = defaultFilters;
  }

  @computed get searchMongoDBQuery() {
    return JSON.parse(
      formatQuery(this.searchFilters, {
        format: "mongodb",
        valueProcessor: customRuleProcessorMongoDB,
      })
    );
  }
}
