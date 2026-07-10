import { Space, Typography } from "antd";
import { useTranslation } from "react-i18next";

import styles from "./template-source-link.module.css";

const { Text } = Typography;

type TemplateSourceMetaFieldProps = {
  label: string;
  value: string;
};

function TemplateSourceMetaField({ label, value }: TemplateSourceMetaFieldProps) {
  return (
    <Space align="start" size={3}>
      <Text type="secondary" className={styles.secondaryText}>
        {label}:{" "}
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
      label={t("configuration-templates.source-form.namespace")}
      value={namespace}
    />
  );
}
