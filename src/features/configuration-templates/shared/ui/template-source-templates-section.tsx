import type { TaskTemplatePublicSchema } from "@saltbox/saltbox-core-api-client";
import { Collapse, type CollapseProps, Flex } from "antd";
import { useMemo } from "react";
import { useTranslation } from "react-i18next";

import { TemplateSourceTemplatesList } from "./template-source-templates-list";
import styles from "./template-source-templates-section.module.css";

const TEMPLATES_PANEL_KEY = "templates";

export interface TemplateSourceTemplatesSectionProps {
  items: TaskTemplatePublicSchema[];
  isLoading: boolean;
  hasError?: boolean;
  onOpen: () => void;
  defaultExpanded?: boolean;
}

export function TemplateSourceTemplatesSection({
  items,
  isLoading,
  hasError = false,
  onOpen,
  defaultExpanded = false,
}: TemplateSourceTemplatesSectionProps) {
  const { t } = useTranslation();

  const collapses = useMemo<CollapseProps["items"]>(
    () => [
      {
        key: TEMPLATES_PANEL_KEY,
        label: t("configuration-templates.source.templates"),
        children: (
          <Flex vertical gap="small">
            <TemplateSourceTemplatesList
              items={items}
              isLoading={isLoading}
              hasError={hasError}
              constrainHeight={!defaultExpanded}
            />
          </Flex>
        ),
      },
    ],
    [defaultExpanded, hasError, isLoading, items, t]
  );

  return (
    <Collapse
      className={styles.container}
      items={collapses}
      size="small"
      ghost
      destroyOnHidden
      defaultActiveKey={defaultExpanded ? [TEMPLATES_PANEL_KEY] : undefined}
      onChange={(keys) => {
        const opened = Array.isArray(keys)
          ? keys.includes(TEMPLATES_PANEL_KEY)
          : keys === TEMPLATES_PANEL_KEY;
        if (opened) onOpen();
      }}
    />
  );
}
