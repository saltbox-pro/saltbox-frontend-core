import { useState } from "react";

import { ExtraDataItemModalFrame } from "./extra-data-item-modal-frame";
import {
  SelectedMinionsExtraDataItemForm,
  type SelectedMinionsExtraDataItemFormProps,
} from "./selected-minions-extra-data-item-form";

type SelectedMinionsExtraDataItemModalProps = Omit<
  SelectedMinionsExtraDataItemFormProps,
  "onClose" | "onSubmittingChange"
> & {
  open: boolean;
  onCancel: () => void;
};

export function SelectedMinionsExtraDataItemModal({
  open,
  onCancel,
  ...formProps
}: SelectedMinionsExtraDataItemModalProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);

  return (
    <ExtraDataItemModalFrame open={open} isSubmitting={isSubmitting} onCancel={onCancel}>
      <SelectedMinionsExtraDataItemForm
        {...formProps}
        onClose={onCancel}
        onSubmittingChange={setIsSubmitting}
      />
    </ExtraDataItemModalFrame>
  );
}
