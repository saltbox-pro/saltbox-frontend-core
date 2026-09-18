import { createLoader, PersistentFilterStore } from "@saltbox/saltbox-frontend-common";
import { action, makeObservable, runInAction } from "mobx";
import { generateID, OptionList, RuleGroupType } from "react-querybuilder";

import { apiCoreStore } from "saltbox-core/store";

type RuleType = RuleGroupType["rules"][number];

export class MinionFilterStore extends PersistentFilterStore {
  readonly filterSchemaLoad = createLoader({
    run: () => apiCoreStore.filtersApi?.filterSchema(),
    onSuccess: (schema) => {
      this.filterSchema = schema as unknown as OptionList;
    },
  });

  constructor(storageKey?: string) {
    super([], storageKey);
    makeObservable(this);
  }

  loadFiltersScheme = () => {
    runInAction(() => {
      this.isLoading = true;
    });
    this.filterSchemaLoad.run().finally(() => {
      runInAction(() => {
        this.isLoading = false;
      });
    });
  };

  @action
  addFilter = (rule: RuleType) => {
    this.currentFilters = {
      ...this.currentFilters,
      rules: [
        ...this.currentFilters.rules,
        {
          ...rule,
          id: rule.id || generateID(),
        },
      ],
    };
  };
}
