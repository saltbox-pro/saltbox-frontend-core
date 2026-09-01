import type { TaskTargetMinion } from "@saltbox/saltbox-core-api-client";
import { ActionDropdown, type ActionDropdownItem, UiEvent } from "@saltbox/saltbox-frontend-common";
import { message } from "antd";
import { useMemo } from "react";
import type { OptionList, RuleGroupType } from "react-querybuilder";

import { useCsvDownloadDropdownItem } from "saltbox-core/features/csv-download";
import { useRemoveMinionsDropdownItem } from "saltbox-core/features/minions/remove-minions";
import {
  buildMinionsActionPluginItems,
  useActionPluginClickGuard,
  usePluginActionsTick,
} from "saltbox-core/features/plugins";

type SelectedMinion = TaskTargetMinion & { mid: string };

export type MinionsActionsDropdownProps = {
  slug: string;
  collectionTitle?: string;
  searchFilters: RuleGroupType;
  filterSchema?: OptionList;
  query: Record<string, unknown>;
  selectedMinions: SelectedMinion[];
  clearSelection: () => void;
  reloadMinions: () => void;
};

export function MinionsActionsDropdown({
  slug,
  collectionTitle,
  selectedMinions,
  searchFilters,
  filterSchema,
  query,
  clearSelection,
  reloadMinions,
}: MinionsActionsDropdownProps) {
  const [messageApi, messageContextHolder] = message.useMessage();
  const actionPluginClickGuard = useActionPluginClickGuard(messageApi);
  usePluginActionsTick(UiEvent.MinionsActionsChanged);

  const exportAction = useCsvDownloadDropdownItem({
    slug,
    searchFilters,
    filterSchema,
    selectedMinions,
    messageApi,
  });

  const removeAction = useRemoveMinionsDropdownItem({
    collectionSlug: slug,
    minionMongoIds: selectedMinions.map((minion) => minion.mid),
    messageApi,
    onDeleted: () => {
      reloadMinions();
      clearSelection();
    },
  });

  const pluginActionContext = useMemo(
    () => ({
      collectionSlug: slug,
      collectionTitle,
      query,
      selectedMinions: selectedMinions.map(({ minion_id, salt_master }) => ({
        minion_id,
        salt_master,
      })),
    }),
    [slug, collectionTitle, query, selectedMinions]
  );

  const pluginItems = buildMinionsActionPluginItems(pluginActionContext, actionPluginClickGuard);

  const items: ActionDropdownItem[] = [...pluginItems, exportAction.item];
  if (selectedMinions.length > 0) {
    const deleteItem = removeAction.item;
    if (deleteItem) {
      items.push(deleteItem);
    }
  }

  return (
    <>
      {messageContextHolder}
      {removeAction.modalContextHolder}

      <ActionDropdown menu={{ items }} />
    </>
  );
}
