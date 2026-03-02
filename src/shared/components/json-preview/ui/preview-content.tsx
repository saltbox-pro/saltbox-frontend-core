import { Fragment } from "react";

import { formatKey, formatValue } from "../helpers/format-value";

import styles from "./json-preview.module.css";

const STRING_PREVIEW_MAX_LEN = 40;

export interface PreviewContentProps {
  value: unknown;
  maxEntries: number;
}

export function PreviewContent({ value, maxEntries }: PreviewContentProps) {
  if (value === null) {
    return <span className={styles.primitive}>null</span>;
  }

  if (typeof value === "number" || typeof value === "boolean") {
    return <span className={styles.primitive}>{String(value)}</span>;
  }

  if (typeof value === "string") {
    const shortened =
      value.length > STRING_PREVIEW_MAX_LEN
        ? `${value.slice(0, STRING_PREVIEW_MAX_LEN - 4)}…`
        : value;
    return (
      <>
        <span className={styles.quote}>"</span>
        <span className={styles.string}>{shortened}</span>
        <span className={styles.quote}>"</span>
      </>
    );
  }

  if (Array.isArray(value)) {
    const items = value.slice(0, maxEntries).map((item, index) => (
      <Fragment key={index}>
        <span className={styles.value}>{formatValue(item)}</span>
        {index < Math.min(value.length, maxEntries) - 1 && (
          <span className={styles.separator}>, </span>
        )}
      </Fragment>
    ));
    const hasMore = value.length > maxEntries;
    return (
      <>
        <span className={styles.brace}>[</span>
        {items.length > 0 ? items : null}
        {hasMore && <span className={styles.ellipsis}>…</span>}
        <span className={styles.brace}>]</span>
      </>
    );
  }

  if (typeof value === "object" && value !== null) {
    const entries = Object.entries(value as Record<string, unknown>);
    const previewEntries = entries.slice(0, maxEntries);
    const hasMore = entries.length > maxEntries;

    if (entries.length === 0) {
      return (
        <>
          <span className={styles.brace}>{"{"}</span>
          <span className={styles.brace}>{"}"}</span>
        </>
      );
    }

    return (
      <>
        <span className={styles.brace}>{"{"}</span>
        {previewEntries.map(([key, val], index) => (
          <Fragment key={key}>
            <span className={styles.key}>{formatKey(key)}</span>
            <span className={styles.separator}>: </span>
            <span className={styles.value}>{formatValue(val)}</span>
            {index < previewEntries.length - 1 && <span className={styles.separator}>, </span>}
          </Fragment>
        ))}
        {hasMore && <span className={styles.ellipsis}>…</span>}
        <span className={styles.brace}>{"}"}</span>
      </>
    );
  }

  return null;
}
