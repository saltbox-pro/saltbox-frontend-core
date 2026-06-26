import clsx from "clsx";
import type { ReactNode } from "react";

import styles from "./template-source-dimmed.module.css";

export type TemplateSourceDimmedProps = {
  dimmed?: boolean;
  children: ReactNode;
};

export function TemplateSourceDimmed({ dimmed = false, children }: TemplateSourceDimmedProps) {
  return <div className={clsx(dimmed && styles.dimmed)}>{children}</div>;
}
