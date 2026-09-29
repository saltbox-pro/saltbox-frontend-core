import { Modal } from "@saltbox/saltbox-frontend-common";
import { useTranslation } from "react-i18next";

type DeleteExtraDataCategoryFieldModalProps = {
  open: boolean;
  fieldName: string | null;
  onCancel: () => void;
  onConfirm: () => void;
};

export function DeleteExtraDataCategoryFieldModal({
  open,
  fieldName,
  onCancel,
  onConfirm,
}: DeleteExtraDataCategoryFieldModalProps) {
  const { t } = useTranslation();

  return (
    <Modal
      title={t("extra-data-categories.delete-field.modal-title")}
      open={open}
      onOk={onConfirm}
      onCancel={onCancel}
      okText={t("common.delete")}
      cancelText={t("common.cancel")}
      okButtonProps={{ danger: true }}
      closable={false}
      zIndex={1001}
      styles={{ content: { whiteSpace: "pre-line" } }}
    >
      {t("extra-data-categories.delete-field.modal-text", { name: fieldName })}
    </Modal>
  );
}
