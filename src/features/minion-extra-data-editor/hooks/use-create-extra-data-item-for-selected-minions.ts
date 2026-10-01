import type { ExtraDataCategoryModel } from "@saltbox/saltbox-core-api-client";
import { type AppError, normalizeApiError, notify } from "@saltbox/saltbox-frontend-common";
import { useCallback, useState } from "react";
import { useTranslation } from "react-i18next";

import { getExtraDataCategoryDisplayName } from "saltbox-core/shared/helpers/extra-data-category-name";
import { mapWithConcurrency } from "saltbox-core/shared/helpers/map-with-concurrency";

import { createMinionExtraDataItem } from "../api/create-minion-extra-data-item";
import type { ExtraDataItemSubmission } from "../types/extra-data-item-submission";

const CREATE_CONCURRENCY = 5;

type UseCreateExtraDataItemForSelectedMinionsParams = {
  minionIds: readonly string[];
  onSuccess?: () => void;
};

export function useCreateExtraDataItemForSelectedMinions({
  minionIds,
  onSuccess,
}: UseCreateExtraDataItemForSelectedMinionsParams): ExtraDataItemSubmission {
  const { t } = useTranslation();

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<AppError | null>(null);

  const resetError = useCallback(() => {
    setError(null);
  }, []);

  const submit = useCallback(
    async (category: ExtraDataCategoryModel, data: Record<string, unknown>) => {
      const [firstMinionId, ...restMinionIds] = minionIds;
      if (!firstMinionId) return;

      setIsSubmitting(true);
      setError(null);

      const createForMinion = async (minionId: string): Promise<AppError | null> => {
        try {
          await createMinionExtraDataItem({ category, minionId, data });
          return null;
        } catch (e) {
          return normalizeApiError(e);
        }
      };

      // Validation errors are identical for every minion, so the first request fails fast
      // before the rest are sent.
      const firstError = await createForMinion(firstMinionId);
      if (firstError) {
        setIsSubmitting(false);
        setError(firstError);
        return;
      }

      const restResults = await mapWithConcurrency(
        restMinionIds,
        CREATE_CONCURRENCY,
        createForMinion
      );
      const failedCount = restResults.filter((result) => result !== null).length;

      setIsSubmitting(false);

      const name = getExtraDataCategoryDisplayName(t, category.name);

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
          t("minions.extra-data.item-form.bulk-success", { name, count: minionIds.length })
        );
      }

      onSuccess?.();
    },
    [minionIds, onSuccess, t]
  );

  return { submit, isSubmitting, error, resetError };
}
