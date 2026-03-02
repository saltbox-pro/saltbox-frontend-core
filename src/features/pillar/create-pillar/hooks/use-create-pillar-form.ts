import type { PillarCreateRequestSchema } from "@saltbox/saltbox-core-api-client";
import { message } from "antd";
import { useCallback, useState } from "react";
import { useTranslation } from "react-i18next";

import {
  isParseValueError,
  parseAndValidateJsonValue,
} from "saltbox-core/shared/components/form/fields/json-editor-field";

import { createPillar } from "../api/create-pillar";

export interface CreatePillarFormValues {
  name: string;
  value: string;
  is_personal: boolean;
  is_secret: boolean;
}

interface UseCreatePillarFormParams {
  refreshPillars: () => void;
  tgtType: PillarCreateRequestSchema["tgt_type"];
  tgtId: string;
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

  const resetCreateError = useCallback(() => setCreateError(null), []);

  const handleSubmit = useCallback(
    async (values: CreatePillarFormValues) => {
      setIsCreating(true);
      setCreateError(null);

      const parsed = parseAndValidateJsonValue(values.value);

      if (isParseValueError(parsed)) {
        setCreateError(parsed.errorKey);
        setIsCreating(false);
        return;
      }

      const body: PillarCreateRequestSchema = {
        name: values.name,
        value: parsed.value,
        is_personal: values.is_personal,
        is_secret: values.is_secret,
        tgt_type: tgtType,
        tgt_id: tgtType === "root" ? null : tgtId,
      };

      try {
        await createPillar(body);
        message.success(t("pillars.create.success"));
        refreshPillars();
        onClose();
      } catch {
        setCreateError("pillars.create.error");
      } finally {
        setIsCreating(false);
      }
    },
    [onClose, refreshPillars, tgtId, tgtType, t]
  );

  return { handleSubmit, isCreating, createError, resetCreateError };
}
