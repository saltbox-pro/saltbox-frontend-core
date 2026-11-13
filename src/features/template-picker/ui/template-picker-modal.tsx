import {
  ErrorZone,
  Modal,
  SearchInput,
  useFocusOnOpenChange,
} from "@saltbox/saltbox-frontend-common";
import { Alert, Button, Flex, Skeleton, type InputRef } from "antd";
import { observer } from "mobx-react-lite";
import { useCallback, useEffect } from "react";
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

export const TemplatePickerModal = observer(function TemplatePickerModal({
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
  const {
    ref: searchInputRef,
    onOpenChange: handlePickerAfterOpenChange,
    focus: focusSearchInput,
  } = useFocusOnOpenChange<InputRef>();
  const {
    appliedSearchQuery,
    setAppliedSearchQuery,
    isLoading,
    sourceRowsLoad,
    hasNoData,
    hasNoResults,
    isSearchReset,
    activeKeys,
    handleCollapseChange,
    filteredRows,
    functionNamesLower,
    searchQuery,
    getSourceLabel,
    getAccessibilityLoad,
  } = useTemplatePicker({ isOpen });

  const isEmptyState = hasNoData || hasNoResults;

  useEffect(() => {
    if (isOpen && !isLoading) {
      focusSearchInput();
    }
  }, [focusSearchInput, isLoading, isOpen]);

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

  const showNoResults = hasNoResults && !showCommandCustomFunction && !showInvalidFormatHint;

  const customFunctionButton =
    showCommandCustomFunction || showEmptyStateCustomFunction ? (
      <Button type="primary" onClick={() => onSelectCustomFunction(normalizedSearchLower)}>
        {t(CREATE_WITH_FUNCTION_KEY_BY_MODE[mode], { name: normalizedSearchLower })}
      </Button>
    ) : null;

  return (
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
    >
      <ErrorZone level="block" loaders={[sourceRowsLoad]}>
        <div className={styles.pickerBody}>
          <Skeleton loading={isLoading} active title={{ width: "100%" }}>
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
                hasNoData={hasNoData}
                hasNoResults={showNoResults}
                customFunctionAction={
                  showEmptyStateCustomFunction ? customFunctionButton : undefined
                }
                isSearchReset={isSearchReset}
                activeKeys={activeKeys}
                filteredRows={filteredRows}
                searchQuery={searchQuery}
                getSourceLabel={getSourceLabel}
                getAccessibilityLoad={getAccessibilityLoad}
                onCollapseChange={handleCollapseChange}
                onSelectTemplate={onSelectTemplate}
                onGoToConfigurationTemplates={handleGoToConfigurationTemplates}
              />
            </Flex>
          </Skeleton>
        </div>
      </ErrorZone>
    </Modal>
  );
});
