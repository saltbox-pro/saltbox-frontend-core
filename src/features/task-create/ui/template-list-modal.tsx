import { TaskType } from "@saltbox/saltbox-core-api-client";
import {
  Modal,
  SearchHighlightText,
  SearchInput,
  isGlobalServerError,
  useFocusOnOpenChange,
} from "@saltbox/saltbox-frontend-common";
import {
  Alert,
  Avatar,
  Collapse,
  Empty,
  Flex,
  Spin,
  Typography,
  message,
  type InputRef,
} from "antd";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useTranslation } from "react-i18next";

import { getActiveSearchQuery } from "saltbox-core/features/template-source-search";
import {
  TemplateSourceDescription,
  TemplateSourceTemplatesList,
  TemplateSourceTypeTag,
} from "saltbox-core/features/template-source-ui";
import { INSTANT_COLLAPSE_MOTION } from "saltbox-core/shared/constants/collapse-motion";

import {
  filterSourceRows,
  getSourceRowSearchExpansion,
  type TemplateSourceRow,
} from "../helpers/template-picker-rows";
import { taskTemplateService } from "../service";
import type { SelectedTaskTemplate } from "../type/types";

import styles from "./template-list-modal.module.css";

export type TemplateListModalProps = {
  type: TaskType;
  isOpen: boolean;
  onClose: () => void;
  onSelectTemplate: (template: SelectedTaskTemplate) => void;
};

function SourceCollapseLabel({
  sourceRow,
  searchQuery,
  getSourceLabel,
}: {
  sourceRow: TemplateSourceRow;
  searchQuery?: string;
  getSourceLabel: (sourceName: string) => string;
}) {
  const sourceLabel = getSourceLabel(sourceRow.source);

  return (
    <Flex vertical gap={4} className={styles.sourceLabel}>
      <Flex align="center" gap="small" className={styles.sourceHeader}>
        <Avatar className={styles.sourceAvatar} size="small" shape="square">
          {sourceLabel[0]}
        </Avatar>

        <Typography.Text strong className={styles.sourceName} title={sourceLabel}>
          <SearchHighlightText text={sourceLabel} query={searchQuery} />
        </Typography.Text>

        <TemplateSourceTypeTag sourceType={sourceRow.sourceType} />
      </Flex>

      {!!sourceRow.description && (
        <TemplateSourceDescription description={sourceRow.description} searchQuery={searchQuery} />
      )}
    </Flex>
  );
}

export function TemplateListModal(props: TemplateListModalProps) {
  const { isOpen, onClose, onSelectTemplate } = props;
  const { t, i18n } = useTranslation();
  const [messageApi, contextHolder] = message.useMessage();

  const [sourceRows, setSourceRows] = useState<TemplateSourceRow[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isError, setIsError] = useState(false);
  const [appliedSearchQuery, setAppliedSearchQuery] = useState("");
  const [manualActiveKeys, setManualActiveKeys] = useState<string[] | null>(null);
  const isUserControlledRef = useRef(false);
  const prevHasSearchQueryRef = useRef(false);
  const { ref: searchInputRef, onOpenChange: handlePickerAfterOpenChange } =
    useFocusOnOpenChange<InputRef>();

  const resetModalState = useCallback(() => {
    setAppliedSearchQuery("");
    setSourceRows([]);
    setIsLoading(false);
    setIsError(false);
    setManualActiveKeys(null);
    isUserControlledRef.current = false;
    prevHasSearchQueryRef.current = false;
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
    () => filterSourceRows(sourceRows, appliedSearchQuery, i18n.language),
    [appliedSearchQuery, i18n.language, sourceRows]
  );

  const searchQuery = useMemo(() => getActiveSearchQuery(appliedSearchQuery), [appliedSearchQuery]);
  const hasSearchQuery = searchQuery !== undefined;
  const isSearchReset = !hasSearchQuery && prevHasSearchQueryRef.current;

  const defaultActiveKeys = useMemo(
    () => (filteredRows.length === 1 ? [filteredRows[0].key] : []),
    [filteredRows]
  );

  const searchForcedActiveKeys = useMemo(() => {
    if (!hasSearchQuery) {
      return undefined;
    }

    return filteredRows
      .filter(
        (sourceRow) =>
          getSourceRowSearchExpansion(sourceRow, searchQuery, i18n.language).expandTemplates
      )
      .map((sourceRow) => sourceRow.key);
  }, [filteredRows, hasSearchQuery, i18n.language, searchQuery]);

  const activeKeys = useMemo(() => {
    if (isSearchReset) {
      return defaultActiveKeys;
    }

    if (searchForcedActiveKeys !== undefined && !isUserControlledRef.current) {
      return searchForcedActiveKeys;
    }

    return manualActiveKeys ?? defaultActiveKeys;
  }, [defaultActiveKeys, isSearchReset, manualActiveKeys, searchForcedActiveKeys]);

  useEffect(() => {
    isUserControlledRef.current = false;
    setManualActiveKeys(null);
  }, [appliedSearchQuery]);

  useEffect(() => {
    if (isSearchReset) {
      isUserControlledRef.current = false;
      setManualActiveKeys(null);
    }

    prevHasSearchQueryRef.current = hasSearchQuery;
  }, [hasSearchQuery, isSearchReset]);

  const handleCollapseChange = useCallback((keys: string | string[]) => {
    isUserControlledRef.current = true;
    setManualActiveKeys(Array.isArray(keys) ? keys : keys ? [keys] : []);
  }, []);

  const hasNoData = !isLoading && !isError && sourceRows.length === 0;
  const hasNoResults =
    !isLoading && !isError && hasSearchQuery && sourceRows.length > 0 && filteredRows.length === 0;
  const shouldShowCollapse = !isLoading && !isError && filteredRows.length > 0;

  const getSourceLabel = useCallback(
    (sourceName: string) => sourceName.trim() || t("task-create.unknown-repository"),
    [t]
  );

  const collapseItems = useMemo(
    () =>
      filteredRows.map((sourceRow) => ({
        key: sourceRow.key,
        label: (
          <SourceCollapseLabel
            sourceRow={sourceRow}
            searchQuery={searchQuery}
            getSourceLabel={getSourceLabel}
          />
        ),
        children: (
          <TemplateSourceTemplatesList
            items={sourceRow.templates}
            constrainHeight={false}
            searchQuery={searchQuery}
            onTemplateClick={(template) =>
              onSelectTemplate({ sourceId: template.source_id, templateId: template.id })
            }
          />
        ),
      })),
    [filteredRows, getSourceLabel, onSelectTemplate, searchQuery]
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
                description={t("configuration-templates.search.no-results")}
              />
            )}

            {shouldShowCollapse && (
              <Collapse
                className={styles.sourcesCollapse}
                size="small"
                destroyOnHidden
                activeKey={activeKeys}
                onChange={handleCollapseChange}
                items={collapseItems}
                {...(isSearchReset ? { openMotion: INSTANT_COLLAPSE_MOTION } : {})}
              />
            )}
          </div>
        </Flex>
      </Modal>
    </>
  );
}
