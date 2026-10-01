import { Modal } from "@saltbox/saltbox-frontend-common";
import { type RefObject, useEffect } from "react";
import { useTranslation } from "react-i18next";

export type DrawerCloseGuard = () => Promise<boolean>;

type UseUnsavedChangesCloseGuardParams = {
  closeGuardRef?: RefObject<DrawerCloseGuard | null>;
  hasUnsavedChanges: boolean;
  onDiscard: () => void;
};

export function useUnsavedChangesCloseGuard({
  closeGuardRef,
  hasUnsavedChanges,
  onDiscard,
}: UseUnsavedChangesCloseGuardParams) {
  const { t } = useTranslation();
  const [modalApi, modalContextHolder] = Modal.useModal();

  useEffect(() => {
    if (!closeGuardRef) return;

    closeGuardRef.current = async () => {
      if (!hasUnsavedChanges) return true;

      return new Promise<boolean>((resolve) => {
        modalApi.confirm({
          title: t("common.unsaved-changes.title"),
          content: t("common.unsaved-changes.content"),
          icon: null,
          okText: t("common.unsaved-changes.leave"),
          cancelText: t("common.cancel"),
          okButtonProps: { danger: true },
          onOk: () => {
            onDiscard();
            resolve(true);
          },
          onCancel: () => resolve(false),
        });
      });
    };

    return () => {
      closeGuardRef.current = null;
    };
  }, [closeGuardRef, hasUnsavedChanges, modalApi, onDiscard, t]);

  return modalContextHolder;
}
