import { FilterStore } from "@saltbox/saltbox-frontend-common";
import { action, makeObservable } from "mobx";
import { OptionList } from "react-querybuilder";

const STORAGE_KEY = "jobsFilter";

export class JobFilterStore extends FilterStore {
  constructor(schema: OptionList) {
    super();
    this.filterSchema = schema;
    this.loadFilters();
    makeObservable(this);
  }

  handleSearch = () => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(this.currentFilters));
    this.searchFilters = this.currentFilters;
  };

  handleResetFilters = () => {
    localStorage.removeItem(STORAGE_KEY);
    this.currentFilters = {
      combinator: "and",
      rules: [],
    };
    this.searchFilters = this.currentFilters;
  };

  @action
  private loadFilters() {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      const parsed = JSON.parse(saved);
      this.currentFilters = parsed;
      this.searchFilters = parsed;
    }
  }
}
