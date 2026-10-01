import type { ExtraDataCategoryModel } from "@saltbox/saltbox-core-api-client";
import { useMemo } from "react";
import { useTranslation } from "react-i18next";

import { toExtraDataItemFormValues } from "../helpers/extra-data-item-form";
import { useUpdateExtraDataItem } from "../hooks/use-update-extra-data-item";

import { ExtraDataItemForm } from "./extra-data-item-form";

export type EditExtraDataItemFormProps = {
  category: ExtraDataCategoryModel;
  minionId: string;
  record: Record<string, unknown>;
  onClose: () => void;
  onSubmittingChange?: (isSubmitting: boolean) => void;
  onSuccess?: () => void;
};

export function EditExtraDataItemForm({
  category,
  minionId,
  record,
  onClose,
  onSubmittingChange,
  onSuccess,
}: EditExtraDataItemFormProps) {
  const { t } = useTranslation();

  const submission = useUpdateExtraDataItem({
    minionId,
    record,
    onSuccess: () => {
      onSuccess?.();
      onClose();
    },
  });

  const initialFieldValues = useMemo(
    () => toExtraDataItemFormValues(category, record),
    [category, record]
  );

  return (
    <ExtraDataItemForm
      category={category}
      initialFieldValues={initialFieldValues}
      submitText={t("common.save")}
      submission={submission}
      onClose={onClose}
      onSubmittingChange={onSubmittingChange}
    />
  );
}
