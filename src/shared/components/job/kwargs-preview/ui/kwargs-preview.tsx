import { Flex, Tag } from "antd";
import React from "react";
import { useTranslation } from "react-i18next";

import { JsonPopover } from "saltbox-core/shared/components/json-popover/json-popover";

import { formatValue } from "../helpers/format";

import styles from "./kwargs-preview.module.css";

interface KwargsPreviewProps {
  kwargs: Record<string, unknown> | null | undefined | unknown;
  title?: string;
}

export const KwargsPreview = ({ kwargs, title }: KwargsPreviewProps) => {
  const { t } = useTranslation();

  const entries = Object.entries(kwargs || {});
  const previewEntries = entries.slice(0, 3);
  const hasMore = entries.length > 3;
  const isEmpty = entries.length === 0;

  const tagContent = (
    <>
      <span className={styles.kwargsBrace}>{"{"}</span>
      {!isEmpty ? (
        previewEntries.map(([key, value], index) => (
          <React.Fragment key={key}>
            <span className={styles.kwargsKey}>{key}</span>
            <span className={styles.kwargsSeparator}>: </span>
            <span className={styles.kwargsValue}>{formatValue(value)}</span>
            {index < previewEntries.length - 1 && (
              <span className={styles.kwargsSeparator}>, </span>
            )}
          </React.Fragment>
        ))
      ) : (
        <span className={styles.kwargsEmpty}>{t("jobs.no-key-value-arguments")}</span>
      )}
      {hasMore ? <span className={styles.kwargsEllipsis}>…</span> : null}
      <span className={styles.kwargsBrace}>{"}"}</span>
    </>
  );

  if (isEmpty) {
    return (
      <Flex align="center" gap={4} wrap className={styles.kwargsPreview}>
        <Tag className={styles.kwargsTag}>{tagContent}</Tag>
      </Flex>
    );
  }

  return (
    <Flex align="center" gap={4} wrap className={styles.kwargsPreview}>
      <JsonPopover
        data={kwargs}
        title={title}
        maxHeight="400px"
        placement="bottom"
        tagClassName={`${styles.kwargsTag} ${styles.kwargsTagClickable}`}
      >
        {tagContent}
      </JsonPopover>
    </Flex>
  );
};
