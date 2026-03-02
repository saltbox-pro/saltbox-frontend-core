import type { PillarWithTgtInfoSchema } from "@saltbox/saltbox-core-api-client";
import { type FormInstance, message } from "antd";
import { useCallback, useState } from "react";
import { useTranslation } from "react-i18next";

import {
  isParseValueError,
  parseAndValidateJsonValue,
} from "saltbox-core/shared/components/form/fields/json-editor-field";

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
    if (isParseValueError(parsed)) {
      setSaveError(parsed.errorKey);
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
      setSaveError("pillars.edit.error");
    } finally {
      setIsSaving(false);
    }
  }, [form, isSecret, onSuccess, onReplacePillar, pillar, t]);

  return { handleSave, isSaving, saveError, resetSaveState };
}
