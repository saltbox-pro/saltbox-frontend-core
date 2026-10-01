import type { TaskTargetMinion } from "@saltbox/saltbox-core-api-client";
import { ActionDropdown, type ActionDropdownItem, UiEvent } from "@saltbox/saltbox-frontend-common";
import { message } from "antd";
import { useMemo } from "react";
import type { OptionList, RuleGroupType } from "react-querybuilder";

import { useMinionsExportDropdownItem } from "saltbox-core/features/minions-export";
import { useAddExtraDataDropdownItem } from "saltbox-core/features/minion-extra-data-editor";
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

  const exportAction = useMinionsExportDropdownItem({
    slug,
    searchFilters,
    filterSchema,
    selectedMinions,
  });

  const selectedMinionMongoIds = useMemo(
    () => selectedMinions.map((minion) => minion.mid),
    [selectedMinions]
  );

  const addExtraDataAction = useAddExtraDataDropdownItem({ minionIds: selectedMinionMongoIds });

  const removeAction = useRemoveMinionsDropdownItem({
    collectionSlug: slug,
    minionMongoIds: selectedMinionMongoIds,
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

  const items: ActionDropdownItem[] = [...pluginItems];
  if (addExtraDataAction.item) {
    items.push(addExtraDataAction.item);
  }
  items.push(exportAction.item);
  if (selectedMinions.length > 0) {
    const deleteItem = removeAction.item;
    if (deleteItem) {
      items.push({ type: "divider" });
      items.push(deleteItem);
    }
  }

  return (
    <>
      {messageContextHolder}
      {removeAction.modalContextHolder}
      {exportAction.modalContextHolder}
      {addExtraDataAction.modal}

      <ActionDropdown menu={{ items }} />
    </>
  );
}
