import { GatheredMinionSchema, MinionsGatherTgtTypeEnum } from "@saltbox/saltbox-core-api-client";
import { CopyToClipboardButton, Modal } from "@saltbox/saltbox-frontend-common";
import { Button, List, Spin, Typography } from "antd";
import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";

import { apiCoreStore } from "saltbox-core/store";

import styles from "./minion-gather-modal.module.css";

interface MinionGatherModalProps {
  isOpen: boolean;
  onClose: () => void;
  target: string;
  targetType: MinionsGatherTgtTypeEnum;
  master: string;
}

export function MinionGatherModal({
  isOpen,
  onClose,
  target,
  targetType,
  master,
}: MinionGatherModalProps) {
  const { t } = useTranslation();
  const [minions, setMinions] = useState<GatheredMinionSchema[]>([]);
  const [count, setCount] = useState<number>(0);
  const [isLoading, setIsLoading] = useState(false);
  const totalMinionsText =
    count >= 100
      ? t("minion-gather-modal.first-100-minions")
      : t("minion-gather-modal.total-minions", { count });

  useEffect(() => {
    if (isOpen && target && targetType && master) {
      setIsLoading(true);
      apiCoreStore.minionsApi
        ?.minionsGather({
          tgt: target,
          tgt_type: targetType,
          master: master,
        })
        .then((response) => {
          setMinions(response?.minions ?? []);
          setCount(response?.count ?? 0);
        })
        .catch(() => {
          setMinions([]);
          setCount(0);
        })
        .finally(() => {
          setIsLoading(false);
        });
    }
  }, [isOpen, target, targetType, master]);

  return (
    <Modal
      title={t("minion-gather-modal.title")}
      open={isOpen}
      onCancel={onClose}
      footer={[
        <Button key="close" onClick={onClose}>
          {t("minion-gather-modal.close")}
        </Button>,
      ]}
    >
      <Spin spinning={isLoading}>
        <Typography.Text strong>{totalMinionsText}</Typography.Text>
        <List
          dataSource={minions}
          renderItem={(item) => (
            <List.Item className={styles.listRow}>
              <span className={styles.rowContent}>
                <span className={styles.minionId}>{item.minion_id}</span>
                <span className={styles.rowActions}>
                  <CopyToClipboardButton text={item.minion_id} />
                </span>
              </span>
            </List.Item>
          )}
        />
      </Spin>
    </Modal>
  );
}
