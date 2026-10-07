import { Flex, List, Tag } from "antd";
import clsx from "clsx";
import { useTranslation } from "react-i18next";

import filesListStyles from "../../files/ui/template-source-files-list.module.css";
import { CONTENT_UPDATE_CHANGE_TYPE_PRESENTATION } from "../constants/change-types";
import type { ContentUpdateFile } from "../types/content-update";

import styles from "./changed-files-list.module.css";

type ChangedFilesListProps = {
  files: ContentUpdateFile[];
};

export function ChangedFilesList({ files }: ChangedFilesListProps) {
  const { t } = useTranslation();

  return (
    <List
      className={clsx(filesListStyles.files, filesListStyles.filesConstrained, styles.files)}
      size="small"
      split={false}
      dataSource={files}
      rowKey={(file) => `${file.change_type}:${file.path}`}
      renderItem={(file) => {
        const presentation = CONTENT_UPDATE_CHANGE_TYPE_PRESENTATION[file.change_type];

        return (
          <List.Item className={filesListStyles.fileItem}>
            <List.Item.Meta
              title={
                <Flex align="center" gap={8} className={filesListStyles.fileTitle}>
                  <Tag className={styles.changeTag} color={presentation?.color}>
                    {presentation ? t(presentation.labelKey) : file.change_type}
                  </Tag>
                  <span className={clsx(filesListStyles.filePath, styles.path)} title={file.path}>
                    {file.path}
                  </span>
                </Flex>
              }
            />
          </List.Item>
        );
      }}
    />
  );
}
