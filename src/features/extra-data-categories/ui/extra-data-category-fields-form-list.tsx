import { DeleteOutlined, PlusOutlined } from "@ant-design/icons";
import { Button, Flex, Form, Input, Select, Tooltip, Typography } from "antd";
import { type ReactNode, useEffect, useMemo } from "react";
import { useTranslation } from "react-i18next";

import { EXTRA_DATA_FIELD_TYPE_OPTIONS } from "../constants/field-types";
import { EXTRA_DATA_CATEGORY_FIELDS_NAME } from "../constants/fields-name";
import { EXTRA_DATA_NAME_PATTERN } from "../constants/name-pattern";
import {
  type ExtraDataCategoryFieldFormValue,
  createEmptyExtraDataCategoryField,
  isDuplicateExtraDataCategoryFieldName,
} from "../helpers/extra-data-category-field-form";
import { useDeleteExtraDataCategoryFieldConfirm } from "../hooks/use-delete-extra-data-category-field-confirm";

import styles from "./extra-data-category-fields-form-list.module.css";

type ExtraDataCategoryFieldsFormListProps = {
  readOnly?: boolean;
  readOnlyTooltip?: string;
  actions?: ReactNode;
};

export function ExtraDataCategoryFieldsFormList({
  readOnly = false,
  readOnlyTooltip,
  actions,
}: ExtraDataCategoryFieldsFormListProps) {
  const { t } = useTranslation();
  const form = Form.useFormInstance();
  const deleteFieldConfirm = useDeleteExtraDataCategoryFieldConfirm();
  const fieldValues = Form.useWatch<ExtraDataCategoryFieldFormValue[] | undefined>(
    EXTRA_DATA_CATEGORY_FIELDS_NAME,
    form
  );

  const fieldNamesKey = (fieldValues ?? []).map((field) => field?.name ?? "").join("\n");

  useEffect(() => {
    const revalidateInvalidFieldNames = async () => {
      const currentFields = (form.getFieldValue(EXTRA_DATA_CATEGORY_FIELDS_NAME) ??
        []) as ExtraDataCategoryFieldFormValue[];
      const invalidNamePaths = currentFields
        .map((_, index) => [EXTRA_DATA_CATEGORY_FIELDS_NAME, index, "name"])
        .filter((namePath) => form.getFieldError(namePath).length > 0);

      if (invalidNamePaths.length === 0) return;

      try {
        await form.validateFields(invalidNamePaths);
      } catch {
        return;
      }
    };

    revalidateInvalidFieldNames();
  }, [fieldNamesKey, form]);

  const typeOptions = useMemo(
    () =>
      EXTRA_DATA_FIELD_TYPE_OPTIONS.map((type) => ({
        value: type,
        label: t(`extra-data-categories.field-types.${type}`),
      })),
    [t]
  );

  const gridClassName = `${styles.grid} ${readOnly ? styles.gridReadOnly : ""}`;

  const requestRemove = (index: number, remove: () => void) => {
    const field = form.getFieldValue([EXTRA_DATA_CATEGORY_FIELDS_NAME, index]) as
      | ExtraDataCategoryFieldFormValue
      | undefined;

    if (!field?.isSaved) {
      remove();
      return;
    }

    deleteFieldConfirm.openConfirm(field.name.trim(), remove);
  };

  return (
    <>
      <Form.List name={EXTRA_DATA_CATEGORY_FIELDS_NAME}>
        {(fields, { add, remove }) => {
          const addFieldButton = (
            <Button
              type="dashed"
              icon={<PlusOutlined />}
              disabled={readOnly}
              onClick={() => add(createEmptyExtraDataCategoryField())}
            >
              {t("extra-data-categories.add-field")}
            </Button>
          );

          return (
            <Flex vertical gap="small" className={styles.root}>
              <Flex align="center" justify="space-between" gap="small" wrap="wrap">
                <Typography.Text strong>{t("extra-data-categories.fields-title")}</Typography.Text>
                <Flex align="center" gap="small" wrap="wrap">
                  {readOnly && readOnlyTooltip ? (
                    <Tooltip title={readOnlyTooltip}>
                      <span>{addFieldButton}</span>
                    </Tooltip>
                  ) : (
                    addFieldButton
                  )}
                  {actions}
                </Flex>
              </Flex>

              <Flex vertical className={styles.list}>
                {fields.length === 0 ? (
                  <Flex align="center" justify="center" className={`${styles.row} ${styles.empty}`}>
                    <Typography.Text type="secondary">
                      {t("extra-data-categories.fields-empty")}
                    </Typography.Text>
                  </Flex>
                ) : (
                  <div className={`${gridClassName} ${styles.columnsHeader}`}>
                    <Typography.Text type="secondary">
                      {t("extra-data-categories.field-form.field-name")}
                    </Typography.Text>
                    <Typography.Text type="secondary">
                      {t("extra-data-categories.field-form.field-types")}
                    </Typography.Text>
                  </div>
                )}

                {fields.map(({ key, name: fieldName, ...restField }) => (
                  <div key={key} className={`${gridClassName} ${styles.row}`}>
                    <Form.Item
                      {...restField}
                      name={[fieldName, "name"]}
                      className={styles.item}
                      rules={
                        readOnly
                          ? undefined
                          : [
                              {
                                required: true,
                                whitespace: true,
                                message: t("extra-data-categories.field-form.field-name-required"),
                              },
                              {
                                pattern: EXTRA_DATA_NAME_PATTERN,
                                message: t("extra-data-categories.name-forbidden-characters"),
                              },
                              {
                                validator: async (_, value: string | undefined) => {
                                  const trimmed = value?.trim();
                                  if (!trimmed) return;

                                  const listValues = form.getFieldValue(
                                    EXTRA_DATA_CATEGORY_FIELDS_NAME
                                  ) as ExtraDataCategoryFieldFormValue[] | undefined;

                                  if (
                                    isDuplicateExtraDataCategoryFieldName(
                                      listValues,
                                      fieldName,
                                      trimmed
                                    )
                                  ) {
                                    throw new Error(
                                      t("extra-data-categories.field-form.field-name-unique")
                                    );
                                  }
                                },
                              },
                            ]
                      }
                    >
                      <Input
                        readOnly={readOnly}
                        placeholder={t("extra-data-categories.field-form.field-name-placeholder")}
                      />
                    </Form.Item>

                    <Form.Item
                      {...restField}
                      name={[fieldName, "types"]}
                      className={styles.item}
                      rules={
                        readOnly
                          ? undefined
                          : [
                              {
                                required: true,
                                type: "array",
                                min: 1,
                                message: t("extra-data-categories.field-form.field-type-required"),
                              },
                            ]
                      }
                    >
                      <Select
                        mode="multiple"
                        maxTagCount="responsive"
                        options={typeOptions}
                        optionFilterProp="label"
                        notFoundContent={t("common.no-data")}
                        placeholder={t("extra-data-categories.field-form.field-type-placeholder")}
                        open={readOnly ? false : undefined}
                        suffixIcon={readOnly ? null : undefined}
                        removeIcon={readOnly ? null : undefined}
                        className={readOnly ? styles.readOnlyControl : undefined}
                        getPopupContainer={(trigger) => trigger.parentElement ?? document.body}
                      />
                    </Form.Item>

                    {readOnly ? null : (
                      <Button
                        type="text"
                        danger
                        icon={<DeleteOutlined />}
                        onClick={() => requestRemove(fieldName, () => remove(fieldName))}
                        aria-label={t("common.delete")}
                      />
                    )}
                  </div>
                ))}
              </Flex>
            </Flex>
          );
        }}
      </Form.List>

      {deleteFieldConfirm.modalContextHolder}
    </>
  );
}
