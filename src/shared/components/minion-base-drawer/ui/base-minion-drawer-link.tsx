import { ExportOutlined } from "@ant-design/icons";
import { Button } from "antd";
import { useTranslation } from "react-i18next";
import { Link } from "react-router";

interface BaseMinionDrawerLinkProps {
  slug: string;
  innerId: string;
}

export function BaseMinionDrawerLink({ slug, innerId }: BaseMinionDrawerLinkProps) {
  const { t } = useTranslation();

  return (
    <Link to={`/minions/${slug}/${innerId}`}>
      <Button
        color="default"
        variant="outlined"
        size="small"
        icon={<ExportOutlined />}
        title={t("minions.open-minion-details-page")}
      />
    </Link>
  );
}
