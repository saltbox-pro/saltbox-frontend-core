import { Modal } from "@saltbox/saltbox-frontend-common";
import { type ReactNode, useCallback } from "react";
import { useTranslation } from "react-i18next";

export type ConfirmDeleteTemplate = (params: {
  title: string;
  onOk: () => void | Promise<void>;
}) => void;

export function useConfirmDeleteTemplate(): {
  confirmDeleteTemplate: ConfirmDeleteTemplate;
  modalContextHolder: ReactNode;
} {
  const { t } = useTranslation();
  const [modalApi, modalContextHolder] = Modal.useModal();

  const confirmDeleteTemplate = useCallback(
    (params: { title: string; onOk: () => void | Promise<void> }) => {
      modalApi.confirm({
        title: t("configuration-templates.source.template-delete-confirm-title"),
        icon: null,
        content: t("configuration-templates.source.template-delete-confirm-content", {
          title: params.title,
        }),
        okText: t("common.delete"),
        cancelText: t("common.cancel"),
        okButtonProps: { danger: true },
        onOk: () => Promise.resolve(params.onOk()),
      });
    },
    [modalApi, t]
  );

  return { confirmDeleteTemplate, modalContextHolder };
}
