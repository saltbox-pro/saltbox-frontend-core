import { TaskType } from "@saltbox/saltbox-core-api-client";
import { Modal, SearchInput, useFocusOnOpenChange } from "@saltbox/saltbox-frontend-common";
import { Button, Flex, message, type InputRef } from "antd";
import { useCallback } from "react";
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router";

import { getConfigurationTemplatesListPath } from "saltbox-core/features/configuration-templates/shared/helpers/source-presentation";

import type { SelectedTaskTemplate } from "../../../type/types";
import { useTemplateListModal } from "../hooks/use-template-list-modal";

import { TemplateListModalContent } from "./template-list-modal-content";

export type TemplateListModalProps = {
  type: TaskType;
  isOpen: boolean;
  onClose: () => void;
  onAfterClose?: () => void;
  onLeaveFlow: () => void;
  onSelectTemplate: (template: SelectedTaskTemplate) => void;
};

export function TemplateListModal({
  type,
  isOpen,
  onClose,
  onAfterClose,
  onLeaveFlow,
  onSelectTemplate,
}: TemplateListModalProps) {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [messageApi, contextHolder] = message.useMessage();
  const { ref: searchInputRef, onOpenChange: handlePickerAfterOpenChange } =
    useFocusOnOpenChange<InputRef>();
  const {
    appliedSearchQuery,
    setAppliedSearchQuery,
    isLoading,
    isError,
    hasNoData,
    hasNoResults,
    shouldShowCollapse,
    isSearchReset,
    activeKeys,
    handleCollapseChange,
    filteredRows,
    searchQuery,
    getSourceLabel,
  } = useTemplateListModal({ isOpen, messageApi });

  const isEmptyState = hasNoData || hasNoResults;

  const handleGoToConfigurationTemplates = useCallback(() => {
    onLeaveFlow();
    navigate(getConfigurationTemplatesListPath());
  }, [navigate, onLeaveFlow]);

  return (
    <>
      {contextHolder}
      <Modal
        title={t(
          type === TaskType.Policy
            ? "policy-create.select-template-title"
            : "task-create.select-template-title"
        )}
        open={isOpen}
        onCancel={onClose}
        afterOpenChange={handlePickerAfterOpenChange}
        afterClose={onAfterClose}
        footer={
          isEmptyState ? null : (
            <Button type="default" onClick={handleGoToConfigurationTemplates}>
              {t("configuration-templates.page-title")}
            </Button>
          )
        }
        maskClosable={false}
        width={900}
        destroyOnHidden
        loading={isLoading}
      >
        <Flex vertical gap="middle">
          <SearchInput
            ref={searchInputRef}
            placeholder={t("task-create.search-templates-placeholder")}
            defaultValue={appliedSearchQuery}
            onSearch={setAppliedSearchQuery}
          />

          <TemplateListModalContent
            isLoading={isLoading}
            isError={isError}
            hasNoData={hasNoData}
            hasNoResults={hasNoResults}
            shouldShowCollapse={shouldShowCollapse}
            isSearchReset={isSearchReset}
            activeKeys={activeKeys}
            filteredRows={filteredRows}
            searchQuery={searchQuery}
            getSourceLabel={getSourceLabel}
            onCollapseChange={handleCollapseChange}
            onSelectTemplate={onSelectTemplate}
            onGoToConfigurationTemplates={handleGoToConfigurationTemplates}
          />
        </Flex>
      </Modal>
    </>
  );
}
