import type { ExtraDataCategoryModel } from "@saltbox/saltbox-core-api-client";
import { type AppError, runMutation } from "@saltbox/saltbox-frontend-common";
import { useCallback, useState } from "react";
import { useTranslation } from "react-i18next";

import { getExtraDataCategoryDisplayName } from "saltbox-core/shared/helpers/extra-data-category-name";

import { updateMinionExtraDataItem } from "../api/update-minion-extra-data-item";
import {
  getManualExtraDataRecordId,
  getUndeclaredExtraDataRecordData,
} from "../helpers/manual-extra-data";
import type { ExtraDataItemSubmission } from "../types/extra-data-item-submission";

type UseUpdateExtraDataItemParams = {
  minionId: string;
  record: Record<string, unknown>;
  onSuccess?: () => void;
};

export function useUpdateExtraDataItem({
  minionId,
  record,
  onSuccess,
}: UseUpdateExtraDataItemParams): ExtraDataItemSubmission {
  const { t, i18n } = useTranslation();

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<AppError | null>(null);

  const resetError = useCallback(() => {
    setError(null);
  }, []);

  const submit = useCallback(
    async (category: ExtraDataCategoryModel, data: Record<string, unknown>) => {
      const itemId = getManualExtraDataRecordId(record);
      if (!itemId) return;

      setIsSubmitting(true);
      setError(null);

      const result = await runMutation({
        run: () =>
          updateMinionExtraDataItem({
            category,
            minionId,
            itemId,
            data: { ...getUndeclaredExtraDataRecordData(category, record), ...data },
          }),
        successMessage: t("minions.extra-data.item-form.update-success", {
          name: getExtraDataCategoryDisplayName(category, i18n.language),
        }),
        onError: setError,
      });

      setIsSubmitting(false);
      if (!result.ok) return;

      onSuccess?.();
    },
    [i18n.language, minionId, onSuccess, record, t]
  );

  return { submit, isSubmitting, error, resetError };
}
