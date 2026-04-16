import { Space, Typography } from "antd";

import styles from "./repo-card-details.module.css";

const { Text, Link } = Typography;

export interface RepoCardDetailsProps {
  href: string;
}

export function RepoCardDetails({ href }: RepoCardDetailsProps) {
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
