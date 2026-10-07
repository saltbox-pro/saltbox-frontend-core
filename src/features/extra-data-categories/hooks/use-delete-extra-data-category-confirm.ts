import type { ExtraDataCategoryModel } from "@saltbox/saltbox-core-api-client";
import { Modal, runMutation } from "@saltbox/saltbox-frontend-common";
import { useCallback } from "react";
import { useTranslation } from "react-i18next";

import { CONFIRM_MODAL_WIDTH } from "saltbox-core/shared/constants/confirm-modal";

import { deleteExtraDataCategory } from "../api/delete-extra-data-category";

type UseDeleteExtraDataCategoryConfirmParams = {
  category: ExtraDataCategoryModel | null;
  displayName?: string;
  onDeleted?: (category: ExtraDataCategoryModel) => void;
};

export function useDeleteExtraDataCategoryConfirm({
  category,
  displayName,
  onDeleted,
}: UseDeleteExtraDataCategoryConfirmParams) {
  const { t } = useTranslation();
  const [modalApi, modalContextHolder] = Modal.useModal();

  const openConfirm = useCallback(() => {
    if (!category) return;

    const deleteCategory = async () => {
      const result = await runMutation({
        run: () => deleteExtraDataCategory({ source: category.source, name: category.name }),
        successMessage: t("extra-data-categories.delete.success", { name: displayName }),
        errorMessage: t("extra-data-categories.delete.error", { name: displayName }),
      });

      if (!result.ok) return;

      onDeleted?.(category);
    };

    modalApi.confirm({
      title: t("extra-data-categories.delete.modal-title"),
      content: t("extra-data-categories.delete.modal-text", { name: displayName }),
      icon: null,
      width: CONFIRM_MODAL_WIDTH,
      okText: t("common.delete"),
      cancelText: t("common.cancel"),
      okButtonProps: { danger: true },
      styles: { body: { whiteSpace: "pre-line" } },
      onOk: deleteCategory,
    });
  }, [category, displayName, modalApi, onDeleted, t]);

  return { openConfirm, modalContextHolder };
}
