import { useCreateExtraDataItem } from "../hooks/use-create-extra-data-item";

import { ExtraDataItemForm, type ExtraDataItemFormProps } from "./extra-data-item-form";

export type MinionExtraDataItemFormProps = Omit<ExtraDataItemFormProps, "submission"> & {
  minionId: string;
  onSuccess?: () => void;
};

export function MinionExtraDataItemForm({
  minionId,
  onSuccess,
  ...formProps
}: MinionExtraDataItemFormProps) {
  const submission = useCreateExtraDataItem({
    minionId,
    onSuccess: () => {
      onSuccess?.();
      formProps.onClose();
    },
  });

  return <ExtraDataItemForm {...formProps} submission={submission} />;
}
