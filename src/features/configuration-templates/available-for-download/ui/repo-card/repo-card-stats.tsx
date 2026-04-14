import { ForkOutlined, StarFilled } from "@ant-design/icons";
import { Flex, Tag, Typography } from "antd";
import { useTranslation } from "react-i18next";

import styles from "./repo-card-stats.module.css";

const { Text } = Typography;

interface RepoCardStatsProps {
  starCount: number | undefined;
  forkCount: number | undefined;
}

export function RepoCardStats({ starCount = 0, forkCount = 0 }: RepoCardStatsProps) {
  const { t } = useTranslation();

  return (
    <Flex align="center">
      <Tag title={t("configuration-templates.repo.star-count-title")}>
        <StarFilled className={styles.start} />
        <Text type="secondary">{starCount}</Text>
      </Tag>
      <Tag title={t("configuration-templates.repo.fork-count-title")}>
        <ForkOutlined />
        <Text type="secondary">{forkCount}</Text>
      </Tag>
    </Flex>
  );
}
