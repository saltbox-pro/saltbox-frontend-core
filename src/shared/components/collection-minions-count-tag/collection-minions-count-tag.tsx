import { Tag } from "antd";
import { useTranslation } from "react-i18next";

type CollectionMinionsCountTagProps = {
  count: number;
  className?: string;
};

export function CollectionMinionsCountTag({ count, className }: CollectionMinionsCountTagProps) {
  const { t } = useTranslation();
  const label = t("collection.clients-count", { count });

  return (
    <Tag bordered className={className} title={label} aria-label={label}>
      {count}
    </Tag>
  );
}
