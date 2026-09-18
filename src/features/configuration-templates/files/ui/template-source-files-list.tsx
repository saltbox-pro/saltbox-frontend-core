import { CheckCircleOutlined, CloseCircleOutlined, DeleteOutlined } from "@ant-design/icons";
import { SshfsFileType, type SshfsFilePublicSchema } from "@saltbox/saltbox-core-api-client";
import {
  BaseActionButton,
  formatTimeByUserTZ,
  notify,
  runMutation,
  SearchHighlightText,
} from "@saltbox/saltbox-frontend-common";
import { Flex, List, Tag, Tooltip } from "antd";
import clsx from "clsx";
import { useCallback, useRef, useState } from "react";
import { useTranslation } from "react-i18next";

import { TemplateSourceSectionEmpty } from "saltbox-core/features/template-source-ui";

import type { ResourceDeleteResult } from "../../shared/types/resource-delete-result";
import { useConfirmDeleteFile } from "../hooks/use-confirm-delete-file";

import styles from "./template-source-files-list.module.css";

export type TemplateSourceFilesListProps = {
  onDeleteFile: (fileId: string) => Promise<ResourceDeleteResult>;
  onDeleteError?: () => Promise<void>;
  items: SshfsFilePublicSchema[];
  constrainHeight?: boolean;
  searchQuery?: string;
  canDeleteFile?: boolean;
};

export function TemplateSourceFilesList({
  onDeleteFile,
  onDeleteError,
  items,
  constrainHeight = true,
  searchQuery,
  canDeleteFile = true,
}: TemplateSourceFilesListProps) {
  const { t } = useTranslation();
  const { confirmDeleteFile, modalContextHolder } = useConfirmDeleteFile();
  const [deletingIds, setDeletingIds] = useState<Set<string>>(() => new Set());
  const deletingIdsRef = useRef<Set<string>>(new Set());
  const canDeleteFileRef = useRef(canDeleteFile);
  canDeleteFileRef.current = canDeleteFile;

  const handleDelete = useCallback(
    async (file: SshfsFilePublicSchema) => {
      if (!canDeleteFileRef.current || deletingIdsRef.current.has(file.id)) return;

      const next = new Set(deletingIdsRef.current).add(file.id);
      deletingIdsRef.current = next;
      setDeletingIds(next);

      const result = await runMutation({
        run: () => onDeleteFile(file.id),
        errorMessage: t("configuration-templates.source.files-delete-error"),
      });

      const done = new Set(deletingIdsRef.current);
      done.delete(file.id);
      deletingIdsRef.current = done;
      setDeletingIds(done);

      if (!result.ok) {
        await onDeleteError?.();
        return;
      }

      if (result.data === "not_found") {
        notify.warning(
          t("configuration-templates.source.files-delete-not-found", {
            path: file.rel_path,
          })
        );
        return;
      }

      notify.success(
        t("configuration-templates.source.files-delete-success", {
          path: file.rel_path,
        })
      );
    },
    [onDeleteError, onDeleteFile, t]
  );

  const handleDeleteClick = useCallback(
    (file: SshfsFilePublicSchema) => {
      if (!canDeleteFile) return;

      confirmDeleteFile({
        path: file.rel_path,
        onOk: () => handleDelete(file),
      });
    },
    [canDeleteFile, confirmDeleteFile, handleDelete]
  );

  return (
    <>
      {modalContextHolder}
      <List
        className={clsx(styles.files, constrainHeight && styles.filesConstrained)}
        size="small"
        dataSource={items}
        locale={{
          emptyText: (
            <TemplateSourceSectionEmpty
              description={t("configuration-templates.source.files-empty")}
            />
          ),
        }}
        renderItem={(file) => (
          <List.Item
            className={styles.fileItem}
            extra={
              <Flex align="center" gap={8} wrap="wrap" justify="flex-end">
                <Tag className={styles.fileChecksum}>{file.checksum_type}</Tag>

                {file.file_type === SshfsFileType.User && (
                  <Flex align="center" gap={4}>
                    <BaseActionButton
                      color="danger"
                      icon={<DeleteOutlined />}
                      title={t("configuration-templates.source.files-delete")}
                      loading={deletingIds.has(file.id)}
                      disabled={!canDeleteFile}
                      onClick={() => handleDeleteClick(file)}
                    />
                  </Flex>
                )}
              </Flex>
            }
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
        )}
        split={false}
      />
    </>
  );
}
