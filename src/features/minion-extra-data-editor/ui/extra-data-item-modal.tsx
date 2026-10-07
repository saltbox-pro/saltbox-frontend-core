import { useState } from "react";

import { ExtraDataItemModalFrame } from "./extra-data-item-modal-frame";
import {
  MinionExtraDataItemForm,
  type MinionExtraDataItemFormProps,
} from "./minion-extra-data-item-form";

type ExtraDataItemModalProps = Omit<
  MinionExtraDataItemFormProps,
  "onClose" | "onSubmittingChange"
> & {
  open: boolean;
  onCancel: () => void;
};

export function ExtraDataItemModal({ open, onCancel, ...formProps }: ExtraDataItemModalProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);

  return (
    <ExtraDataItemModalFrame open={open} isSubmitting={isSubmitting} onCancel={onCancel}>
      <MinionExtraDataItemForm
        {...formProps}
        onClose={onCancel}
        onSubmittingChange={setIsSubmitting}
      />
    </ExtraDataItemModalFrame>
  );
}
