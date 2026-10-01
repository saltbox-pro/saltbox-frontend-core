import type { ExtraDataCategoryModel } from "@saltbox/saltbox-core-api-client";
import { type AppError, runMutation } from "@saltbox/saltbox-frontend-common";
import { useCallback, useState } from "react";
import { useTranslation } from "react-i18next";

import { getExtraDataCategoryDisplayName } from "saltbox-core/shared/helpers/extra-data-category-name";

import { createMinionExtraDataItem } from "../api/create-minion-extra-data-item";
import type { ExtraDataItemSubmission } from "../types/extra-data-item-submission";

type UseCreateExtraDataItemParams = {
  minionId: string;
  onSuccess?: () => void;
};

export function useCreateExtraDataItem({
  minionId,
  onSuccess,
}: UseCreateExtraDataItemParams): ExtraDataItemSubmission {
  const { t } = useTranslation();

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<AppError | null>(null);

  const resetError = useCallback(() => {
    setError(null);
  }, []);

  const submit = useCallback(
    async (category: ExtraDataCategoryModel, data: Record<string, unknown>) => {
      setIsSubmitting(true);
      setError(null);

      const result = await runMutation({
        run: () => createMinionExtraDataItem({ category, minionId, data }),
        successMessage: t("minions.extra-data.item-form.create-success", {
          name: getExtraDataCategoryDisplayName(t, category.name),
        }),
        onError: setError,
      });

      setIsSubmitting(false);
      if (!result.ok) return;

      onSuccess?.();
    },
    [minionId, onSuccess, t]
  );

  return { submit, isSubmitting, error, resetError };
}
