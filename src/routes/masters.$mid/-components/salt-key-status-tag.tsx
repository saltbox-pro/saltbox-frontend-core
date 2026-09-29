import { SaltKeyStatusType } from "@saltbox/saltbox-core-api-client";
import { Tag } from "antd";
import { useTranslation } from "react-i18next";

type SaltKeyStatusTagProps = {
  status: SaltKeyStatusType;
};

export function SaltKeyStatusTag({ status }: SaltKeyStatusTagProps) {
  const { t } = useTranslation();

  switch (status) {
    case SaltKeyStatusType.Unaccepted:
      return <Tag color="blue">{t("master.table-status-unaccepted")}</Tag>;
    case SaltKeyStatusType.Accepted:
      return <Tag color="green">{t("master.table-status-accepted")}</Tag>;
    case SaltKeyStatusType.Rejected:
      return <Tag color="default">{t("master.table-status-rejected")}</Tag>;
    case SaltKeyStatusType.Denied:
      return <Tag color="red">{t("master.table-status-denied")}</Tag>;
    default:
      return <Tag>{`${t("master.table-status-unknown")}: ${status}`}</Tag>;
  }
}
