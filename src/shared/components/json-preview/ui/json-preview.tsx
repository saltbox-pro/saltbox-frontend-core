import { Tag } from "antd";
import { useTranslation } from "react-i18next";

import {
  JsonPopover,
  type JsonPopoverProps,
} from "saltbox-core/shared/components/json-popover/json-popover";
import { PrimitivePopover } from "saltbox-core/shared/components/json-popover/primitive-popover";

import { isEmpty } from "../helpers/is-empty";
import { isPrimitive } from "../helpers/is-primitive";

import styles from "./json-preview.module.css";
import { PreviewContent } from "./preview-content";

export interface JsonPreviewProps {
  value: unknown;
  title: string;
  emptyLabel?: string;
  maxPreviewEntries?: number;
  popoverMaxHeight?: JsonPopoverProps["maxHeight"];
  popoverMaxWidth?: JsonPopoverProps["maxWidth"];
  popoverPlacement?: JsonPopoverProps["placement"];
  popoverContentStyle?: JsonPopoverProps["contentStyle"];
}

const DEFAULT_POPOVER_CONTENT_STYLE: JsonPopoverProps["contentStyle"] = {
  fontSize: "12px",
} as const;

export function JsonPreview({
  value,
  title,
  emptyLabel,
  maxPreviewEntries = 6,
  popoverMaxHeight = "400px",
  popoverMaxWidth = "500px",
  popoverPlacement = "bottom",
  popoverContentStyle,
}: JsonPreviewProps) {
  const { t } = useTranslation();
  const empty = isEmpty(value);
  const resolvedEmptyLabel = emptyLabel ?? t("common.no-data");

  const tagContent = empty ? (
    <span className={styles.empty}>{resolvedEmptyLabel}</span>
  ) : (
    <PreviewContent value={value} maxEntries={maxPreviewEntries} />
  );

  return (
    <div className={styles.jsonPreview}>
      {empty ? (
        <Tag className={styles.tag}>{tagContent}</Tag>
      ) : isPrimitive(value) ? (
        <PrimitivePopover
          value={value}
          title={title}
          maxWidth={popoverMaxWidth}
          placement={popoverPlacement}
          tagClassName={styles.tagClickable}
        >
          {tagContent}
        </PrimitivePopover>
      ) : (
        <JsonPopover
          data={value}
          title={title}
          maxHeight={popoverMaxHeight}
          maxWidth={popoverMaxWidth}
          placement={popoverPlacement}
          tagClassName={styles.tagClickable}
          contentStyle={popoverContentStyle ?? DEFAULT_POPOVER_CONTENT_STYLE}
        >
          {tagContent}
        </JsonPopover>
      )}
    </div>
  );
}
