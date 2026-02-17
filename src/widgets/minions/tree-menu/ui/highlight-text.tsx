import { memo } from "react";

import styles from "./highlight-text.module.css";

export interface HighlightTextProps {
  text: string;
  search: string;
  isMatched: boolean;
}

export const HighlightText = memo(function HighlightText({
  text,
  search,
  isMatched,
}: HighlightTextProps) {
  if (!search) {
    return <span>{text}</span>;
  }

  const idx = text.toLowerCase().indexOf(search.toLowerCase());

  if (idx === -1) {
    return <span className={!isMatched ? styles.highlightTextDimmed : undefined}>{text}</span>;
  }

  return (
    <span className={isMatched ? styles.highlightTextBold : undefined}>
      {text.slice(0, idx)}
      <mark className={styles.highlightTextMark}>{text.slice(idx, idx + search.length)}</mark>
      {text.slice(idx + search.length)}
    </span>
  );
});
