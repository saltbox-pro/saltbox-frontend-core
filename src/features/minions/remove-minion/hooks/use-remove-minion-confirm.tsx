import { Modal, notify, runMutation } from "@saltbox/saltbox-frontend-common";
import { type ReactNode, useCallback, useState } from "react";
import { useTranslation } from "react-i18next";

import { apiCoreStore } from "saltbox-core/store";

export interface UseRemoveMinionConfirmOptions {
  collectionSlug: string;
  minionMongoId: string;
  minionDisplayId?: string;
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
  onDeleted,
}: UseRemoveMinionConfirmOptions): UseRemoveMinionConfirmResult {
  const { t } = useTranslation();
  const [modalApi, modalContextHolder] = Modal.useModal();

  const [isRemoving, setIsRemoving] = useState(false);

  const handleDelete = useCallback(async () => {
    if (!collectionSlug || !minionMongoId) return;

    setIsRemoving(true);

    const result = await runMutation({
      run: () =>
        apiCoreStore.minionsApi?.minionDelete({
          mid: minionMongoId,
          collection_slug: collectionSlug,
        }) ?? Promise.reject(new Error("Minions API is not available")),
      errorMessage: t("minions.delete-failed", { minionId: minionDisplayId }),
    });

    setIsRemoving(false);
    if (!result.ok) return;

    notify.success(t("minions.deleted-successfully", { minionId: minionDisplayId }));
    onDeleted?.();
  }, [collectionSlug, minionMongoId, t, onDeleted, minionDisplayId]);

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
