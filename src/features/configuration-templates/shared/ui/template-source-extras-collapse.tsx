import { PlusOutlined } from "@ant-design/icons";
import type {
  SshfsFilePublicSchema,
  TaskTemplatePublicSchema,
} from "@saltbox/saltbox-core-api-client";
import { BaseActionButton } from "@saltbox/saltbox-frontend-common";
import { Collapse, type CollapseProps, Flex, Tag } from "antd";
import { type MouseEvent, useEffect, useMemo, useRef, useState } from "react";
import { useTranslation } from "react-i18next";

import { TemplateSourceFilesList } from "../../files/ui/template-source-files-list";
import type { TemplatePreviewListProps } from "../../templates/hooks/use-template-preview-drawer";
import { TemplateSourceTemplatesList } from "../../templates/ui/template-source-templates-list";
import {
  TEMPLATE_SOURCE_FILES_PANEL_KEY,
  TEMPLATE_SOURCE_TEMPLATES_PANEL_KEY,
  type TemplateSourceExtrasPanelKey,
} from "../constants/template-source-extras-panel-keys";
import type { ResourceDeleteResult } from "../types/resource-delete-result";

import styles from "./template-source-extras-collapse.module.css";

export type TemplateSourceExtrasCollapseProps = {
  templates: {
    items: TaskTemplatePublicSchema[];
    totalCount?: number;
    searchQuery?: string;
    onCreateTemplate?: () => void;
    canCreateTemplate?: boolean;
    showEditTemplate?: boolean;
    canEditTemplates?: boolean;
    canDuplicateTemplates?: boolean;
    showDeleteTemplate?: boolean;
    canDeleteTemplates?: boolean;
    onDeleteTemplate?: (templateId: string) => Promise<void>;
    onDeleteTemplateError?: () => Promise<void>;
  } & Partial<TemplatePreviewListProps>;
  files: {
    items: SshfsFilePublicSchema[];
    totalCount?: number;
    searchQuery?: string;
    onDeleteFile: (fileId: string) => Promise<ResourceDeleteResult>;
    onDeleteError?: () => Promise<void>;
    canAddFile?: boolean;
    isAddFileInProgress?: boolean;
    onAddFileClick?: () => void;
  };
  constrainHeight?: boolean;
  defaultActiveKey?: TemplateSourceExtrasPanelKey[];
  forcedActiveKeys?: TemplateSourceExtrasPanelKey[];
};

function PanelLabel({ title, count }: { title: string; count: number }) {
  return (
    <Flex align="center" gap={8}>
      <span>{title}</span>
      <Tag bordered>{count}</Tag>
    </Flex>
  );
}

export function TemplateSourceExtrasCollapse({
  templates,
  files,
  constrainHeight = true,
  defaultActiveKey,
  forcedActiveKeys,
}: TemplateSourceExtrasCollapseProps) {
  const { t } = useTranslation();
  const wasSearchControlledRef = useRef(false);
  const [activeKey, setActiveKey] = useState<string[]>(defaultActiveKey ?? []);

  useEffect(() => {
    if (forcedActiveKeys !== undefined) {
      wasSearchControlledRef.current = true;
      setActiveKey(forcedActiveKeys);
      return;
    }

    if (wasSearchControlledRef.current) {
      wasSearchControlledRef.current = false;
      setActiveKey(defaultActiveKey ?? []);
    }
  }, [defaultActiveKey, forcedActiveKeys]);

  const items = useMemo<CollapseProps["items"]>(
    () => [
      {
        key: TEMPLATE_SOURCE_TEMPLATES_PANEL_KEY,
        label: (
          <PanelLabel
            title={t("configuration-templates.source.templates")}
            count={templates.totalCount ?? templates.items.length}
          />
        ),
        extra: templates.onCreateTemplate ? (
          <BaseActionButton
            icon={<PlusOutlined />}
            title={t("configuration-templates.source.add-template")}
            disabled={!templates.canCreateTemplate}
            onClick={(event: MouseEvent<HTMLButtonElement>) => {
              event.stopPropagation();
              templates.onCreateTemplate?.();
            }}
          />
        ) : undefined,
        children: (
          <Flex vertical gap="small">
            <TemplateSourceTemplatesList
              items={templates.items}
              constrainHeight={constrainHeight}
              searchQuery={templates.searchQuery}
              showEditTemplate={templates.showEditTemplate}
              canEditTemplates={templates.canEditTemplates}
              canDuplicateTemplates={templates.canDuplicateTemplates}
              showDeleteTemplate={templates.showDeleteTemplate}
              canDeleteTemplates={templates.canDeleteTemplates}
              onDeleteTemplate={templates.onDeleteTemplate}
              onDeleteError={templates.onDeleteTemplateError}
              onTemplateClick={templates.onTemplateClick}
              activeTemplateId={templates.activeTemplateId}
            />
          </Flex>
        ),
      },
      {
        key: TEMPLATE_SOURCE_FILES_PANEL_KEY,
        label: (
          <PanelLabel
            title={t("configuration-templates.source.files")}
            count={files.totalCount ?? files.items.length}
          />
        ),
        extra: files.onAddFileClick ? (
          <BaseActionButton
            icon={<PlusOutlined />}
            title={t("configuration-templates.source.add-file")}
            loading={files.isAddFileInProgress}
            disabled={!files.canAddFile || files.isAddFileInProgress}
            onClick={(event: MouseEvent<HTMLButtonElement>) => {
              event.stopPropagation();
              files.onAddFileClick?.();
            }}
          />
        ) : undefined,
        children: (
          <Flex vertical gap="small">
            <TemplateSourceFilesList
              onDeleteFile={files.onDeleteFile}
              onDeleteError={files.onDeleteError}
              items={files.items}
              constrainHeight={constrainHeight}
              searchQuery={files.searchQuery}
            />
          </Flex>
        ),
      },
    ],
    [constrainHeight, files, t, templates]
  );

  const handleChange = (keys: string | string[]) => {
    setActiveKey(Array.isArray(keys) ? keys : [keys]);
  };

  return (
    <Collapse
      className={styles.collapse}
      size="small"
      destroyOnHidden
      activeKey={activeKey}
      onChange={handleChange}
      items={items}
    />
  );
}
