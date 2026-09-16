import type { PillarCreateRequestSchema } from "@saltbox/saltbox-core-api-client";
import {
  type AppError,
  isInvalidJsonValueResult,
  parseAndValidateJsonValue,
  runMutation,
} from "@saltbox/saltbox-frontend-common";
import { useCallback, useState } from "react";
import { useTranslation } from "react-i18next";

import { createPillar } from "../api/create-pillar";

export interface CreatePillarFormValues {
  name: string;
  value: string;
  is_secret: boolean;
}

interface UseCreatePillarFormParams {
  refreshPillars: () => void;
  tgtType: PillarCreateRequestSchema["tgt_type"];
  tgtId?: string;
  onClose: () => void;
}

export function useCreatePillarForm({
  refreshPillars,
  tgtType,
  tgtId,
  onClose,
}: UseCreatePillarFormParams) {
  const { t } = useTranslation();

  const [isCreating, setIsCreating] = useState(false);
  const [createError, setCreateError] = useState<string | null>(null);
  const [mutationError, setMutationError] = useState<AppError | null>(null);

  const resetCreateError = useCallback(() => {
    setCreateError(null);
    setMutationError(null);
  }, []);

  const handleSubmit = useCallback(
    async (values: CreatePillarFormValues) => {
      setIsCreating(true);
      setCreateError(null);
      setMutationError(null);

      const parsed = parseAndValidateJsonValue(values.value);

      if (isInvalidJsonValueResult(parsed)) {
        setCreateError(t(parsed.errorKey, parsed.errorOptions));
        setIsCreating(false);
        return;
      }

      const body: PillarCreateRequestSchema = {
        name: values.name?.trim(),
        value: parsed.value,
        is_secret: values.is_secret,
        tgt_type: tgtType,
        tgt_id: tgtType === "root" ? null : tgtId,
      };

      const result = await runMutation({
        run: () => createPillar(body),
        successMessage: t("pillars.create.success"),
        onError: setMutationError,
      });

      setIsCreating(false);
      if (!result.ok) return;

      refreshPillars();
      onClose();
    },
    [onClose, refreshPillars, tgtId, tgtType, t]
  );

  return {
    handleSubmit,
    isCreating,
    createError,
    mutationError,
    setMutationError,
    resetCreateError,
  };
}
