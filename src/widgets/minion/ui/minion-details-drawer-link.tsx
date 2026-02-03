import { ExportOutlined } from "@ant-design/icons";
import { Button } from "antd";
import { useTranslation } from "react-i18next";
import { Link } from "react-router";

interface MinionDetailsDrawerLinkProps {
  slug: string;
  id: string;
}

export function MinionDetailsDrawerLink({ slug, id }: MinionDetailsDrawerLinkProps) {
  const { t } = useTranslation();

  return (
    <Link to={`/minion/${slug}/${id}`}>
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
