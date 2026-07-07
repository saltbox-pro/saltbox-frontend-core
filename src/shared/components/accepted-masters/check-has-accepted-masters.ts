import { mastersStore } from "saltbox-core/store";

export async function checkHasAcceptedMasters(): Promise<boolean> {
  return mastersStore.hasAcceptedMasters();
}
