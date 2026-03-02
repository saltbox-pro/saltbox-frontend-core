import { Modal } from "@saltbox/saltbox-frontend-common";
import { useTranslation } from "react-i18next";

export interface PillarDeleteConfirmModalProps {
  open: boolean;
  confirmLoading: boolean;
  pillarName: string | null | undefined;
  onCancel: () => void;
  onConfirm: () => void;
}

export function PillarDeleteConfirmModal({
  open,
  onCancel,
  onConfirm,
  confirmLoading,
  pillarName,
}: PillarDeleteConfirmModalProps) {
  const { t } = useTranslation();

  return (
    <Modal
      title={t("pillars.delete.modal-title")}
      open={open}
      onOk={onConfirm}
      onCancel={onCancel}
      okText={t("common.delete")}
      cancelText={t("common.cancel")}
      okButtonProps={{ danger: true, loading: confirmLoading }}
      closable={false}
    >
      <p>
        {t("pillars.delete.modal-text")} <b>{pillarName}</b>?
      </p>
    </Modal>
  );
}
