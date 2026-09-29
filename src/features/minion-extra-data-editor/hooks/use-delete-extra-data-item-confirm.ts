import type { ExtraDataCategoryModel } from "@saltbox/saltbox-core-api-client";
import { Modal, runMutation } from "@saltbox/saltbox-frontend-common";
import { useCallback } from "react";
import { useTranslation } from "react-i18next";

import { CONFIRM_MODAL_WIDTH } from "saltbox-core/shared/constants/confirm-modal";
import { getExtraDataCategoryDisplayName } from "saltbox-core/shared/helpers/extra-data-category-name";

import { deleteMinionExtraDataItem } from "../api/delete-minion-extra-data-item";
import { getExtraDataRecordSummary } from "../helpers/extra-data-record-summary";
import { canAddExtraDataManually, getManualExtraDataRecordId } from "../helpers/manual-extra-data";

type UseDeleteExtraDataItemConfirmParams = {
  category: ExtraDataCategoryModel | null;
  minionId: string;
  onDeleted?: () => void;
};

export function useDeleteExtraDataItemConfirm({
  category,
  minionId,
  onDeleted,
}: UseDeleteExtraDataItemConfirmParams) {
  const { t } = useTranslation();
  const [modalApi, modalContextHolder] = Modal.useModal();

  const isManualCategory = !!category && canAddExtraDataManually(category);

  const canDelete = useCallback(
    (record: Record<string, unknown>) =>
      isManualCategory && getManualExtraDataRecordId(record) !== null,
    [isManualCategory]
  );

  const openConfirm = useCallback(
    (record: Record<string, unknown>) => {
      const itemId = getManualExtraDataRecordId(record);
      if (!category || !itemId) return;

      const name = getExtraDataCategoryDisplayName(t, category.name);
      const summary = getExtraDataRecordSummary(category, record);
      const question = t("minions.extra-data.delete-item.modal-text", { name });

      const deleteItem = async () => {
        const result = await runMutation({
          run: () => deleteMinionExtraDataItem({ category, minionId, itemId }),
          successMessage: t("minions.extra-data.delete-item.success", { name }),
          errorMessage: t("minions.extra-data.delete-item.error"),
        });

        if (!result.ok) return;

        onDeleted?.();
      };

      modalApi.confirm({
        title: t("minions.extra-data.delete-item.modal-title"),
        content: summary ? `${question}\n\n${summary}` : question,
        icon: null,
        width: CONFIRM_MODAL_WIDTH,
        okText: t("common.delete"),
        cancelText: t("common.cancel"),
        okButtonProps: { danger: true },
        styles: { body: { whiteSpace: "pre-line", wordBreak: "break-word" } },
        onOk: deleteItem,
      });
    },
    [category, minionId, modalApi, onDeleted, t]
  );

  return { canDelete, openConfirm, modalContextHolder };
}
