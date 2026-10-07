import { Modal } from "@saltbox/saltbox-frontend-common";
import { type ReactNode, useCallback } from "react";
import { useTranslation } from "react-i18next";

import { CONFIRM_MODAL_WIDTH } from "saltbox-core/shared/constants/confirm-modal";

export function useConfirmDeleteFile(): {
  confirmDeleteFile: (params: { path: string; onOk: () => void | Promise<void> }) => void;
  modalContextHolder: ReactNode;
} {
  const { t } = useTranslation();
  const [modalApi, modalContextHolder] = Modal.useModal();

  const confirmDeleteFile = useCallback(
    (params: { path: string; onOk: () => void | Promise<void> }) => {
      modalApi.confirm({
        title: t("configuration-templates.source.files-delete-confirm-title"),
        icon: null,
        width: CONFIRM_MODAL_WIDTH,
        content: t("configuration-templates.source.files-delete-confirm-content", {
          path: params.path,
        }),
        okText: t("common.delete"),
        cancelText: t("common.cancel"),
        okButtonProps: { danger: true },
        onOk: () => Promise.resolve(params.onOk()),
      });
    },
    [modalApi, t]
  );

  return { confirmDeleteFile, modalContextHolder };
}
