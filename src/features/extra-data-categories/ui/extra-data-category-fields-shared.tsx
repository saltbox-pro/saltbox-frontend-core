import { HolderOutlined } from "@ant-design/icons";
import clsx from "clsx";
import { type DragEvent, type ReactNode } from "react";
import { useTranslation } from "react-i18next";

import styles from "./extra-data-category-fields-list.module.css";

export function ExtraDataCategoryFieldSortHandle({
  disabled,
  dragProps,
}: {
  disabled?: boolean;
  dragProps?: {
    draggable?: boolean;
    onDragStart?: (event: DragEvent<HTMLElement>) => void;
    onDragEnd?: (event: DragEvent<HTMLElement>) => void;
  };
}) {
  const { t } = useTranslation();

  return (
    <span
      className={clsx(styles.handle, { [styles.handleDisabled]: disabled })}
      title={t("extra-data-categories.order-fields.drag")}
      aria-label={t("extra-data-categories.order-fields.drag")}
      aria-disabled={disabled || undefined}
      {...(disabled ? undefined : dragProps)}
    >
      <HolderOutlined />
    </span>
  );
}

type ExtraDataCategoryFieldsRowProps = {
  className?: string;
  isDragging?: boolean;
  dropSide?: "before" | "after" | null;
  dropProps?: {
    onDragOver?: (event: DragEvent<HTMLElement>) => void;
    onDrop?: (event: DragEvent<HTMLElement>) => void;
  };
  sortHandle?: ReactNode;
  children: ReactNode;
};

export function ExtraDataCategoryFieldsRow({
  className,
  isDragging = false,
  dropSide = null,
  dropProps,
  sortHandle,
  children,
}: ExtraDataCategoryFieldsRowProps) {
  return (
    <li
      className={clsx(styles.row, className, {
        [styles.rowDragging]: isDragging,
        [styles.rowDropBefore]: dropSide === "before",
        [styles.rowDropAfter]: dropSide === "after",
      })}
      {...dropProps}
    >
      {sortHandle}
      {children}
    </li>
  );
}
