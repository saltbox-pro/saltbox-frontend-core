import type { PillarWithTgtInfoSchema } from "@saltbox/saltbox-core-api-client";
import {
  isInvalidJsonValueResult,
  parseAndValidateJsonValue,
} from "@saltbox/saltbox-frontend-common";
import { message, type FormInstance } from "antd";
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

  const resetSaveState = useCallback(() => {
    setSaveError(null);
    setIsSaving(false);
  }, []);

  const handleSave = useCallback(async () => {
    if (!pillar || isSecret) return;

    setSaveError(null);

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
    try {
      const updated = await editPillar({
        pillarId: pillar.id,
        value: parsed.value,
        tgtInfo: pillar.tgt_info,
      });

      onReplacePillar?.(updated);
      message.success(t("pillars.edit.success"));

      onSuccess?.();
    } catch {
      setSaveError(t("pillars.edit.error"));
    } finally {
      setIsSaving(false);
    }
  }, [form, isSecret, onSuccess, onReplacePillar, pillar, t]);

  return { handleSave, isSaving, saveError, resetSaveState };
}
