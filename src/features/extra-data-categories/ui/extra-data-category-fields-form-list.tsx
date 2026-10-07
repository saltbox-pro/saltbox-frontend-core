import { DeleteOutlined, PlusOutlined } from "@ant-design/icons";
import { Button, Flex, Form, Input, Select, Typography } from "antd";
import type { FormListFieldData, FormListOperation } from "antd/es/form/FormList";
import { useCallback, useEffect, useMemo } from "react";
import { useTranslation } from "react-i18next";

import { getParentPopupContainer } from "saltbox-core/shared/helpers/get-parent-popup-container";

import { EXTRA_DATA_CATEGORY_FIELDS_NAME } from "../constants/form-field-names";
import {
  type ExtraDataCategoryFieldFormValue,
  createEmptyExtraDataCategoryField,
  isDuplicateExtraDataCategoryFieldName,
} from "../helpers/extra-data-category-field-form";
import { useExtraDataCategoryFieldTypeOptions } from "../hooks/use-extra-data-category-field-type-options";
import { useExtraDataCategoryFieldsDrag } from "../hooks/use-extra-data-category-fields-drag";

import {
  getExtraDataCategoryFieldNameRules,
  getExtraDataCategoryFieldTypesRules,
} from "./extra-data-category-field-form-rules";
import styles from "./extra-data-category-fields-list.module.css";
import {
  ExtraDataCategoryFieldSortHandle,
  ExtraDataCategoryFieldsRow,
} from "./extra-data-category-fields-shared";

type FormListItemsProps = {
  fields: FormListFieldData[];
  add: FormListOperation["add"];
  remove: FormListOperation["remove"];
  move: FormListOperation["move"];
};

function ExtraDataCategoryFieldsFormListItems({ fields, add, remove, move }: FormListItemsProps) {
  const { t } = useTranslation();
  const form = Form.useFormInstance();
  const typeOptions = useExtraDataCategoryFieldTypeOptions();
  const fieldValues = Form.useWatch<ExtraDataCategoryFieldFormValue[] | undefined>(
    EXTRA_DATA_CATEGORY_FIELDS_NAME,
    form
  );
  const fieldNamesKey = (fieldValues ?? []).map((field) => field?.name ?? "").join("\n");
  const itemIds = useMemo(() => fields.map((field) => String(field.key)), [fields]);
  const canSort = fields.length > 1;

  const handleReorder = useCallback(
    (fromId: string, toId: string) => {
      const fromIndex = fields.findIndex((field) => String(field.key) === fromId);
      const toIndex = fields.findIndex((field) => String(field.key) === toId);
      if (fromIndex < 0 || toIndex < 0 || fromIndex === toIndex) return;
      move(fromIndex, toIndex);
    },
    [fields, move]
  );

  const { draggedFieldName, getDropSide, getHandleDragProps, getItemDropProps } =
    useExtraDataCategoryFieldsDrag({
      fieldNames: itemIds,
      enabled: canSort,
      onReorder: handleReorder,
    });

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

  return (
    <Flex vertical gap="small" className={styles.formList}>
      <div className={styles.header}>
        <Typography.Text strong>{t("extra-data-categories.fields-title")}</Typography.Text>
        <Button
          type="dashed"
          icon={<PlusOutlined />}
          onClick={() => add(createEmptyExtraDataCategoryField())}
        >
          {t("extra-data-categories.add-field")}
        </Button>
      </div>

      <ul className={styles.list}>
        {fields.length === 0 ? (
          <li className={styles.empty}>{t("extra-data-categories.fields-empty")}</li>
        ) : (
          fields.map(({ key, name: fieldName, ...restField }) => {
            const itemId = String(key);
            const dropSide = getDropSide(itemId);

            return (
              <ExtraDataCategoryFieldsRow
                key={key}
                className={styles.rowEditable}
                isDragging={draggedFieldName === itemId}
                dropSide={dropSide}
                dropProps={canSort ? getItemDropProps(itemId) : undefined}
                sortHandle={
                  <ExtraDataCategoryFieldSortHandle
                    disabled={!canSort}
                    dragProps={getHandleDragProps(itemId)}
                  />
                }
              >
                <Form.Item
                  {...restField}
                  name={[fieldName, "name"]}
                  className={styles.nameField}
                  rules={getExtraDataCategoryFieldNameRules(t, (trimmed) => {
                    const listValues = form.getFieldValue(EXTRA_DATA_CATEGORY_FIELDS_NAME) as
                      | ExtraDataCategoryFieldFormValue[]
                      | undefined;
                    return isDuplicateExtraDataCategoryFieldName(listValues, fieldName, trimmed);
                  })}
                >
                  <Input
                    placeholder={t("extra-data-categories.field-form.field-name-placeholder")}
                  />
                </Form.Item>

                <Form.Item
                  {...restField}
                  name={[fieldName, "types"]}
                  className={styles.typesField}
                  rules={getExtraDataCategoryFieldTypesRules(t)}
                >
                  <Select
                    mode="multiple"
                    maxTagCount="responsive"
                    options={typeOptions}
                    optionFilterProp="label"
                    notFoundContent={t("common.no-data")}
                    placeholder={t("extra-data-categories.field-form.field-type-placeholder")}
                    getPopupContainer={getParentPopupContainer}
                  />
                </Form.Item>

                <div className={styles.actions}>
                  <Button
                    type="text"
                    size="small"
                    danger
                    icon={<DeleteOutlined />}
                    onClick={() => remove(fieldName)}
                    title={t("common.delete")}
                    aria-label={t("common.delete")}
                  />
                </div>
              </ExtraDataCategoryFieldsRow>
            );
          })
        )}
      </ul>
    </Flex>
  );
}

export function ExtraDataCategoryFieldsFormList() {
  return (
    <Form.List name={EXTRA_DATA_CATEGORY_FIELDS_NAME}>
      {(fields, { add, remove, move }) => (
        <ExtraDataCategoryFieldsFormListItems
          fields={fields}
          add={add}
          remove={remove}
          move={move}
        />
      )}
    </Form.List>
  );
}
