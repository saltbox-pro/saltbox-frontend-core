import { FilterStore } from "@saltbox/saltbox-frontend-common";
import { makeObservable } from "mobx";
import { OptionList } from "react-querybuilder";

export class JobFilterStore extends FilterStore {
  private static STORAGE_KEY = "jobsFilter";

  constructor(schema: OptionList) {
    super();
    this.filterSchema = schema;
    this.loadFilters();
    makeObservable(this);
  }

  handleSearch = () => {
    localStorage.setItem(JobFilterStore.STORAGE_KEY, JSON.stringify(this.currentFilters));
    this.searchFilters = this.currentFilters;
  };

  handleResetFilters = () => {
    localStorage.removeItem(JobFilterStore.STORAGE_KEY);
    this.currentFilters = {
      combinator: "and",
      rules: [],
    };
    this.searchFilters = this.currentFilters;
  };

  private loadFilters() {
    const saved = localStorage.getItem(JobFilterStore.STORAGE_KEY);
    if (saved) {
      const parsed = JSON.parse(saved);
      this.currentFilters = parsed;
      this.searchFilters = parsed;
    }
  }
}
