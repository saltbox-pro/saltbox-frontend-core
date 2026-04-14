import { Tag } from "antd";
import { useMemo } from "react";
import { useTranslation } from "react-i18next";

interface RepoCardVisibilityProps {
  visibility: string;
}

export function RepoCardVisibility({ visibility }: RepoCardVisibilityProps) {
  const { t } = useTranslation();

  const color = useMemo(() => {
    if (visibility === "public") return "green";
    if (visibility === "internal") return "blue";
    if (visibility === "private") return "red";

    return null;
  }, [visibility]);

  return <Tag color={color}>{t(`configuration-templates.repo.visibility.${visibility}`)}</Tag>;
}
