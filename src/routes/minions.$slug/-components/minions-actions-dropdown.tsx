import type { TaskTargetMinion } from "@saltbox/saltbox-core-api-client";
import { ActionDropdown, type ActionDropdownItem } from "@saltbox/saltbox-frontend-common";
import { message } from "antd";
import { useMemo } from "react";
import type { RuleGroupType } from "react-querybuilder";

import { useCsvDownloadDropdownItem } from "saltbox-core/features/csv-download";
import { useRemoveMinionsDropdownItem } from "saltbox-core/features/minions/remove-minions";

type SelectedMinion = TaskTargetMinion & { mid: string };

export type MinionsActionsDropdownProps = {
  slug: string;
  searchFilters: RuleGroupType;
  selectedMinions: SelectedMinion[];
  clearSelection: () => void;
  reloadMinions: () => void;
};

export function MinionsActionsDropdown({
  slug,
  selectedMinions,
  searchFilters,
  clearSelection,
  reloadMinions,
}: MinionsActionsDropdownProps) {
  const [messageApi, messageContextHolder] = message.useMessage();

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

  const items = useMemo<ActionDropdownItem[]>(() => {
    const base = [exportAction.item];

    if (selectedMinions.length <= 0) return base;

    const deleteItem = removeAction.item;
    return deleteItem ? [...base, deleteItem] : base;
  }, [exportAction.item, removeAction.item, selectedMinions.length]);

  return (
    <>
      {messageContextHolder}
      {removeAction.modalContextHolder}

      <ActionDropdown menu={{ items }} />
    </>
  );
}
