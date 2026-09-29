import type { ExtraDataCategoryModel } from "@saltbox/saltbox-core-api-client";
import { Modal, runMutation } from "@saltbox/saltbox-frontend-common";
import { useCallback } from "react";
import { useTranslation } from "react-i18next";

import { CONFIRM_MODAL_WIDTH } from "saltbox-core/shared/constants/confirm-modal";
import { getExtraDataCategoryDisplayName } from "saltbox-core/shared/helpers/extra-data-category-name";

import { deleteMinionExtraDataItem } from "../api/delete-minion-extra-data-item";
import { getExtraDataRecordSummary } from "../helpers/extra-data-record-summary";
import { canChangeExtraDataRecord, getManualExtraDataRecordId } from "../helpers/manual-extra-data";
import { DeleteExtraDataItemConfirmContent } from "../ui/delete-extra-data-item-confirm-content";

type UseDeleteExtraDataItemConfirmParams = {
  category: ExtraDataCategoryModel | null;
  fields: string[];
  minionId: string;
  onDeleted?: () => void;
};

export function useDeleteExtraDataItemConfirm({
  category,
  fields,
  minionId,
  onDeleted,
}: UseDeleteExtraDataItemConfirmParams) {
  const { t } = useTranslation();
  const [modalApi, modalContextHolder] = Modal.useModal();

  const openConfirm = useCallback(
    (record: Record<string, unknown>) => {
      const itemId = getManualExtraDataRecordId(record);
      if (!category || !itemId || !canChangeExtraDataRecord(category, record)) return;

      const name = getExtraDataCategoryDisplayName(t, category.name);
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
        content: (
          <DeleteExtraDataItemConfirmContent
            question={t("minions.extra-data.delete-item.modal-text", { name })}
            summary={getExtraDataRecordSummary(fields, record)}
          />
        ),
        icon: null,
        width: CONFIRM_MODAL_WIDTH,
        okText: t("common.delete"),
        cancelText: t("common.cancel"),
        okButtonProps: { danger: true },
        onOk: deleteItem,
      });
    },
    [category, fields, minionId, modalApi, onDeleted, t]
  );

  return { openConfirm, modalContextHolder };
}
