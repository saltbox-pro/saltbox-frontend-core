import { OptionList, formatQuery } from 'react-querybuilder';
import { computed, makeObservable } from 'mobx';
import { customRuleProcessorJsonLogic } from 'saltbox-core/shared/utils/queryBulderUtils';
import { FilterStore } from 'saltbox-core/store';

export class JobFilterStore extends FilterStore {
  @computed
  get searchJsonLogicQuery() {
    if (this.searchFilters.rules.length === 0) return true;
    return formatQuery(this.searchFilters, {
      format: 'jsonlogic',
      ruleProcessor: customRuleProcessorJsonLogic,
    });
  }

  constructor(schema: OptionList) {
    super();
    makeObservable(this);
    this.filterSchema = schema;
  }
}
