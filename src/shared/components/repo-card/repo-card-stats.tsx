import { ForkOutlined, StarFilled } from "@ant-design/icons";
import { Tag } from "antd";
import { useTranslation } from "react-i18next";

import styles from "./repo-card-stats.module.css";

interface RepoCardStatsProps {
  starCount: number | undefined;
  forkCount: number | undefined;
}

export function RepoCardStats({ starCount = 0, forkCount = 0 }: RepoCardStatsProps) {
  const { t } = useTranslation();

  return (
    <>
      <Tag
        icon={<StarFilled className={styles.start} />}
        title={t("configuration-templates.repo.star-count-title")}
      >
        {starCount.toString()}
      </Tag>

      <Tag icon={<ForkOutlined />} title={t("configuration-templates.repo.fork-count-title")}>
        {forkCount.toString()}
      </Tag>
    </>
  );
}
