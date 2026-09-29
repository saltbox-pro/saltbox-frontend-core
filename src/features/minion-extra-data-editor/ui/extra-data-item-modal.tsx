import { Modal } from "@saltbox/saltbox-frontend-common";
import { useTranslation } from "react-i18next";

import { ExtraDataItemForm, type ExtraDataItemFormProps } from "./extra-data-item-form";

type ExtraDataItemModalProps = Omit<ExtraDataItemFormProps, "onClose"> & {
  open: boolean;
  onCancel: () => void;
};

export function ExtraDataItemModal({ open, onCancel, ...formProps }: ExtraDataItemModalProps) {
  const { t } = useTranslation();

  return (
    <Modal
      open={open}
      title={t("minions.extra-data.item-form.create-title")}
      onCancel={onCancel}
      footer={null}
      destroyOnHidden
      width={720}
    >
      <ExtraDataItemForm {...formProps} onClose={onCancel} />
    </Modal>
  );
}
