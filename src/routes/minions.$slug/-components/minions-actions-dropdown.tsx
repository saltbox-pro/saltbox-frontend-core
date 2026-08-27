import type { TaskTargetMinion } from "@saltbox/saltbox-core-api-client";
import { ActionDropdown, type ActionDropdownItem } from "@saltbox/saltbox-frontend-common";
import { message } from "antd";
import { useMemo } from "react";
import type { RuleGroupType } from "react-querybuilder";

import { useCsvDownloadDropdownItem } from "saltbox-core/features/csv-download";
import {
  buildMinionsActionPluginItems,
  useMinionsActionsTick,
} from "saltbox-core/features/minions/actions";
import { useRemoveMinionsDropdownItem } from "saltbox-core/features/minions/remove-minions";

type SelectedMinion = TaskTargetMinion & { mid: string };

export type MinionsActionsDropdownProps = {
  slug: string;
  collectionTitle?: string;
  searchFilters: RuleGroupType;
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
  query,
  clearSelection,
  reloadMinions,
}: MinionsActionsDropdownProps) {
  const [messageApi, messageContextHolder] = message.useMessage();
  useMinionsActionsTick();

  const exportAction = useCsvDownloadDropdownItem({
    slug,
    searchFilters,
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

  const pluginItems = buildMinionsActionPluginItems(pluginActionContext);

  const items = useMemo<ActionDropdownItem[]>(() => {
    const base: ActionDropdownItem[] = [...pluginItems, exportAction.item];

    if (selectedMinions.length <= 0) return base;

    const deleteItem = removeAction.item;
    return deleteItem ? [...base, deleteItem] : base;
  }, [pluginItems, exportAction.item, removeAction.item, selectedMinions.length]);

  return (
    <>
      {messageContextHolder}
      {removeAction.modalContextHolder}

      <ActionDropdown menu={{ items }} />
    </>
  );
}
