import { TaskType } from "@saltbox/saltbox-core-api-client";
import { Modal, SearchInput, useFocusOnOpenChange } from "@saltbox/saltbox-frontend-common";
import { Flex, message, type InputRef } from "antd";
import { useTranslation } from "react-i18next";

import type { SelectedTaskTemplate } from "../../../type/types";
import { useTemplateListModal } from "../hooks/use-template-list-modal";

import { TemplateListModalContent } from "./template-list-modal-content";

export type TemplateListModalProps = {
  type: TaskType;
  isOpen: boolean;
  onClose: () => void;
  onSelectTemplate: (template: SelectedTaskTemplate) => void;
};

export function TemplateListModal({
  type,
  isOpen,
  onClose,
  onSelectTemplate,
}: TemplateListModalProps) {
  const { t } = useTranslation();
  const [messageApi, contextHolder] = message.useMessage();
  const { ref: searchInputRef, onOpenChange: handlePickerAfterOpenChange } =
    useFocusOnOpenChange<InputRef>();
  const {
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
        footer={null}
        maskClosable={false}
        width={900}
        destroyOnHidden
        loading={isLoading}
      >
        <Flex vertical gap="middle">
          <SearchInput
            ref={searchInputRef}
            placeholder={t("task-create.search-templates-placeholder")}
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
          />
        </Flex>
      </Modal>
    </>
  );
}
