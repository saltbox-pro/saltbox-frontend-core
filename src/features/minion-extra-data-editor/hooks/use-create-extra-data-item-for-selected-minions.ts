import type { ExtraDataCategoryModel } from "@saltbox/saltbox-core-api-client";
import { type AppError, normalizeApiError, notify } from "@saltbox/saltbox-frontend-common";
import { useCallback, useState } from "react";
import { useTranslation } from "react-i18next";

import { getExtraDataCategoryDisplayName } from "saltbox-core/shared/helpers/extra-data-category-name";

import { createMinionExtraDataItem } from "../api/create-minion-extra-data-item";
import type { ExtraDataItemSubmission } from "../types/extra-data-item-submission";

type UseCreateExtraDataItemForSelectedMinionsParams = {
  minionIds: readonly string[];
  onSuccess?: () => void;
};

export function useCreateExtraDataItemForSelectedMinions({
  minionIds,
  onSuccess,
}: UseCreateExtraDataItemForSelectedMinionsParams): ExtraDataItemSubmission {
  const { t, i18n } = useTranslation();

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<AppError | null>(null);

  const resetError = useCallback(() => {
    setError(null);
  }, []);

  const submit = useCallback(
    async (category: ExtraDataCategoryModel, data: Record<string, unknown>) => {
      if (minionIds.length === 0) return;

      setIsSubmitting(true);
      setError(null);

      try {
        const result = await createMinionExtraDataItem({
          category,
          minionIds,
          data,
        });

        const name = getExtraDataCategoryDisplayName(category, i18n.language);
        const createdCount = result.minions_count;
        const failedCount = minionIds.length - createdCount;

        if (failedCount > 0) {
          notify.warning(
            t("minions.extra-data.item-form.bulk-partial", {
              name,
              failed: failedCount,
              total: minionIds.length,
            })
          );
        } else {
          notify.success(
            t("minions.extra-data.item-form.bulk-success", { name, count: createdCount })
          );
        }

        if (createdCount > 0) {
          onSuccess?.();
        }
      } catch (e) {
        setError(await normalizeApiError(e));
      } finally {
        setIsSubmitting(false);
      }
    },
    [i18n.language, minionIds, onSuccess, t]
  );

  return { submit, isSubmitting, error, resetError };
}
