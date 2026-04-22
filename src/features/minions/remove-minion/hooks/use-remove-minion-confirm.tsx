import { Modal } from "@saltbox/saltbox-frontend-common";
import type { MessageInstance } from "antd/es/message/interface";
import { type ReactNode, useCallback, useState } from "react";
import { useTranslation } from "react-i18next";

import { apiCoreStore } from "saltbox-core/store";

export interface UseRemoveMinionConfirmOptions {
  collectionSlug: string;
  minionMongoId: string;
  minionDisplayId?: string;
  messageApi: MessageInstance;
  onDeleted?: () => void;
}

export interface UseRemoveMinionConfirmResult {
  isRemoving: boolean;
  openConfirm: () => void;
  modalContextHolder: ReactNode;
}

export function useRemoveMinionConfirm({
  collectionSlug,
  minionMongoId,
  minionDisplayId,
  messageApi,
  onDeleted,
}: UseRemoveMinionConfirmOptions): UseRemoveMinionConfirmResult {
  const { t } = useTranslation();
  const [modalApi, modalContextHolder] = Modal.useModal();

  const [isRemoving, setIsRemoving] = useState(false);

  const handleDelete = useCallback(async () => {
    if (!collectionSlug || !minionMongoId) return;
    if (!apiCoreStore.minionsApi) {
      console.error("minionDelete: minionsApi is not initialized");
      messageApi.error(t("minions.delete-failed", { minionId: minionDisplayId }));
      return;
    }

    setIsRemoving(true);
    try {
      await apiCoreStore.minionsApi.minionDelete({
        mid: minionMongoId,
        collection_slug: collectionSlug,
      });
      messageApi.success(t("minions.deleted-successfully", { minionId: minionDisplayId }));
      onDeleted?.();
    } catch (error) {
      messageApi.error(t("minions.delete-failed", { minionId: minionDisplayId }));
      console.error("Failed to delete minion:", error);
    } finally {
      setIsRemoving(false);
    }
  }, [collectionSlug, minionMongoId, t, onDeleted, messageApi, minionDisplayId]);

  const openConfirm = useCallback(() => {
    if (!collectionSlug || !minionMongoId) return;

    modalApi.confirm({
      title: t("minions.delete-confirm-title"),
      content: t("minions.delete-confirm-description", {
        minionId: minionDisplayId,
      }),
      icon: null,
      okText: t("common.delete"),
      cancelText: t("common.cancel"),
      okButtonProps: { danger: true, loading: isRemoving },
      onOk: handleDelete,
    });
  }, [collectionSlug, minionMongoId, modalApi, t, minionDisplayId, isRemoving, handleDelete]);

  return { isRemoving, openConfirm, modalContextHolder };
}
