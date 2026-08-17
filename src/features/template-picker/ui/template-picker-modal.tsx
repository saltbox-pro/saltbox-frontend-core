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
    slsRows,
    functionModuleRows,
    isFunctionAccessibilityLoading,
    hasFunctionAccessibilityError,
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
  const isCustomFunctionAllowed = mode === "command" && onSelectCustomFunction != null;

  const showCreateWithCustomFunction =
    isCustomFunctionAllowed &&
    trimmedSearch.length > 0 &&
    isValidManualSaltFunctionName(trimmedSearch) &&
    !functionNamesLower.has(normalizedSearchLower);

  const showInvalidFormatHint =
    isCustomFunctionAllowed &&
    trimmedSearch.length > 0 &&
    !isValidManualSaltFunctionName(trimmedSearch) &&
    hasNoResults;

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
              mode === "command"
                ? "template-picker.search-placeholder-command"
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

          {showCreateWithCustomFunction && (
            <div className={styles.customFunctionAction}>
              <Button type="primary" onClick={() => onSelectCustomFunction(normalizedSearchLower)}>
                {t("job-function-select.create-with-function", { name: normalizedSearchLower })}
              </Button>
            </div>
          )}

          <TemplatePickerContent
            isLoading={isLoading}
            isError={isError}
            hasNoData={hasNoData}
            hasNoResults={hasNoResults && !showCreateWithCustomFunction && !showInvalidFormatHint}
            isSearchReset={isSearchReset}
            activeKeys={activeKeys}
            slsRows={slsRows}
            functionModuleRows={functionModuleRows}
            isFunctionAccessibilityLoading={isFunctionAccessibilityLoading}
            hasFunctionAccessibilityError={hasFunctionAccessibilityError}
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
