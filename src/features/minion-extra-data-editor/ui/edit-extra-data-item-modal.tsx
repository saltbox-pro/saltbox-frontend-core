import { useState } from "react";
import { useTranslation } from "react-i18next";

import {
  EditExtraDataItemForm,
  type EditExtraDataItemFormProps,
} from "./edit-extra-data-item-form";
import { ExtraDataItemModalFrame } from "./extra-data-item-modal-frame";

type EditExtraDataItemModalProps = Omit<
  EditExtraDataItemFormProps,
  "record" | "onClose" | "onSubmittingChange"
> & {
  open: boolean;
  record: Record<string, unknown> | null;
  onCancel: () => void;
};

export function EditExtraDataItemModal({
  open,
  record,
  onCancel,
  ...formProps
}: EditExtraDataItemModalProps) {
  const { t } = useTranslation();
  const [isSubmitting, setIsSubmitting] = useState(false);

  return (
    <ExtraDataItemModalFrame
      open={open && !!record}
      title={t("minions.extra-data.item-form.edit-title")}
      isSubmitting={isSubmitting}
      onCancel={onCancel}
    >
      {record && (
        <EditExtraDataItemForm
          {...formProps}
          record={record}
          onClose={onCancel}
          onSubmittingChange={setIsSubmitting}
        />
      )}
    </ExtraDataItemModalFrame>
  );
}
