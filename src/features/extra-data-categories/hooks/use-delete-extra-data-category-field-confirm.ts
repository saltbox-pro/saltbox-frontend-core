import { Modal } from "@saltbox/saltbox-frontend-common";
import { useCallback } from "react";
import { useTranslation } from "react-i18next";

import { CONFIRM_MODAL_WIDTH } from "saltbox-core/shared/constants/confirm-modal";

export function useDeleteExtraDataCategoryFieldConfirm() {
  const { t } = useTranslation();
  const [modalApi, modalContextHolder] = Modal.useModal();

  const openConfirm = useCallback(
    (fieldName: string, onConfirm: () => void) => {
      modalApi.confirm({
        title: t("extra-data-categories.delete-field.modal-title"),
        content: t("extra-data-categories.delete-field.modal-text", { name: fieldName }),
        icon: null,
        width: CONFIRM_MODAL_WIDTH,
        okText: t("common.delete"),
        cancelText: t("common.cancel"),
        okButtonProps: { danger: true },
        styles: { body: { whiteSpace: "pre-line" } },
        onOk: onConfirm,
      });
    },
    [modalApi, t]
  );

  return { openConfirm, modalContextHolder };
}
