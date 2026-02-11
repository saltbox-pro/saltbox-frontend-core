import { FilterStore } from "@saltbox/saltbox-frontend-common";
import { action, makeObservable } from "mobx";
import { OptionList } from "react-querybuilder";

export class JobFilterStore extends FilterStore {
  private storageKey: string;

  constructor(schema: OptionList, storageKey: string) {
    super();
    this.filterSchema = schema;
    this.storageKey = storageKey;
    this.loadFilters();
    makeObservable(this);
  }

  handleSearch = () => {
    localStorage.setItem(this.storageKey, JSON.stringify(this.currentFilters));
    this.searchFilters = this.currentFilters;
  };

  handleResetFilters = () => {
    localStorage.removeItem(this.storageKey);
    this.currentFilters = {
      combinator: "and",
      rules: [],
    };
    this.searchFilters = this.currentFilters;
  };

  @action
  private loadFilters() {
    const saved = localStorage.getItem(this.storageKey);
    if (saved) {
      const parsed = JSON.parse(saved);
      this.currentFilters = parsed;
      this.searchFilters = parsed;
    }
  }
}
