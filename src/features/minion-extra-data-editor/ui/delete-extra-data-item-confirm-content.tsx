import { Flex, Typography } from "antd";
import { useTranslation } from "react-i18next";

import type { ExtraDataRecordSummary } from "../types/extra-data-record-summary";

import styles from "./delete-extra-data-item-confirm-content.module.css";

type DeleteExtraDataItemConfirmContentProps = {
  question: string;
  summary: ExtraDataRecordSummary;
};

export function DeleteExtraDataItemConfirmContent({
  question,
  summary: { entries, hiddenCount },
}: DeleteExtraDataItemConfirmContentProps) {
  const { t } = useTranslation();

  return (
    <Flex vertical gap="middle">
      <Typography.Text className={styles.question}>{question}</Typography.Text>
      {entries.length > 0 && (
        <Flex vertical>
          {entries.map(({ name, value }) => (
            <Typography.Text key={name} ellipsis={{ tooltip: value }}>
              <Typography.Text strong>{name}:</Typography.Text> {value}
            </Typography.Text>
          ))}
          {hiddenCount > 0 && (
            <Typography.Text type="secondary">
              {t("minions.extra-data.delete-item.more-fields", { count: hiddenCount })}
            </Typography.Text>
          )}
        </Flex>
      )}
    </Flex>
  );
}
