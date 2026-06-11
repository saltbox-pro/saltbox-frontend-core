import { CheckCircleOutlined, CloseCircleOutlined, DeleteOutlined } from "@ant-design/icons";
import { SshfsFileType, type SshfsFilePublicSchema } from "@saltbox/saltbox-core-api-client";
import {
  BaseActionButton,
  formatTimeByUserTZ,
  isGlobalServerError,
  SearchHighlightText,
} from "@saltbox/saltbox-frontend-common";
import { Flex, List, Tag, Tooltip, message } from "antd";
import { useCallback, useState, type MouseEvent } from "react";
import { useTranslation } from "react-i18next";

import type { ResourceDeleteResult } from "../../shared/types/resource-delete-result";
import { TemplateSourceSectionEmpty } from "../../shared/ui/template-source-section-empty";
import { useConfirmDeleteFile } from "../hooks/use-confirm-delete-file";

import styles from "./template-source-files-list.module.css";

export type TemplateSourceFilesListProps = {
  onDeleteFile: (fileId: string) => Promise<ResourceDeleteResult>;
  onDeleteError?: () => Promise<void>;
  items: SshfsFilePublicSchema[];
  constrainHeight?: boolean;
  searchQuery?: string;
};

export function TemplateSourceFilesList({
  onDeleteFile,
  onDeleteError,
  items,
  constrainHeight = true,
  searchQuery,
}: TemplateSourceFilesListProps) {
  const { t } = useTranslation();
  const [messageApi, contextHolder] = message.useMessage();
  const { confirmDeleteFile, modalContextHolder } = useConfirmDeleteFile();
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const handleDelete = useCallback(
    async (file: SshfsFilePublicSchema) => {
      if (deletingId) return;

      setDeletingId(file.id);
      try {
        const result = await onDeleteFile(file.id);

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
        await onDeleteError?.();
      } finally {
        setDeletingId(null);
      }
    },
    [deletingId, messageApi, onDeleteError, onDeleteFile, t]
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
      <BaseActionButton
        className={styles.fileDelete}
        color="danger"
        icon={<DeleteOutlined />}
        title={t("configuration-templates.source.files-delete")}
        loading={deletingId === file.id}
        disabled={deletingId !== null && deletingId !== file.id}
        onClick={(event) => handleDeleteClick(event, file)}
      />
    );
  };

  return (
    <>
      {contextHolder}
      {modalContextHolder}
      <List
        className={constrainHeight ? `${styles.files} ${styles.filesConstrained}` : styles.files}
        size="small"
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
                    <span className={styles.filePath}>
                      <SearchHighlightText text={file.rel_path} query={searchQuery} />
                    </span>
                  </Flex>
                }
                description={formatTimeByUserTZ(file.modified)}
              />
            </List.Item>
          );
        }}
        split={false}
      />
    </>
  );
}
