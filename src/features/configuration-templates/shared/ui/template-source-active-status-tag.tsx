import { Tag } from "antd";
import { useTranslation } from "react-i18next";

export function TemplateSourceActiveStatusTag() {
  const { t } = useTranslation();

  return <Tag color="green">{t("configuration-templates.source.status.active")}</Tag>;
}
