import { OptionList, RuleGroupType, formatQuery } from "react-querybuilder";
import { action, computed, makeObservable } from "mobx";
import { customRuleProcessorMongoDB } from "saltbox-core/shared/utils/queryBulderUtils";
import { FilterStore } from "./filter-store";

/* const emptyFilters: RuleGroupType = {
  rules: [{ field: "source", operator: "in", value: "rest" }],
  combinator: 'and',
  not: false,
};
 */
export class TasksFilterStore extends FilterStore {
  constructor(filterSchema: OptionList) {
    super();
    makeObservable(this);
    this.filterSchema = filterSchema;
  }

  @computed get searchMongoDBQuery() {
    return JSON.parse(
      formatQuery(this.searchFilters, {
        format: "mongodb",
        valueProcessor: customRuleProcessorMongoDB,
      })
    );
  }

  /* handleResetFilters = () => {
    this.currentFilters = emptyFilters;
    this.handelSearch();
  }; */
}
