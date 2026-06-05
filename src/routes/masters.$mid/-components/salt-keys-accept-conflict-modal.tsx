import { Button, Flex, Modal } from "antd";
import { useTranslation } from "react-i18next";

type SaltKeysAcceptConflictModalProps = {
  open: boolean;
  conflictCount: number;
  isSending: boolean;
  onReplaceAll: () => void;
  onCancelAccept: () => void;
  onAskEach: () => void;
  onClose: () => void;
};

export function SaltKeysAcceptConflictModal({
  open,
  conflictCount,
  isSending,
  onReplaceAll,
  onCancelAccept,
  onAskEach,
  onClose,
}: SaltKeysAcceptConflictModalProps) {
  const { t } = useTranslation();

  return (
    <Modal
      title={t("master.accept-conflict-title")}
      open={open}
      onCancel={onClose}
      maskClosable={false}
      closable={false}
      keyboard={false}
      footer={""}
      width={"350px"}
    >
      <Flex vertical gap={5}>
        {t("master.accept-conflict-description", { count: conflictCount })}
        <Flex vertical gap={4}>
          <Button onClick={onReplaceAll} disabled={isSending}>
            {t("master.accept-conflict-replace-all")}
          </Button>
          <Button onClick={onCancelAccept} disabled={isSending}>
            {t("master.accept-conflict-cancel")}
          </Button>
          <Button onClick={onAskEach} disabled={isSending}>
            {t("master.accept-conflict-ask-each")}
          </Button>
        </Flex>
      </Flex>
    </Modal>
  );
}
