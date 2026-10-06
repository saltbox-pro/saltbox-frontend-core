import type { ActionDropdownItem } from "@saltbox/saltbox-frontend-common";

export function buildMinionsActionItems({
  pluginItems,
  addExtraDataItem,
  exportItem,
  deleteItem,
}: {
  pluginItems: ActionDropdownItem[];
  addExtraDataItem: ActionDropdownItem | null;
  exportItem: ActionDropdownItem | null;
  deleteItem: ActionDropdownItem | null;
}): ActionDropdownItem[] {
  const items: ActionDropdownItem[] = [...pluginItems];

  if (addExtraDataItem) {
    items.push(addExtraDataItem);
  }
  if (exportItem) {
    items.push(exportItem);
  }
  if (deleteItem) {
    items.push({ type: "divider" }, deleteItem);
  }

  return items;
}
