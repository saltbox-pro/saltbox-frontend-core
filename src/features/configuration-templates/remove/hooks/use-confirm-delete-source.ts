import { Modal } from "@saltbox/saltbox-frontend-common";
import { type ReactNode, useCallback } from "react";
import { useTranslation } from "react-i18next";

export function useConfirmDeleteSource(): {
  confirmDeleteSource: (params: { name: string; onOk: () => void | Promise<void> }) => void;
  modalContextHolder: ReactNode;
} {
  const { t } = useTranslation();
  const [modalApi, modalContextHolder] = Modal.useModal();

  const confirmDeleteSource = useCallback(
    (params: { name: string; onOk: () => void | Promise<void> }) => {
      modalApi.confirm({
        title: t("configuration-templates.source.delete-confirm-title"),
        icon: null,
        content: t("configuration-templates.source.delete-confirm-content", {
          name: params.name,
        }),
        styles: { content: { whiteSpace: "pre-line" } },
        okText: t("common.delete"),
        cancelText: t("common.cancel"),
        okButtonProps: { danger: true },
        onOk: () => Promise.resolve(params.onOk()).catch(() => undefined),
      });
    },
    [modalApi, t]
  );

  return { confirmDeleteSource, modalContextHolder };
}
