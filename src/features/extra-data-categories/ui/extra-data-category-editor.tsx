import type { ExtraDataCategoryModel } from "@saltbox/saltbox-core-api-client";
import {
  MutationErrorAlert,
  areLocalizedTextMapsEqual,
  toLocalizedTextFormMap,
} from "@saltbox/saltbox-frontend-common";
import { Flex, Form } from "antd";
import { type RefObject, useCallback, useMemo } from "react";
import { useTranslation } from "react-i18next";

import type { ExtraDataCategoryUpdatePatch } from "saltbox-core/shared/helpers/merge-extra-data-category-update";
import {
  type DrawerCloseGuard,
  useUnsavedChangesCloseGuard,
} from "saltbox-core/shared/hooks/useUnsavedChangesCloseGuard";

import {
  EXTRA_DATA_CATEGORY_DESCRIPTION_NAME,
  EXTRA_DATA_CATEGORY_ICON_NAME,
  EXTRA_DATA_CATEGORY_TITLE_NAME,
} from "../constants/form-field-names";
import {
  type ExtraDataCategoryMetaFormValues,
  areExtraDataCategoryTextValuesEqual,
  toExtraDataCategoryMetaFormValues,
} from "../helpers/extra-data-category-meta-form";
import { useUpdateExtraDataCategoryMeta } from "../hooks/use-update-extra-data-category-meta";

import { ExtraDataCategoryDescriptionFormItem } from "./extra-data-category-description-form-item";
import { ExtraDataCategoryDetails } from "./extra-data-category-details";
import { ExtraDataCategoryEditorActions } from "./extra-data-category-editor-actions";
import { ExtraDataCategoryFieldsList } from "./extra-data-category-fields-list";
import { ExtraDataCategoryFieldsManager } from "./extra-data-category-fields-manager";
import { ExtraDataCategoryIconFormItem } from "./extra-data-category-icon-form-item";
import { ExtraDataCategoryTitleFormItem } from "./extra-data-category-title-form-item";

type ExtraDataCategoryEditorProps = {
  category: ExtraDataCategoryModel;
  readOnly?: boolean;
  closeGuardRef?: RefObject<DrawerCloseGuard | null>;
  onSuccess?: (category: ExtraDataCategoryModel, patch: ExtraDataCategoryUpdatePatch) => void;
};

export function ExtraDataCategoryEditor({
  category,
  readOnly = false,
  closeGuardRef,
  onSuccess,
}: ExtraDataCategoryEditorProps) {
  const { t, i18n } = useTranslation();
  const [form] = Form.useForm<ExtraDataCategoryMetaFormValues>();

  const initialValues = useMemo(
    () =>
      toExtraDataCategoryMetaFormValues({
        title: toLocalizedTextFormMap(category.title, i18n.language),
        description: toLocalizedTextFormMap(category.description, i18n.language),
        icon: category.icon ?? "",
      }),
    [category.description, category.icon, category.title, i18n.language]
  );

  const fillForm = useCallback(
    (nextCategory: ExtraDataCategoryModel) => {
      const invalidFields = form
        .getFieldsError()
        .filter(({ errors }) => errors.length > 0)
        .map(({ name }) => ({ name, errors: [] })) as Parameters<typeof form.setFields>[0];

      form.setFields(invalidFields);
      form.setFieldsValue(
        toExtraDataCategoryMetaFormValues({
          title: toLocalizedTextFormMap(nextCategory.title, i18n.language),
          description: toLocalizedTextFormMap(nextCategory.description, i18n.language),
          icon: nextCategory.icon ?? "",
        })
      );
    },
    [form, i18n.language]
  );

  const handleMetaSaveSuccess = useCallback(
    (updated: ExtraDataCategoryModel) => {
      fillForm(updated);
      onSuccess?.(updated, "meta");
    },
    [fillForm, onSuccess]
  );

  const handleFieldsUpdated = useCallback(
    (updated: ExtraDataCategoryModel) => {
      onSuccess?.(updated, "fields");
    },
    [onSuccess]
  );

  const { saveCategory, isSaving, mutationError, resetMutationError } =
    useUpdateExtraDataCategoryMeta({ category, onSuccess: handleMetaSaveSuccess });
  const discardChanges = useCallback(() => {
    fillForm(category);
    resetMutationError();
  }, [category, fillForm, resetMutationError]);

  const watchedTitle =
    Form.useWatch(EXTRA_DATA_CATEGORY_TITLE_NAME, form) ??
    initialValues[EXTRA_DATA_CATEGORY_TITLE_NAME];
  const watchedDescription =
    Form.useWatch(EXTRA_DATA_CATEGORY_DESCRIPTION_NAME, form) ??
    initialValues[EXTRA_DATA_CATEGORY_DESCRIPTION_NAME];
  const watchedIcon =
    Form.useWatch(EXTRA_DATA_CATEGORY_ICON_NAME, form) ??
    initialValues[EXTRA_DATA_CATEGORY_ICON_NAME];
  const hasChanges =
    !readOnly &&
    (!areLocalizedTextMapsEqual(watchedTitle, initialValues[EXTRA_DATA_CATEGORY_TITLE_NAME]) ||
      !areLocalizedTextMapsEqual(
        watchedDescription,
        initialValues[EXTRA_DATA_CATEGORY_DESCRIPTION_NAME]
      ) ||
      !areExtraDataCategoryTextValuesEqual(
        watchedIcon,
        initialValues[EXTRA_DATA_CATEGORY_ICON_NAME]
      ));

  const modalContextHolder = useUnsavedChangesCloseGuard({
    closeGuardRef,
    hasUnsavedChanges: hasChanges && !isSaving,
    onDiscard: discardChanges,
  });

  if (readOnly) {
    return (
      <Flex vertical gap="large">
        <ExtraDataCategoryDetails category={category} readOnly />
        <ExtraDataCategoryFieldsList fields={category.fields} />
      </Flex>
    );
  }

  return (
    <Flex vertical gap="large">
      {modalContextHolder}

      <Form
        form={form}
        layout="vertical"
        initialValues={initialValues}
        onFinish={saveCategory}
        onValuesChange={resetMutationError}
        autoComplete="off"
      >
        <Flex vertical gap="large">
          <MutationErrorAlert
            error={mutationError}
            fallback={t("extra-data-categories.category-editor.error")}
            onClose={resetMutationError}
          />

          <ExtraDataCategoryDetails
            category={category}
            titleField={
              <ExtraDataCategoryTitleFormItem
                required
                hideLabel
                addonAfter={<ExtraDataCategoryIconFormItem />}
              />
            }
            descriptionField={<ExtraDataCategoryDescriptionFormItem hideLabel />}
            extra={
              <ExtraDataCategoryEditorActions
                hasChanges={hasChanges}
                isSaving={isSaving}
                onReset={discardChanges}
              />
            }
          />
        </Flex>
      </Form>

      <ExtraDataCategoryFieldsManager category={category} onSuccess={handleFieldsUpdated} />
    </Flex>
  );
}
