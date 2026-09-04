import { BranchesOutlined, LinkOutlined } from "@ant-design/icons";
import { Divider, Space, Typography } from "antd";
import { useTranslation } from "react-i18next";

import styles from "./template-source-link.module.css";

const { Text, Link } = Typography;

export interface TemplateSourceLinkProps {
  href: string;
  branch?: string;
}

export function TemplateSourceLink({ href, branch }: TemplateSourceLinkProps) {
  const { t } = useTranslation();

  return (
    <Space align="start" size={2} split={<Divider type="vertical" size="small" />} wrap>
      <Space align="start" size={3}>
        <Text type="secondary" className={styles.secondaryText}>
          <LinkOutlined /> URL:
        </Text>
        <Link href={href} target="_blank" rel="noreferrer">
          {href}
        </Link>
      </Space>

      {!!branch && (
        <Space align="start" size={3}>
          <Text type="secondary" className={styles.secondaryText}>
            <BranchesOutlined /> {t("configuration-templates.source.branch")}:
          </Text>
          <Text>{branch}</Text>
        </Space>
      )}
    </Space>
  );
}
