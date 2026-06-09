import { Button, Input, Modal, Typography } from "antd";
import { useState } from "react";
import { useTranslation } from "react-i18next";

import styles from "./salt-keys-delete-confirm-modal.module.css";

const CONFIRM_WORD = "DELETE";

type SaltKeysDeleteConfirmModalProps = {
  open: boolean;
  title: string;
  description: string;
  isSending: boolean;
  onConfirm: () => void;
  onClose: () => void;
};

export function SaltKeysDeleteConfirmModal({
  open,
  title,
  description,
  isSending,
  onConfirm,
  onClose,
}: SaltKeysDeleteConfirmModalProps) {
  const { t } = useTranslation();
  const [inputValue, setInputValue] = useState("");

  const handleClose = () => {
    setInputValue("");
    onClose();
  };

  return (
    <Modal
      title={title}
      open={open}
      onCancel={handleClose}
      footer={[
        <Button key="cancel" onClick={handleClose} disabled={isSending}>
          {t("common.cancel")}
        </Button>,
        <Button
          key="delete"
          danger
          type="primary"
          disabled={inputValue !== CONFIRM_WORD}
          loading={isSending}
          onClick={onConfirm}
        >
          {t("common.delete")}
        </Button>,
      ]}
    >
      <span>{description}</span>
      <Input
        value={inputValue}
        onChange={(e) => setInputValue(e.target.value)}
        style={{ marginTop: 8 }}
      />
      <Typography.Text type="secondary" className={styles.saltKeysDeleteHint}>
        {t("master.delete-confirm-input-hint")}
      </Typography.Text>
    </Modal>
  );
}
