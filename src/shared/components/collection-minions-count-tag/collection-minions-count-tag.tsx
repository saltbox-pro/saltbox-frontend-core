import { Tag } from "antd";
import clsx from "clsx";
import { useTranslation } from "react-i18next";

import styles from "./collection-minions-count-tag.module.css";

type CollectionMinionsCountTagProps = {
  count: number;
  className?: string;
};

export function CollectionMinionsCountTag({ count, className }: CollectionMinionsCountTagProps) {
  const { t } = useTranslation();
  const label = t("collection.clients-count", { count });

  return (
    <Tag bordered className={clsx(styles.tag, className)} title={label} aria-label={label}>
      {count}
    </Tag>
  );
}
