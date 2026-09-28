import { DeleteOutlined, PlusOutlined } from "@ant-design/icons";
import { Button, Flex, Form, Input, Select, Typography } from "antd";
import { useEffect, useMemo } from "react";
import { useTranslation } from "react-i18next";

import { EXTRA_DATA_FIELD_TYPE_OPTIONS } from "../constants/field-types";
import { EXTRA_DATA_NAME_PATTERN } from "../constants/name-pattern";
import {
  type ExtraDataCategoryFieldFormValue,
  createEmptyExtraDataCategoryField,
} from "../helpers/extra-data-category-field-form";

import styles from "./extra-data-category-fields-form-list.module.css";

const FIELDS_NAME = "fields";

function isDuplicateFieldName(
  fields: readonly ExtraDataCategoryFieldFormValue[] | undefined,
  index: number,
  value: string
): boolean {
  return (fields ?? []).some(
    (field, fieldIndex) => fieldIndex !== index && field?.name?.trim() === value
  );
}

export function ExtraDataCategoryFieldsFormList() {
  const { t } = useTranslation();
  const form = Form.useFormInstance();
  const fieldValues = Form.useWatch<ExtraDataCategoryFieldFormValue[] | undefined>(
    FIELDS_NAME,
    form
  );

  const fieldNamesKey = (fieldValues ?? []).map((field) => field?.name ?? "").join("\n");

  useEffect(() => {
    const revalidateInvalidFieldNames = async () => {
      const currentFields = (form.getFieldValue(FIELDS_NAME) ??
        []) as ExtraDataCategoryFieldFormValue[];
      const invalidNamePaths = currentFields
        .map((_, index) => [FIELDS_NAME, index, "name"])
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

  return (
    <Form.List name={FIELDS_NAME}>
      {(fields, { add, remove }) => (
        <Flex vertical gap="small" className={styles.root}>
          <Flex align="center" justify="space-between" gap="small" wrap="wrap">
            <Typography.Text strong>{t("extra-data-categories.fields-title")}</Typography.Text>
            <Button
              type="dashed"
              icon={<PlusOutlined />}
              onClick={() => add(createEmptyExtraDataCategoryField())}
            >
              {t("extra-data-categories.add-field")}
            </Button>
          </Flex>

          <Flex vertical className={styles.list}>
            {fields.length === 0 ? (
              <Flex align="center" justify="center" className={`${styles.row} ${styles.empty}`}>
                <Typography.Text type="secondary">
                  {t("extra-data-categories.fields-empty")}
                </Typography.Text>
              </Flex>
            ) : (
              <div className={`${styles.grid} ${styles.columnsHeader}`}>
                <Typography.Text type="secondary">
                  {t("extra-data-categories.field-form.field-name")}
                </Typography.Text>
                <Typography.Text type="secondary">
                  {t("extra-data-categories.field-form.field-types")}
                </Typography.Text>
              </div>
            )}

            {fields.map(({ key, name: fieldName, ...restField }) => (
              <div key={key} className={`${styles.grid} ${styles.row}`}>
                <Form.Item
                  {...restField}
                  name={[fieldName, "name"]}
                  className={styles.item}
                  rules={[
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

                        const listValues = form.getFieldValue(FIELDS_NAME) as
                          | ExtraDataCategoryFieldFormValue[]
                          | undefined;

                        if (isDuplicateFieldName(listValues, fieldName, trimmed)) {
                          throw new Error(t("extra-data-categories.field-form.field-name-unique"));
                        }
                      },
                    },
                  ]}
                >
                  <Input
                    placeholder={t("extra-data-categories.field-form.field-name-placeholder")}
                  />
                </Form.Item>

                <Form.Item
                  {...restField}
                  name={[fieldName, "types"]}
                  className={styles.item}
                  rules={[
                    {
                      required: true,
                      type: "array",
                      min: 1,
                      message: t("extra-data-categories.field-form.field-type-required"),
                    },
                  ]}
                >
                  <Select
                    mode="multiple"
                    maxTagCount="responsive"
                    options={typeOptions}
                    optionFilterProp="label"
                    notFoundContent={t("common.no-data")}
                    placeholder={t("extra-data-categories.field-form.field-type-placeholder")}
                    getPopupContainer={(trigger) => trigger.parentElement ?? document.body}
                  />
                </Form.Item>

                <Button
                  type="text"
                  danger
                  icon={<DeleteOutlined />}
                  onClick={() => remove(fieldName)}
                  aria-label={t("common.delete")}
                />
              </div>
            ))}
          </Flex>
        </Flex>
      )}
    </Form.List>
  );
}
