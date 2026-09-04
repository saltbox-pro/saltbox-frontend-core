import { FolderOutlined, BlockOutlined } from "@ant-design/icons";
import { Space, Typography } from "antd";
import type { ReactNode } from "react";
import { useTranslation } from "react-i18next";

import styles from "./template-source-link.module.css";

const { Text } = Typography;

type TemplateSourceMetaFieldProps = {
  icon: ReactNode;
  label: string;
  value: string;
};

function TemplateSourceMetaField({ icon, label, value }: TemplateSourceMetaFieldProps) {
  return (
    <Space align="start" size={3}>
      <Text type="secondary" className={styles.secondaryText}>
        {icon} {label}:
      </Text>
      <Text>{value}</Text>
    </Space>
  );
}

type TemplateSourceMountedPathProps = {
  path: string;
};

export function TemplateSourceMountedPath({ path }: TemplateSourceMountedPathProps) {
  const { t } = useTranslation();

  return (
    <TemplateSourceMetaField
      icon={<FolderOutlined />}
      label={t("configuration-templates.source.mounted-path")}
      value={path}
    />
  );
}

type TemplateSourceNamespaceProps = {
  namespace: string;
};

export function TemplateSourceNamespace({ namespace }: TemplateSourceNamespaceProps) {
  const { t } = useTranslation();

  return (
    <TemplateSourceMetaField
      icon={<BlockOutlined />}
      label={t("configuration-templates.source-form.namespace")}
      value={namespace}
    />
  );
}
