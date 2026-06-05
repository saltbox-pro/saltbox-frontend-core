import { SaltKeyMinion } from "@saltbox/saltbox-core-api-client";
import { Button, Modal } from "antd";
import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";

type SaltKeysAcceptPerKeyModalProps = {
  open: boolean;
  conflictMinions: SaltKeyMinion[];
  isSending: boolean;
  onComplete: (toReplace: SaltKeyMinion[]) => void;
  onClose: () => void;
};

export function SaltKeysAcceptPerKeyModal({
  open,
  conflictMinions,
  isSending,
  onComplete,
  onClose,
}: SaltKeysAcceptPerKeyModalProps) {
  const { t } = useTranslation();
  const [currentIndex, setCurrentIndex] = useState(0);
  const [toReplace, setToReplace] = useState<SaltKeyMinion[]>([]);

  useEffect(() => {
    if (open) {
      setCurrentIndex(0);
      setToReplace([]);
    }
  }, [open]);

  const currentMinion = conflictMinions[currentIndex];
  const isLast = currentIndex === conflictMinions.length - 1;

  const handleDecision = (replace: boolean) => {
    const nextToReplace = replace && currentMinion ? [...toReplace, currentMinion] : toReplace;

    if (isLast) {
      onComplete(nextToReplace);
      return;
    }

    setToReplace(nextToReplace);
    setCurrentIndex((index) => index + 1);
  };

  return (
    <Modal
      title={t("master.accept-conflict-per-key-title")}
      open={open && Boolean(currentMinion)}
      onCancel={onClose}
      maskClosable={false}
      closable={false}
      keyboard={false}
      footer={[
        <Button key="skip" onClick={() => handleDecision(false)} disabled={isSending}>
          {t("master.accept-conflict-per-key-skip")}
        </Button>,
        <Button
          key="replace"
          type="primary"
          loading={isSending}
          onClick={() => handleDecision(true)}
        >
          {t("master.accept-conflict-per-key-replace")}
        </Button>,
      ]}
    >
      {t("master.accept-conflict-per-key-description", {
        minionId: currentMinion?.minion_id ?? "",
        current: currentIndex + 1,
        total: conflictMinions.length,
      })}
    </Modal>
  );
}
