import { FilterStore } from "@saltbox/saltbox-frontend-common";
import { makeObservable } from "mobx";
import { OptionList } from "react-querybuilder";

export class JobFilterStore extends FilterStore {
  constructor(schema: OptionList) {
    super();
    this.filterSchema = schema;
    makeObservable(this);
  }
}
