import { OptionList, RuleGroupType, formatQuery } from 'react-querybuilder';
import { action, computed, observable } from 'mobx';

const emptyFilters: RuleGroupType = {
  rules: [],
  combinator: 'and',
  not: false,
};

export class FilterStore {
  @observable currentFilters: RuleGroupType = emptyFilters;
  @observable searchFilters: RuleGroupType = emptyFilters;
  @observable isLoading: boolean = false;
  @observable filterSchema: OptionList = [];

  @computed
  get isSearchEnable() {
    return (
      formatQuery(this.currentFilters, 'json_without_ids') !==
      formatQuery(this.searchFilters, 'json_without_ids')
    );
  }

  @action
  handleFiltersChange = (filters: RuleGroupType) => {
    this.currentFilters = filters;
  };

  @action
  handleResetFilters = () => {
    this.currentFilters = emptyFilters;
    this.handelSearch();
  };

  @action
  handelSearch = () => {
    this.searchFilters = this.currentFilters;
  };
}
