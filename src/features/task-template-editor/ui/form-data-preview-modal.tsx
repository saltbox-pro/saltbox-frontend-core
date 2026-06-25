import { Modal } from "antd";
import { useTranslation } from "react-i18next";

import styles from "./form-data-preview-modal.module.css";

interface FormDataPreviewModalProps {
  open: boolean;
  data: unknown;
  onClose: () => void;
}

export function FormDataPreviewModal({ open, data, onClose }: FormDataPreviewModalProps) {
  const { t } = useTranslation();

  return (
    <Modal
      title={t("task-template-editor.form-data-preview-title")}
      open={open}
      onCancel={onClose}
      footer={null}
      width={640}
    >
      <pre className={styles.content}>{JSON.stringify(data, null, 2)}</pre>
    </Modal>
  );
}
