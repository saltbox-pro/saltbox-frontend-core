import { DeleteOutlined } from "@ant-design/icons";
import {
  type ActionDropdownItem,
  Modal,
  notify,
  runMutation,
} from "@saltbox/saltbox-frontend-common";
import { type ReactNode, useCallback, useMemo } from "react";
import { useTranslation } from "react-i18next";

import { useRemoveMinions } from "./use-remove-minions";

export interface UseRemoveMinionsDropdownItemOptions {
  collectionSlug: string;
  minionMongoIds: string[];
  onDeleted?: () => void;
}

export interface UseRemoveMinionsDropdownItemResult {
  item: ActionDropdownItem | null;
  modalContextHolder: ReactNode;
}

export function useRemoveMinionsDropdownItem({
  collectionSlug,
  minionMongoIds,
  onDeleted,
}: UseRemoveMinionsDropdownItemOptions): UseRemoveMinionsDropdownItemResult {
  const { t } = useTranslation();
  const [modalApi, modalContextHolder] = Modal.useModal();

  const { isRemoving, remove } = useRemoveMinions({ collectionSlug });

  const selectedCount = minionMongoIds.length;

  const handleDelete = useCallback(async () => {
    if (!collectionSlug || selectedCount === 0) return;

    const result = await runMutation({
      run: () => remove(minionMongoIds),
      errorMessage: t("minions.delete-selected-failed", { count: selectedCount }),
    });

    if (!result.ok) return;

    notify.success(t("minions.delete-selected-success", { count: selectedCount }));
    onDeleted?.();
  }, [collectionSlug, selectedCount, remove, minionMongoIds, t, onDeleted]);

  const openConfirm = useCallback(() => {
    if (!collectionSlug || selectedCount === 0) return;

    modalApi.confirm({
      title: t("minions.delete-selected-confirm-title"),
      content: t("minions.delete-selected-confirm-description", { count: selectedCount }),
      icon: null,
      okText: t("common.delete"),
      cancelText: t("common.cancel"),
      okButtonProps: { danger: true, loading: isRemoving },
      onOk: handleDelete,
    });
  }, [collectionSlug, selectedCount, modalApi, t, isRemoving, handleDelete]);

  const item = useMemo(() => {
    if (selectedCount <= 0) return null;

    return {
      key: "delete-selected",
      label: t("minions.delete"),
      icon: <DeleteOutlined />,
      danger: true,
      onClick: openConfirm,
    };
  }, [openConfirm, selectedCount, t]);

  return { item, modalContextHolder };
}
