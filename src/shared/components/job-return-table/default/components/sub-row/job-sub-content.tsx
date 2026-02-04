import type { PropsWithChildren } from "react";

import styles from "./job-sub-string.module.css";

type JobSubContentProps = PropsWithChildren;

export function JobSubContent({ children }: JobSubContentProps) {
  return <div className={styles.stringData}>{children}</div>;
}
