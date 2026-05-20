import { PersistentFilterStore } from "@saltbox/saltbox-frontend-common";
import type { OptionList } from "react-querybuilder";

export class PillarsFilterStore extends PersistentFilterStore {
  constructor(filterSchema: OptionList, storageKey?: string) {
    super(filterSchema, storageKey);
  }
}
