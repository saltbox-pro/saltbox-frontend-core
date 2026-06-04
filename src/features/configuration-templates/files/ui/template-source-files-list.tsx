import { CheckCircleOutlined, CloseCircleOutlined, DeleteOutlined } from "@ant-design/icons";
import { SshfsFileType, type SshfsFilePublicSchema } from "@saltbox/saltbox-core-api-client";
import { formatTimeByUserTZ, isGlobalServerError } from "@saltbox/saltbox-frontend-common";
import { Alert, Button, Flex, List, Tag, Tooltip, message } from "antd";
import { useCallback, useState, type MouseEvent } from "react";
import { useTranslation } from "react-i18next";

import { TemplateSourceSectionEmpty } from "../../shared/ui/template-source-section-empty";
import { useConfirmDeleteFile } from "../hooks/use-confirm-delete-file";
import type { SourceFilesStore } from "../model/source-files-store";

import styles from "./source-files-section.module.css";

export type TemplateSourceFilesListProps = {
  sourceId: string;
  filesStore: SourceFilesStore;
  items: SshfsFilePublicSchema[];
  isLoading: boolean;
  hasError?: boolean;
  constrainHeight?: boolean;
  canAddFile?: boolean;
  isAddFileInProgress?: boolean;
  onAddFileClick?: () => void;
};

export function TemplateSourceFilesList({
  sourceId,
  filesStore,
  items,
  isLoading,
  hasError = false,
  constrainHeight = true,
  canAddFile = false,
  isAddFileInProgress = false,
  onAddFileClick,
}: TemplateSourceFilesListProps) {
  const { t } = useTranslation();
  const [messageApi, contextHolder] = message.useMessage();
  const { confirmDeleteFile, modalContextHolder } = useConfirmDeleteFile();
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const showAddFile = isAddFileInProgress || (canAddFile && !!onAddFileClick);

  const handleAddFileClick = (event: MouseEvent<HTMLButtonElement>) => {
    event.stopPropagation();
    onAddFileClick?.();
  };

  const handleDelete = useCallback(
    async (file: SshfsFilePublicSchema) => {
      if (deletingId) return;

      setDeletingId(file.id);
      try {
        const result = await filesStore.deleteFile(sourceId, file.id);

        if (result === "not_found") {
          messageApi.warning(
            t("configuration-templates.source.files-delete-not-found", {
              path: file.rel_path,
            })
          );
        } else {
          messageApi.success(
            t("configuration-templates.source.files-delete-success", {
              path: file.rel_path,
            })
          );
        }
      } catch (reason) {
        if (isGlobalServerError(reason)) return;
        console.error("Failed to delete source file:", reason);
        messageApi.error(t("configuration-templates.source.files-delete-error"));
        await filesStore.loadAll(sourceId, { force: true });
      } finally {
        setDeletingId(null);
      }
    },
    [deletingId, filesStore, messageApi, sourceId, t]
  );

  const handleDeleteClick = useCallback(
    (event: MouseEvent<HTMLElement>, file: SshfsFilePublicSchema) => {
      event.stopPropagation();
      confirmDeleteFile({
        path: file.rel_path,
        onOk: () => handleDelete(file),
      });
    },
    [confirmDeleteFile, handleDelete]
  );

  const renderDeleteAction = (file: SshfsFilePublicSchema) => {
    if (file.file_type !== SshfsFileType.User) {
      return null;
    }

    return (
      <Tooltip title={t("configuration-templates.source.files-delete")}>
        <Button
          type="text"
          size="small"
          danger
          className={styles.fileDelete}
          icon={<DeleteOutlined />}
          loading={deletingId === file.id}
          disabled={deletingId !== null && deletingId !== file.id}
          onClick={(event) => handleDeleteClick(event, file)}
        />
      </Tooltip>
    );
  };

  return (
    <>
      {contextHolder}
      {modalContextHolder}
      {showAddFile && (
        <Flex justify="flex-end" className={styles.filesHeader}>
          <Button
            type="primary"
            size="small"
            loading={isAddFileInProgress}
            disabled={isAddFileInProgress}
            onClick={handleAddFileClick}
          >
            {t("configuration-templates.source.add-file")}
          </Button>
        </Flex>
      )}

      {hasError ? (
        <Alert
          message={t("configuration-templates.source.files-load-error")}
          type="error"
          showIcon
        />
      ) : (
        <List
          className={constrainHeight ? `${styles.files} ${styles.filesConstrained}` : styles.files}
          size="small"
          loading={isLoading && items.length === 0}
          dataSource={items}
          locale={{
            emptyText: (
              <TemplateSourceSectionEmpty
                description={t("configuration-templates.source.files-empty")}
              />
            ),
          }}
          renderItem={(file) => {
            const deleteAction = renderDeleteAction(file);

            return (
              <List.Item
                className={styles.fileItem}
                actions={deleteAction ? [deleteAction] : undefined}
                extra={<Tag className={styles.fileChecksum}>{file.checksum_type}</Tag>}
              >
                <List.Item.Meta
                  title={
                    <Flex align="center" gap={8} className={styles.fileTitle}>
                      <Tooltip
                        title={
                          !file.synced_on_sshfs && file.last_sync_error
                            ? file.last_sync_error
                            : undefined
                        }
                      >
                        {file.synced_on_sshfs ? (
                          <CheckCircleOutlined className={styles.fileSyncOk} />
                        ) : (
                          <CloseCircleOutlined className={styles.fileSyncError} />
                        )}
                      </Tooltip>
                      <span className={styles.filePath}>{file.rel_path}</span>
                    </Flex>
                  }
                  description={formatTimeByUserTZ(file.modified)}
                />
              </List.Item>
            );
          }}
          split={false}
        />
      )}
    </>
  );
}
