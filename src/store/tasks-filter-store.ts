import { PersistentFilterStore } from "@saltbox/saltbox-frontend-common";
import { OptionList } from "react-querybuilder";

export class TasksFilterStore extends PersistentFilterStore {
  constructor(filterSchema: OptionList, storageKey?: string) {
    super(filterSchema, storageKey);
  }
}
