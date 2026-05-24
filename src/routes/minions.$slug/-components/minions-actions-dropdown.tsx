import type { TaskTargetMinion } from "@saltbox/saltbox-core-api-client";
import { ActionDropdown, type ActionDropdownItem } from "@saltbox/saltbox-frontend-common";
import { message } from "antd";
import { useCallback, useMemo } from "react";
import type { RuleGroupType } from "react-querybuilder";

import { useCsvDownloadDropdownItem } from "saltbox-core/features/csv-download";
import { useDeleteSelectedMinionsFlow } from "saltbox-core/features/minions/delete-keys";

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

  const saltKeyTargets = useMemo(
    () => selectedMinions.map(({ minion_id, salt_master }) => ({ minion_id, salt_master })),
    [selectedMinions]
  );

  const handleDeleteSuccess = useCallback(() => {
    reloadMinions();
    clearSelection();
  }, [reloadMinions, clearSelection]);

  const deleteFlow = useDeleteSelectedMinionsFlow({
    collectionSlug: slug,
    minionMongoIds: selectedMinions.map((minion) => minion.mid),
    saltKeyTargets,
    messageApi,
    onSuccess: handleDeleteSuccess,
  });

  const items = useMemo<ActionDropdownItem[]>(() => {
    const base = [exportAction.item];

    if (selectedMinions.length <= 0) return base;

    const deleteItem = deleteFlow.item;
    return deleteItem ? [...base, deleteItem] : base;
  }, [exportAction.item, deleteFlow.item, selectedMinions.length]);

  return (
    <>
      {messageContextHolder}
      {deleteFlow.modalContextHolder}

      <ActionDropdown menu={{ items }} />
    </>
  );
}
