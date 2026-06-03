import { Space, Typography } from "antd";

import styles from "./template-source-link.module.css";

const { Text, Link } = Typography;

export interface TemplateSourceLinkProps {
  href: string;
}

export function TemplateSourceLink({ href }: TemplateSourceLinkProps) {
  return (
    <Space align="start" size={3}>
      <Text type="secondary" className={styles.secondaryText}>
        URL:{" "}
      </Text>
      <Link href={href} target="_blank" rel="noreferrer">
        {href}
      </Link>
    </Space>
  );
}
