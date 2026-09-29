import { Flex, Typography } from "antd";

import type { ExtraDataRecordSummaryEntry } from "../types/extra-data-record-summary";

import styles from "./delete-extra-data-item-confirm-content.module.css";

type DeleteExtraDataItemConfirmContentProps = {
  question: string;
  entries: ExtraDataRecordSummaryEntry[];
};

export function DeleteExtraDataItemConfirmContent({
  question,
  entries,
}: DeleteExtraDataItemConfirmContentProps) {
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
        </Flex>
      )}
    </Flex>
  );
}
