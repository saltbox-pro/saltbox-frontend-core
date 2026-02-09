import { Flex, Tag } from "antd";
import React from "react";
import { useTranslation } from "react-i18next";

import styles from "../index.module.css";

import { JsonPopover } from "./json-popover";

interface ArgumentsPreviewProps {
  args: unknown[];
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

export const ArgumentsPreview = ({ args, title }: ArgumentsPreviewProps) => {
  const { t } = useTranslation();
  const previewArgs = args.slice(0, 3);
  const hasMore = args.length > 3;

  return (
    <Flex align="center" gap={8} wrap className={styles.argumentsCell}>
      <Flex align="center" gap={4} wrap className={styles.argumentsPreview}>
        <Tag className={styles.argumentsTag}>
          <span className={styles.argumentsBrace}>[</span>
          {previewArgs.length > 0 ? (
            previewArgs.map((arg, index) => (
              <React.Fragment key={index}>
                <span className={styles.argumentsValue}>{formatValue(arg)}</span>
                {index < previewArgs.length - 1 && (
                  <span className={styles.argumentsSeparator}>, </span>
                )}
              </React.Fragment>
            ))
          ) : (
            <span className={styles.argumentsEmpty}>{t("jobs.no-arguments")}</span>
          )}
          {hasMore ? <span className={styles.argumentsEllipsis}>…</span> : null}
          <span className={styles.argumentsBrace}>]</span>
        </Tag>
      </Flex>
      {args.length > 0 ? <JsonPopover data={args} title={title} /> : null}
    </Flex>
  );
};
