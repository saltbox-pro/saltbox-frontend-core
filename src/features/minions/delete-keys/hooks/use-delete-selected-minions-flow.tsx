import { DeleteOutlined } from "@ant-design/icons";
import {
  type ActionDropdownItem,
  Modal,
  isGlobalServerError,
} from "@saltbox/saltbox-frontend-common";
import type { SaltKeyMinion } from "@saltbox/saltbox-core-api-client";
import type { MessageInstance } from "antd/es/message/interface";
import { type ReactNode, useCallback, useMemo } from "react";
import { useTranslation } from "react-i18next";

import { useRemoveMinions } from "saltbox-core/features/minions/remove-minions/hooks/use-remove-minions";

import { useDeleteSaltKeys } from "./use-delete-salt-keys";

export interface UseDeleteSelectedMinionsFlowOptions {
  collectionSlug: string;
  minionMongoIds: string[];
  saltKeyTargets: SaltKeyMinion[];
  messageApi: MessageInstance;
  onSuccess: () => void;
}

export interface UseDeleteSelectedMinionsFlowResult {
  item: ActionDropdownItem | null;
  modalContextHolder: ReactNode;
}

export function useDeleteSelectedMinionsFlow({
  collectionSlug,
  minionMongoIds,
  saltKeyTargets,
  messageApi,
  onSuccess,
}: UseDeleteSelectedMinionsFlowOptions): UseDeleteSelectedMinionsFlowResult {
  const { t } = useTranslation();
  const [modalApi, modalContextHolder] = Modal.useModal();
  const { isRemoving, remove: removeMinions } = useRemoveMinions({ collectionSlug });
  const { isDeleting, remove: removeSaltKeys } = useDeleteSaltKeys();

  const selectedCount = minionMongoIds.length;
  const isBusy = isRemoving || isDeleting;

  const runDeletion = useCallback(
    async (deleteKeys: boolean) => {
      if (!collectionSlug || selectedCount === 0) return;

      try {
        await removeMinions(minionMongoIds);

        if (deleteKeys && saltKeyTargets.length > 0) {
          try {
            await removeSaltKeys(saltKeyTargets);
            messageApi.success(
              t("minions.delete-with-keys-success", {
                minionCount: selectedCount,
                keysCount: saltKeyTargets.length,
              })
            );
          } catch (error) {
            console.error("Failed to delete salt keys:", error);
            if (!isGlobalServerError(error)) {
              messageApi.error(t("minions.delete-keys-after-minions-failed"));
            }
            onSuccess();
            return;
          }
        } else {
          messageApi.success(t("minions.delete-selected-success", { count: selectedCount }));
        }

        onSuccess();
      } catch (error) {
        console.error("Failed to delete selected minions:", error);
        if (!isGlobalServerError(error)) {
          messageApi.error(t("minions.delete-selected-failed", { count: selectedCount }));
        }
      }
    },
    [
      collectionSlug,
      selectedCount,
      removeMinions,
      minionMongoIds,
      saltKeyTargets,
      removeSaltKeys,
      messageApi,
      t,
      onSuccess,
    ]
  );

  const openSaltKeysConfirm = useCallback(() => {
    if (saltKeyTargets.length === 0) {
      runDeletion(false);
      return;
    }

    modalApi.confirm({
      title: t("minions.delete-keys-confirm-title"),
      content: t("minions.delete-keys-confirm-description"),
      icon: null,
      okText: t("common.delete"),
      cancelText: t("common.cancel"),
      okButtonProps: { danger: true, disabled: isBusy },
      cancelButtonProps: { disabled: isBusy },
      onOk: () => runDeletion(true),
      onCancel: () => runDeletion(false),
    });
  }, [saltKeyTargets.length, modalApi, t, isBusy, runDeletion]);

  const openConfirm = useCallback(() => {
    if (!collectionSlug || selectedCount === 0) return;

    modalApi.confirm({
      title: t("minions.delete-selected-confirm-title"),
      content: t("minions.delete-selected-confirm-description", { count: selectedCount }),
      icon: null,
      okText: t("common.delete"),
      cancelText: t("common.cancel"),
      okButtonProps: { danger: true },
      onOk: openSaltKeysConfirm,
    });
  }, [collectionSlug, selectedCount, modalApi, t, openSaltKeysConfirm]);

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
