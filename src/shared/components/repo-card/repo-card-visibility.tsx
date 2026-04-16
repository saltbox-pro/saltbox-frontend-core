import { GlobalOutlined, LockOutlined, TeamOutlined } from "@ant-design/icons";
import { Tag } from "antd";
import { useMemo } from "react";
import { useTranslation } from "react-i18next";

interface RepoCardVisibilityProps {
  visibility?: string;
}

export function RepoCardVisibility({ visibility }: RepoCardVisibilityProps) {
  const { t } = useTranslation();

  const icon = useMemo(() => {
    if (!visibility) return null;

    if (visibility === "public") return <GlobalOutlined />;
    if (visibility === "internal") return <TeamOutlined />;
    if (visibility === "private") return <LockOutlined />;

    return null;
  }, [visibility]);

  if (!visibility) return null;

  return <Tag icon={icon}>{t(`configuration-templates.repo.visibility.${visibility}`)}</Tag>;
}
