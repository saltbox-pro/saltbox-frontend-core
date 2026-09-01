import { Modal, SearchInput, useFocusOnOpenChange } from "@saltbox/saltbox-frontend-common";
import { Alert, Button, Flex, message, type InputRef } from "antd";
import { useCallback } from "react";
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router";

import { getConfigurationTemplatesListPath } from "saltbox-core/features/configuration-templates/shared/helpers/source-presentation";
import { isValidManualSaltFunctionName } from "saltbox-core/shared/utils/job-modal-utils";

import { useTemplatePicker } from "../hooks/use-template-picker";
import type { PickedTemplate, TemplatePickerMode } from "../type/types";

import { TemplatePickerContent } from "./template-picker-content";
import styles from "./template-picker-modal.module.css";

const CREATE_WITH_FUNCTION_KEY_BY_MODE: Record<TemplatePickerMode, string> = {
  command: "job-function-select.create-with-function",
  task: "task-create.create-with-function",
  policy: "policy-create.create-with-function",
};

export type TemplatePickerModalProps = {
  mode: TemplatePickerMode;
  isOpen: boolean;
  destroyOnHidden?: boolean;
  onClose: () => void;
  onAfterClose?: () => void;
  onLeaveFlow: () => void;
  onSelectTemplate: (template: PickedTemplate) => void;
  onSelectCustomFunction?: (fun: string) => void;
};

export function TemplatePickerModal({
  mode,
  isOpen,
  destroyOnHidden = true,
  onClose,
  onAfterClose,
  onLeaveFlow,
  onSelectTemplate,
  onSelectCustomFunction,
}: TemplatePickerModalProps) {
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
    isSearchReset,
    activeKeys,
    handleCollapseChange,
    filteredRows,
    functionNamesLower,
    searchQuery,
    getSourceLabel,
  } = useTemplatePicker({ isOpen, messageApi });

  const isEmptyState = hasNoData || hasNoResults;

  const handleGoToConfigurationTemplates = useCallback(() => {
    onLeaveFlow();
    navigate(getConfigurationTemplatesListPath());
  }, [navigate, onLeaveFlow]);

  const trimmedSearch = appliedSearchQuery.trim();
  const normalizedSearchLower = trimmedSearch.toLowerCase();
  const isCustomFunctionAllowed = onSelectCustomFunction != null;
  const isCommandMode = mode === "command";
  const hasFunctionNameSearch =
    trimmedSearch.length > 0 && isValidManualSaltFunctionName(trimmedSearch);

  // commands: the action sits right under the search input and replaces the empty state
  const showCommandCustomFunction =
    isCustomFunctionAllowed &&
    isCommandMode &&
    hasFunctionNameSearch &&
    !functionNamesLower.has(normalizedSearchLower);

  const showInvalidFormatHint =
    isCustomFunctionAllowed &&
    isCommandMode &&
    trimmedSearch.length > 0 &&
    !isValidManualSaltFunctionName(trimmedSearch) &&
    hasNoResults;

  const showEmptyStateCustomFunction =
    isCustomFunctionAllowed &&
    !isCommandMode &&
    hasFunctionNameSearch &&
    (hasNoResults || hasNoData);

  const customFunctionButton =
    showCommandCustomFunction || showEmptyStateCustomFunction ? (
      <Button type="primary" onClick={() => onSelectCustomFunction(normalizedSearchLower)}>
        {t(CREATE_WITH_FUNCTION_KEY_BY_MODE[mode], { name: normalizedSearchLower })}
      </Button>
    ) : null;

  return (
    <>
      {contextHolder}
      <Modal
        title={t("template-picker.title")}
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
        destroyOnHidden={destroyOnHidden}
        loading={isLoading}
      >
        <Flex vertical gap="middle">
          <SearchInput
            ref={searchInputRef}
            placeholder={t(
              isCustomFunctionAllowed
                ? "template-picker.search-placeholder-with-function"
                : "template-picker.search-placeholder"
            )}
            defaultValue={appliedSearchQuery}
            onSearch={setAppliedSearchQuery}
          />

          {showInvalidFormatHint && (
            <Alert
              type="info"
              showIcon
              message={t("job-function-select.invalid-function-format")}
            />
          )}

          {showCommandCustomFunction && (
            <div className={styles.customFunctionAction}>{customFunctionButton}</div>
          )}

          <TemplatePickerContent
            isLoading={isLoading}
            isError={isError}
            hasNoData={hasNoData}
            hasNoResults={
              hasNoResults &&
              !(isCommandMode && (showCommandCustomFunction || showInvalidFormatHint))
            }
            customFunctionAction={showEmptyStateCustomFunction ? customFunctionButton : undefined}
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
