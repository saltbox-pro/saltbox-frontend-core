import type { ReactNode } from "react";

import styles from "./template-source-dimmed.module.css";

export type TemplateSourceDimmedProps = {
  dimmed?: boolean;
  children: ReactNode;
};

export function TemplateSourceDimmed({ dimmed = false, children }: TemplateSourceDimmedProps) {
  if (!dimmed) {
    return children;
  }

  return <div className={styles.dimmed}>{children}</div>;
}
