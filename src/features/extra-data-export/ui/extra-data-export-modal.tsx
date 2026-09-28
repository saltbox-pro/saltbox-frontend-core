import { Modal } from "@saltbox/saltbox-frontend-common";
import { useTranslation } from "react-i18next";

export interface ExtraDataExportModalProps {
  open: boolean;
  warning: string;
  onCancel: () => void;
  onConfirm: () => void;
}

export function ExtraDataExportModal({
  open,
  warning,
  onCancel,
  onConfirm,
}: ExtraDataExportModalProps) {
  const { t } = useTranslation();

  return (
    <Modal
      title={t("minions.extra-data.export-to-csv-title")}
      open={open}
      onOk={onConfirm}
      onCancel={onCancel}
      okText={t("common.export")}
      cancelText={t("common.cancel")}
    >
      <span>{warning}</span>
    </Modal>
  );
}
