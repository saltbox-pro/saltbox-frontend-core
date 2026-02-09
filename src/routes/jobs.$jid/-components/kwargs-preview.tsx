import { Flex, Tag } from "antd";
import React from "react";
import { useTranslation } from "react-i18next";

import styles from "../index.module.css";

import { JsonPopover } from "./json-popover";

interface KwargsPreviewProps {
  kwargs: Record<string, unknown>;
  title: string;
}

const formatValue = (value: unknown): string => {
  if (value === null || typeof value === "number" || typeof value === "boolean") {
    return String(value);
  }

  if (typeof value === "string") {
    return value.length > 24 ? `${value.slice(0, 21)}…` : value;
  }

  if (Array.isArray(value)) {
    const items = value.slice(0, 3).map((item) => {
      if (typeof item === "string") {
        return item.length > 12 ? `${item.slice(0, 9)}…` : item;
      }
      if (typeof item === "number" || typeof item === "boolean") {
        return String(item);
      }
      return "…";
    });
    return `[${items.join(", ")}${value.length > 3 ? ", …" : ""}]`;
  }

  if (typeof value === "object") {
    return "{…}";
  }

  return "";
};

export const KwargsPreview = ({ kwargs, title }: KwargsPreviewProps) => {
  const { t } = useTranslation();
  const entries = Object.entries(kwargs);
  const previewEntries = entries.slice(0, 3);
  const hasMore = entries.length > 3;

  return (
    <Flex align="center" gap={8} wrap className={styles.kwargsCell}>
      <Flex align="center" gap={4} wrap className={styles.kwargsPreview}>
        <Tag className={styles.kwargsTag}>
          <span className={styles.kwargsBrace}>{"{"}</span>
          {previewEntries.length > 0 ? (
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
        </Tag>
      </Flex>
      {entries.length > 0 ? <JsonPopover data={kwargs} title={title} /> : null}
    </Flex>
  );
};
