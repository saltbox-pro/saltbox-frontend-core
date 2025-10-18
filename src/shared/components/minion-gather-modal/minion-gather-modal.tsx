import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { Button, List, Spin, Typography } from "antd";
import { GatheredMinionSchema, MinionsGatherTgtTypeEnum } from "@saltbox/saltbox-core-api-client";
import { apiCoreStore } from "saltbox-core/store";
import { Modal } from "@saltbox/saltbox-frontend-common";

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
        <Typography.Text strong>
          {t("minion-gather-modal.total-minions", { count })}
        </Typography.Text>
        <List
          dataSource={minions}
          renderItem={(item) => <List.Item>{item.minion_id}</List.Item>}
        />
      </Spin>
    </Modal>
  );
}
