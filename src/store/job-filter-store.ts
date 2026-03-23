import { PersistentFilterStore } from "@saltbox/saltbox-frontend-common";
import { OptionList } from "react-querybuilder";

export class JobFilterStore extends PersistentFilterStore {
  constructor(schema: OptionList, storageKey: string) {
    super(schema, storageKey);
  }
}
