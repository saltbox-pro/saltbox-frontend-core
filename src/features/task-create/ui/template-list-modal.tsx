import { TaskType } from "@saltbox/saltbox-core-api-client";
import {
  Modal,
  SearchInput,
  isGlobalServerError,
  useFocusOnOpenChange,
} from "@saltbox/saltbox-frontend-common";
import { Alert, Button, Empty, Flex, Spin, Table, Tooltip, message, type InputRef } from "antd";
import type { ColumnsType } from "antd/es/table";
import { useCallback, useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";

import {
  getTemplateDescriptionText,
  type TemplateDescriptionValue,
} from "saltbox-core/shared/utils/template-description";

import { filterSourceRows, type TemplateSourceRow } from "../helpers/template-picker-rows";
import { taskTemplateService } from "../service";
import type { TaskTemplateWithRepository } from "../type/types";

import styles from "./template-list-modal.module.css";

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

  const [sourceRows, setSourceRows] = useState<TemplateSourceRow[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isError, setIsError] = useState(false);
  const [appliedSearchQuery, setAppliedSearchQuery] = useState("");
  const { ref: searchInputRef, onOpenChange: handlePickerAfterOpenChange } =
    useFocusOnOpenChange<InputRef>();

  const resetModalState = useCallback(() => {
    setAppliedSearchQuery("");
    setSourceRows([]);
    setIsLoading(false);
    setIsError(false);
  }, []);

  useEffect(() => {
    if (!isOpen) {
      resetModalState();
      return;
    }

    let isCancelled = false;

    const loadSourceRows = async () => {
      setIsError(false);
      setIsLoading(true);

      try {
        const loadedSourceRows = await taskTemplateService.loadTemplateSourceRows();
        if (!isCancelled) {
          setSourceRows(loadedSourceRows);
        }
      } catch (error) {
        if (isCancelled) {
          return;
        }
        if (!isGlobalServerError(error)) {
          messageApi.error(t("task-create.error-loading-templates"));
        }
        setIsError(true);
      } finally {
        if (!isCancelled) {
          setIsLoading(false);
        }
      }
    };

    loadSourceRows();

    return () => {
      isCancelled = true;
    };
  }, [isOpen, messageApi, resetModalState, t]);

  const filteredRows = useMemo(
    () => filterSourceRows(sourceRows, appliedSearchQuery),
    [appliedSearchQuery, sourceRows]
  );

  const hasNoData = !isLoading && !isError && sourceRows.length === 0;
  const hasNoResults = !isLoading && !isError && sourceRows.length > 0 && filteredRows.length === 0;
  const shouldShowTable = !isLoading && !isError && filteredRows.length > 0;

  const renderTemplateTooltip = useCallback(
    (template: TaskTemplateWithRepository) => {
      const description = getTemplateDescriptionText(
        template.description as TemplateDescriptionValue,
        i18n.language
      );

      return (
        <div className={styles.tooltipContent} onWheel={(event) => event.stopPropagation()}>
          <div className={styles.tooltipTitle}>{template.title || template.name}</div>

          {template.name && (
            <div className={styles.tooltipSection}>
              <div className={styles.tooltipSectionTitle}>{t("task-create.tooltip-name")}</div>
              <pre className={styles.tooltipName}>{template.name}</pre>
            </div>
          )}

          {description && (
            <div className={styles.tooltipSection}>
              <div className={styles.tooltipSectionTitle}>
                {t("job-function-select.tooltip-description")}
              </div>
              <div className={styles.tooltipDescription}>{description}</div>
            </div>
          )}
        </div>
      );
    },
    [i18n.language, t]
  );

  const getSourceLabel = useCallback(
    (sourceName: string) => sourceName.trim() || t("task-create.unknown-repository"),
    [t]
  );

  const columns = useMemo<ColumnsType<TemplateSourceRow>>(
    () => [
      {
        title: t("task-create.table-source"),
        dataIndex: "source",
        key: "source",
        width: "35%",
        render: (_, sourceRow) => (
          <div className={styles.repositoryCell}>
            <span className={styles.repositoryTitle}>{getSourceLabel(sourceRow.source)}</span>
          </div>
        ),
      },
      {
        title: t("task-create.table-templates"),
        dataIndex: "templates",
        key: "templates",
        render: (_, sourceRow) => (
          <div className={styles.templatesCell}>
            {sourceRow.templates.length === 0 ? (
              <span className={styles.noTemplates}>{t("task-create.no-templates-in-source")}</span>
            ) : (
              sourceRow.templates.map((template) => (
                <Tooltip
                  key={template.id}
                  title={renderTemplateTooltip(template)}
                  mouseEnterDelay={0.45}
                  classNames={{ root: styles.tooltip }}
                  destroyOnHidden
                >
                  <Button
                    size="small"
                    className={styles.templateButton}
                    onClick={() => onSelectTemplate(template.id)}
                  >
                    {template.title || template.name}
                  </Button>
                </Tooltip>
              ))
            )}
          </div>
        ),
      },
    ],
    [getSourceLabel, onSelectTemplate, renderTemplateTooltip, t]
  );

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
        afterOpenChange={handlePickerAfterOpenChange}
        footer={null}
        maskClosable={false}
        width={900}
        destroyOnHidden
      >
        <Flex vertical gap="middle">
          <SearchInput
            ref={searchInputRef}
            placeholder={t("task-create.search-templates-placeholder")}
            onSearch={setAppliedSearchQuery}
          />

          <div className={styles.modalContent}>
            {isLoading && (
              <div className={styles.spinnerContainer}>
                <Spin />
              </div>
            )}

            {!isLoading && isError && (
              <Alert type="error" message={t("task-create.error-loading-templates")} showIcon />
            )}

            {hasNoData && (
              <Empty
                image={Empty.PRESENTED_IMAGE_SIMPLE}
                description={t("task-create.no-sources-available")}
              />
            )}

            {hasNoResults && (
              <Empty
                image={Empty.PRESENTED_IMAGE_SIMPLE}
                description={t("task-create.no-templates-found")}
              />
            )}

            {shouldShowTable && (
              <Table
                className={styles.templatesTable}
                columns={columns}
                dataSource={filteredRows}
                pagination={false}
                size="small"
              />
            )}
          </div>
        </Flex>
      </Modal>
    </>
  );
}
