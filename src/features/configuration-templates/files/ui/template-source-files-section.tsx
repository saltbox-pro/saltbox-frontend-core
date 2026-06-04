import type { SshfsFilePublicSchema } from "@saltbox/saltbox-core-api-client";
import { Collapse, type CollapseProps, Flex } from "antd";
import { useMemo } from "react";
import { useTranslation } from "react-i18next";

import collapseStyles from "../../shared/ui/collapse-section.module.css";
import type { SourceFilesStore } from "../model/source-files-store";

import { TemplateSourceFilesList } from "./template-source-files-list";

const FILES_PANEL_KEY = "files";

export interface TemplateSourceFilesSectionProps {
  items: SshfsFilePublicSchema[];
  isLoading: boolean;
  hasError?: boolean;
  onOpen: () => void;
  defaultExpanded?: boolean;
  sourceId: string;
  filesStore: SourceFilesStore;
  canAddFile?: boolean;
  isAddFileInProgress?: boolean;
  onAddFileClick?: () => void;
}

export function TemplateSourceFilesSection({
  items,
  isLoading,
  hasError = false,
  onOpen,
  defaultExpanded = false,
  sourceId,
  filesStore,
  canAddFile = false,
  isAddFileInProgress = false,
  onAddFileClick,
}: TemplateSourceFilesSectionProps) {
  const { t } = useTranslation();

  const collapses = useMemo<CollapseProps["items"]>(
    () => [
      {
        key: FILES_PANEL_KEY,
        label: t("configuration-templates.source.files"),
        children: (
          <Flex vertical gap="small">
            <TemplateSourceFilesList
              sourceId={sourceId}
              filesStore={filesStore}
              items={items}
              isLoading={isLoading}
              hasError={hasError}
              constrainHeight={!defaultExpanded}
              canAddFile={canAddFile}
              isAddFileInProgress={isAddFileInProgress}
              onAddFileClick={onAddFileClick}
            />
          </Flex>
        ),
      },
    ],
    [
      canAddFile,
      isAddFileInProgress,
      defaultExpanded,
      filesStore,
      hasError,
      isLoading,
      items,
      onAddFileClick,
      sourceId,
      t,
    ]
  );

  return (
    <Collapse
      className={collapseStyles.container}
      items={collapses}
      size="small"
      ghost
      destroyOnHidden
      defaultActiveKey={defaultExpanded ? [FILES_PANEL_KEY] : undefined}
      onChange={(keys) => {
        const opened = Array.isArray(keys)
          ? keys.includes(FILES_PANEL_KEY)
          : keys === FILES_PANEL_KEY;
        if (opened) onOpen();
      }}
    />
  );
}
