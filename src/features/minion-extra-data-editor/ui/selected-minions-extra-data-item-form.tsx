import { Alert } from "antd";
import { useTranslation } from "react-i18next";

import { useCreateExtraDataItemForSelectedMinions } from "../hooks/use-create-extra-data-item-for-selected-minions";

import { ExtraDataItemForm, type ExtraDataItemFormProps } from "./extra-data-item-form";
import styles from "./extra-data-item-form.module.css";

export type SelectedMinionsExtraDataItemFormProps = Omit<
  ExtraDataItemFormProps,
  "submission" | "category"
> & {
  minionIds: readonly string[];
  onSuccess?: () => void;
};

export function SelectedMinionsExtraDataItemForm({
  minionIds,
  onSuccess,
  ...formProps
}: SelectedMinionsExtraDataItemFormProps) {
  const { t } = useTranslation();

  const submission = useCreateExtraDataItemForSelectedMinions({
    minionIds,
    onSuccess: () => {
      onSuccess?.();
      formProps.onClose();
    },
  });

  return (
    <>
      <Alert
        type="info"
        showIcon
        className={styles.alert}
        message={t("minions.extra-data.item-form.scope-selected", { count: minionIds.length })}
      />
      <ExtraDataItemForm {...formProps} submission={submission} />
    </>
  );
}
