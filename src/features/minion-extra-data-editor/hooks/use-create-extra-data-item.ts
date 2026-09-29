import type { ExtraDataCategoryModel } from "@saltbox/saltbox-core-api-client";
import { type AppError, runMutation } from "@saltbox/saltbox-frontend-common";
import { useCallback, useState } from "react";
import { useTranslation } from "react-i18next";

import { createMinionExtraDataItem } from "../api/create-minion-extra-data-item";

type UseCreateExtraDataItemParams = {
  minionId: string;
  onSuccess?: () => void;
};

export function useCreateExtraDataItem({ minionId, onSuccess }: UseCreateExtraDataItemParams) {
  const { t } = useTranslation();

  const [isCreating, setIsCreating] = useState(false);
  const [mutationError, setMutationError] = useState<AppError | null>(null);

  const resetMutationError = useCallback(() => {
    setMutationError(null);
  }, []);

  const createItem = useCallback(
    async (category: ExtraDataCategoryModel, data: Record<string, unknown>) => {
      setIsCreating(true);
      setMutationError(null);

      const result = await runMutation({
        run: () =>
          createMinionExtraDataItem({
            category_source: category.source,
            category_name: category.name,
            minion_id: minionId,
            data,
          }),
        successMessage: t("minions.extra-data.item-form.create-success", {
          name: t(`minions.extra-data.categories.${category.name}`, {
            defaultValue: category.name,
          }),
        }),
        onError: setMutationError,
      });

      setIsCreating(false);
      if (!result.ok) return;

      onSuccess?.();
    },
    [minionId, onSuccess, t]
  );

  return { createItem, isCreating, mutationError, resetMutationError };
}
