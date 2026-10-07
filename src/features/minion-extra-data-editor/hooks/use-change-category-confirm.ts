import { Modal } from "@saltbox/saltbox-frontend-common";
import { useCallback } from "react";
import { useTranslation } from "react-i18next";

import { CONFIRM_MODAL_WIDTH } from "saltbox-core/shared/constants/confirm-modal";

export function useChangeCategoryConfirm() {
  const { t } = useTranslation();
  const [modalApi, modalContextHolder] = Modal.useModal();

  const openConfirm = useCallback(
    (onConfirm: () => void) => {
      modalApi.confirm({
        title: t("minions.extra-data.item-form.change-category.title"),
        content: t("minions.extra-data.item-form.change-category.content"),
        icon: null,
        width: CONFIRM_MODAL_WIDTH,
        okText: t("minions.extra-data.item-form.change-category.ok"),
        cancelText: t("common.cancel"),
        onOk: onConfirm,
      });
    },
    [modalApi, t]
  );

  return { openConfirm, modalContextHolder };
}
