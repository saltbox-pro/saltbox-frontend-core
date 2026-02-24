import { FilterStore } from "@saltbox/saltbox-frontend-common";
import { makeObservable } from "mobx";
import { OptionList, RuleGroupType } from "react-querybuilder";

const defaultFilters: RuleGroupType = {
  rules: [],
  combinator: "and",
};

export class TasksFilterStore extends FilterStore {
  constructor(filterSchema: OptionList) {
    super();
    this.filterSchema = filterSchema;
    this.searchFilters = defaultFilters;
    this.currentFilters = defaultFilters;
    makeObservable(this);
  }
}
