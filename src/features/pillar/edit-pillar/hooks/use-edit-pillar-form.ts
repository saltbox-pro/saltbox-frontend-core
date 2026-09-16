import type { PillarWithTgtInfoSchema } from "@saltbox/saltbox-core-api-client";
import {
  type AppError,
  isInvalidJsonValueResult,
  parseAndValidateJsonValue,
  runMutation,
} from "@saltbox/saltbox-frontend-common";
import { type FormInstance } from "antd";
import { useCallback, useState } from "react";
import { useTranslation } from "react-i18next";

import { editPillar } from "../api/edit-pillar";

interface UseEditPillarFormParams {
  form: FormInstance<{ value: string }>;
  pillar: PillarWithTgtInfoSchema | null;
  onReplacePillar?: (updated: PillarWithTgtInfoSchema) => void;
  isSecret: boolean;
  onSuccess?: () => void;
}

export function useEditPillarForm({
  form,
  pillar,
  onReplacePillar,
  isSecret,
  onSuccess,
}: UseEditPillarFormParams) {
  const { t } = useTranslation();

  const [isSaving, setIsSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [mutationError, setMutationError] = useState<AppError | null>(null);

  const resetSaveState = useCallback(() => {
    setSaveError(null);
    setMutationError(null);
    setIsSaving(false);
  }, []);

  const handleSave = useCallback(async () => {
    if (!pillar || isSecret) return;

    setSaveError(null);
    setMutationError(null);

    let values: { value: string };
    try {
      values = await form.validateFields();
    } catch {
      return;
    }

    const parsed = parseAndValidateJsonValue(values.value);

    if (isInvalidJsonValueResult(parsed)) {
      setSaveError(t(parsed.errorKey, parsed.errorOptions));
      return;
    }

    setIsSaving(true);

    const result = await runMutation({
      run: () =>
        editPillar({
          pillarId: pillar.id,
          value: parsed.value,
          tgtInfo: pillar.tgt_info,
        }),
      successMessage: t("pillars.edit.success"),
      onError: setMutationError,
    });

    setIsSaving(false);
    if (!result.ok) return;

    onReplacePillar?.(result.data);
    onSuccess?.();
  }, [form, isSecret, onSuccess, onReplacePillar, pillar, t]);

  return { handleSave, isSaving, saveError, mutationError, setMutationError, resetSaveState };
}
