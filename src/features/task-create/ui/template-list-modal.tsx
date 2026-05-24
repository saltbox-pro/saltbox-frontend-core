import { TaskType } from "@saltbox/saltbox-core-api-client";
import { Modal, SearchInput, isGlobalServerError } from "@saltbox/saltbox-frontend-common";
import { Badge, Empty, Flex, List, Select, Tooltip, Typography, message } from "antd";
import { useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";

import {
  getTemplateDescriptionText,
  type TemplateDescriptionValue,
} from "saltbox-core/shared/utils/template-description";

import { taskTemplateService } from "../service";
import { TaskTemplateWithRepository, TemplateListFilterOptions } from "../type/types";

import styles from "./template-list-modal.module.css";

const { Title } = Typography;

export type TemplateListModalProps = {
  type: TaskType;
  isOpen: boolean;
  onClose: () => void;
  onSelectTemplate: (templateId: string) => void;
};

export function TemplateListModal(props: TemplateListModalProps) {
  const { isOpen, onClose, onSelectTemplate } = props;
  const { t, i18n } = useTranslation();
  const [messageApi, contextHolder] = message.useMessage();

  const [isLoading, setIsLoading] = useState(false);
  const [templates, setTemplates] = useState<TaskTemplateWithRepository[]>([]);
  const [filters, setFilters] = useState<TemplateListFilterOptions>({
    appliedSearchQuery: "",
    repositoryFilter: null,
  });

  const repositories = useMemo(
    () => taskTemplateService.getUniqueRepositories(templates),
    [templates]
  );

  const filteredTemplates = useMemo(
    () => taskTemplateService.filterTemplates(templates, filters),
    [templates, filters]
  );

  useEffect(() => {
    const loadTemplates = async () => {
      setIsLoading(true);
      try {
        const loadedTemplates = await taskTemplateService.loadTemplates();
        setTemplates(loadedTemplates);
      } catch (error) {
        if (isGlobalServerError(error)) return;
        messageApi.error(t("task-create.error-loading-templates"));
      } finally {
        setIsLoading(false);
      }
    };

    if (isOpen) {
      loadTemplates();
    }
  }, [isOpen, messageApi, t]);

  const handleSearchChange = (value: string) => {
    setFilters((prev) => ({ ...prev, appliedSearchQuery: value }));
  };

  const handleRepositoryChange = (value: string | null) => {
    setFilters((prev) => ({ ...prev, repositoryFilter: value }));
  };

  const handleTemplateSelect = (templateId: string) => {
    onSelectTemplate(templateId);
  };

  return (
    <>
      {contextHolder}
      <Modal
        title={t(
          props.type === TaskType.Policy
            ? "policy-create.select-template-title"
            : "task-create.select-template-title"
        )}
        open={isOpen}
        onCancel={onClose}
        footer={null}
        maskClosable={false}
        width="min(80vw, 600px)"
      >
        <Flex className={styles.root} vertical gap="middle">
          <SearchInput
            placeholder={t("task-create.search-templates-placeholder")}
            autoFocus={isOpen}
            onSearch={handleSearchChange}
          />

          <Select
            placeholder={t("task-create.filter-by-repository")}
            value={filters.repositoryFilter}
            onChange={handleRepositoryChange}
            allowClear
            options={repositories.map((repo) => ({
              label: repo,
              value: repo,
            }))}
          />
          {!isLoading && filteredTemplates.length === 0 ? (
            <Empty
              image={Empty.PRESENTED_IMAGE_SIMPLE}
              description={
                filters.appliedSearchQuery || filters.repositoryFilter
                  ? t("task-create.no-templates-found")
                  : t("task-create.no-templates-available")
              }
            />
          ) : (
            <List
              className={styles.templateList}
              dataSource={filteredTemplates}
              loading={isLoading}
              renderItem={(template) => {
                const description = getTemplateDescriptionText(
                  template.description as TemplateDescriptionValue,
                  i18n.language
                );
                return (
                  <List.Item
                    className={styles.listItem}
                    onClick={() => handleTemplateSelect(template.id)}
                  >
                    <Flex gap="small" justify="space-between" className={styles.listItemWrapper}>
                      <Flex vertical gap={2} className={styles.listItemText}>
                        <Tooltip title={template.title || template.id}>
                          <Title className={styles.listItemPart} level={5} ellipsis>
                            {template.title || template.id}
                          </Title>
                        </Tooltip>
                        {description ? (
                          <span className={styles.description} title={description}>
                            {description}
                          </span>
                        ) : null}
                      </Flex>
                      {template.repository ? (
                        <Badge
                          count={template.repository}
                          classNames={{ indicator: styles.repoBadge }}
                        />
                      ) : null}
                    </Flex>
                  </List.Item>
                );
              }}
            />
          )}
        </Flex>
      </Modal>
    </>
  );
}
