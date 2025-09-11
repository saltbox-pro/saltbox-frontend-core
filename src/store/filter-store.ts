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
  @observable isApplyingFilter: boolean = false;

  @computed
  get isSearchEnable() {
    return (
      formatQuery(this.currentFilters, 'json_without_ids') !==
      formatQuery(this.searchFilters, 'json_without_ids')
    );
  }

  @action
  handleFiltersChange = (filters: RuleGroupType) => {
    const previousRulesCount = this.currentFilters.rules.length;
    this.currentFilters = filters;
    if (filters.rules.length < previousRulesCount) {
      this.isApplyingFilter = true;
      this.handelSearch();
      this.isApplyingFilter = false;
    }
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
