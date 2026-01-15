import { SearchOutlined } from "@ant-design/icons";
import { Modal } from "@saltbox/saltbox-frontend-common";
import {
  Badge,
  Empty,
  Flex,
  Input,
  InputRef,
  List,
  Select,
  Tooltip,
  Typography,
  message,
} from "antd";
import { useEffect, useMemo, useRef, useState } from "react";
import { useTranslation } from "react-i18next";

import { taskTemplateService } from "../service";
import { TaskTemplateWithRepository, TemplateListFilterOptions } from "../type/types";

import styles from "./template-list-modal.module.css";

const { Title, Paragraph } = Typography;

export type TemplateListModalProps = {
  isOpen: boolean;
  onClose: () => void;
  onSelectTemplate: (templateId: string) => void;
};

const useSearch = ({ isOpen }: TemplateListModalProps) => {
  const searchInputRef = useRef<InputRef>(null);

  useEffect(() => {
    searchInputRef.current?.focus();
  }, [isOpen]);

  return { searchInputRef };
};

export function TemplateListModal(props: TemplateListModalProps) {
  const { isOpen, onClose, onSelectTemplate } = props;
  const { t } = useTranslation();
  const [messageApi, contextHolder] = message.useMessage();

  const { searchInputRef } = useSearch(props);

  const [isLoading, setIsLoading] = useState(false);
  const [templates, setTemplates] = useState<TaskTemplateWithRepository[]>([]);
  const [filters, setFilters] = useState<TemplateListFilterOptions>({
    searchQuery: "",
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
    setFilters((prev) => ({ ...prev, searchQuery: value }));
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
        title={t("task-create.select-template-title")}
        open={isOpen}
        onCancel={onClose}
        footer={null}
        maskClosable={false}
        width="min(80vw, 600px)"
      >
        <Flex className={styles.root} vertical gap="middle">
          <Input
            ref={searchInputRef}
            placeholder={t("task-create.search-templates-placeholder")}
            prefix={<SearchOutlined />}
            value={filters.searchQuery}
            onChange={(e) => handleSearchChange(e.target.value)}
            allowClear
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
                filters.searchQuery || filters.repositoryFilter
                  ? t("task-create.no-templates-found")
                  : t("task-create.no-templates-available")
              }
            />
          ) : (
            <List
              className={styles.templateList}
              dataSource={filteredTemplates}
              loading={isLoading}
              renderItem={(template) => (
                <List.Item
                  className={styles.listItem}
                  onClick={() => handleTemplateSelect(template.id)}
                >
                  <Flex gap="small" justify="space-between" className={styles.listItemWrapper}>
                    <Tooltip title={template.title || template.id}>
                      <Title className={styles.listItemPart} level={5} ellipsis>
                        {template.title || template.id}
                      </Title>
                    </Tooltip>
                    {template.repository && (
                      <Badge
                        count={template.repository}
                        classNames={{ indicator: styles.repoBadge }}
                      />
                    )}
                  </Flex>
                </List.Item>
              )}
            />
          )}
        </Flex>
      </Modal>
    </>
  );
}
