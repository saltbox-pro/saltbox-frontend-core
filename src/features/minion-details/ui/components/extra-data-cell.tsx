import { CopyOutlined, FilterOutlined } from "@ant-design/icons";
import { BaseActionButton } from "@saltbox/saltbox-frontend-common";
import { message } from "antd";
import { type MouseEvent, useState } from "react";
import { useTranslation } from "react-i18next";

import styles from "./extra-data-cell.module.css";

export function isPrimitive(value: unknown): value is string | number | boolean {
  return typeof value === "string" || typeof value === "number" || typeof value === "boolean";
}

export function toCopyValue(value: unknown): string {
  if (value == null) return "";
  if (isPrimitive(value)) return String(value);
  return JSON.stringify(value);
}

export type ExtraDataCellProps = {
  value: unknown;
  filterTitle?: string;
  onFilter?: () => void;
  onCopy?: () => void;
};

export function ExtraDataCell({ value, filterTitle, onFilter, onCopy }: ExtraDataCellProps) {
  const { t } = useTranslation("common");
  const [hovered, setHovered] = useState(false);

  const handleCopy = (e: MouseEvent<HTMLElement>) => {
    e.stopPropagation();

    navigator.clipboard
      .writeText(toCopyValue(value))
      .then(() => {
        message.success(t("copy-to-clipboard-button.copied"));
        onCopy?.();
      })
      .catch(() => {
        message.error(t("copy-to-clipboard-button.error"));
      });
  };

  const handleFilter = (e: MouseEvent<HTMLElement>) => {
    e.stopPropagation();
    onFilter?.();
  };

  return (
    <span
      className={styles.cell}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      <span className={styles.content}>
        <span className={styles.text} title={String(value)}>
          {String(value)}
        </span>
      </span>

      {hovered && value != null && (onCopy || onFilter) && (
        <span className={styles.actions}>
          {onCopy && (
            <BaseActionButton
              icon={<CopyOutlined />}
              title={t("copy-to-clipboard-button.copy")}
              onClick={handleCopy}
            />
          )}
          {onFilter && (
            <BaseActionButton
              icon={<FilterOutlined />}
              title={filterTitle}
              onClick={handleFilter}
            />
          )}
        </span>
      )}
    </span>
  );
}
