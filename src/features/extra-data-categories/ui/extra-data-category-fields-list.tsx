import { DeleteOutlined, PlusOutlined } from "@ant-design/icons";
import type {
  MinionExtraDataCategoryField,
  MinionExtraDataCategoryFieldType,
} from "@saltbox/saltbox-core-api-client";
import { Button, Flex, Form, Input, Select, Tag, Typography, theme } from "antd";
import clsx from "clsx";
import { useMemo } from "react";
import { useTranslation } from "react-i18next";

import { getParentPopupContainer } from "saltbox-core/shared/helpers/get-parent-popup-container";

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

type CreateFieldValues = {
  name: string;
  types: MinionExtraDataCategoryFieldType[];
};

type ExtraDataCategoryFieldsListProps = {
  fields?: readonly MinionExtraDataCategoryField[];
  sortable?: boolean;
  dragDisabled?: boolean;
  onReorder?: (fromName: string, toName: string) => void;
  onDelete?: (field: MinionExtraDataCategoryField) => void;
  onCreate?: (values: CreateFieldValues) => Promise<boolean> | boolean;
  createLoading?: boolean;
  createDisabled?: boolean;
  deleteDisabled?: boolean;
};

function FieldTypes({ types }: { types: MinionExtraDataCategoryField["types"] }) {
  const { t } = useTranslation();
  const { token } = theme.useToken();

  return (
    <div className={styles.types}>
      {(types ?? []).map((type) => (
        <Tag
          key={type}
          bordered={false}
          className={styles.typeTag}
          style={{
            fontSize: token.fontSize,
            background: token.colorFillSecondary,
          }}
        >
          {t(`extra-data-categories.field-types.${type}`, { defaultValue: type })}
        </Tag>
      ))}
    </div>
  );
}

function CreateFieldRow({
  existingNames,
  loading,
  disabled,
  onCreate,
}: {
  existingNames: ReadonlySet<string>;
  loading?: boolean;
  disabled?: boolean;
  onCreate: (values: CreateFieldValues) => Promise<boolean> | boolean;
}) {
  const { t } = useTranslation();
  const [form] = Form.useForm<CreateFieldValues>();
  const typeOptions = useExtraDataCategoryFieldTypeOptions();
  const isDisabled = disabled || loading;

  return (
    <Form
      form={form}
      component={false}
      initialValues={{ name: "", types: [] }}
      onFinish={async (values) => {
        const ok = await onCreate(values);
        if (ok) form.resetFields();
      }}
      autoComplete="off"
      disabled={isDisabled}
    >
      <Form.Item
        name="name"
        className={styles.nameField}
        rules={getExtraDataCategoryFieldNameRules(t, (trimmed) => existingNames.has(trimmed))}
      >
        <Input placeholder={t("extra-data-categories.field-form.field-name-placeholder")} />
      </Form.Item>

      <Form.Item
        name="types"
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
          type="dashed"
          icon={<PlusOutlined />}
          loading={loading}
          disabled={isDisabled}
          onClick={() => form.submit()}
        >
          {t("extra-data-categories.add-field")}
        </Button>
      </div>
    </Form>
  );
}

export function ExtraDataCategoryFieldsList({
  fields,
  sortable = false,
  dragDisabled = false,
  onReorder,
  onDelete,
  onCreate,
  createLoading = false,
  createDisabled = false,
  deleteDisabled = false,
}: ExtraDataCategoryFieldsListProps) {
  const { t } = useTranslation();
  const list = useMemo(() => [...(fields ?? [])], [fields]);
  const fieldNames = useMemo(() => list.map((field) => field.name), [list]);
  const existingNames = useMemo(() => new Set(fieldNames), [fieldNames]);
  const canSort = sortable && !!onReorder && list.length > 1;
  const sortDisabled = !canSort || dragDisabled;
  const showSortHandle = sortable;

  const { draggedFieldName, getDropSide, getHandleDragProps, getItemDropProps } =
    useExtraDataCategoryFieldsDrag({
      fieldNames,
      enabled: canSort && !dragDisabled,
      onReorder: onReorder ?? (() => undefined),
    });

  return (
    <Flex vertical gap="small">
      <Typography.Text strong>{t("extra-data-categories.fields-title")}</Typography.Text>

      <ul className={styles.list}>
        {list.length === 0 ? (
          <li className={styles.empty}>{t("extra-data-categories.fields-empty")}</li>
        ) : (
          list.map((field) => {
            const dropSide = getDropSide(field.name);

            return (
              <ExtraDataCategoryFieldsRow
                key={field.name}
                className={styles.rowView}
                isDragging={draggedFieldName === field.name}
                dropSide={dropSide}
                dropProps={canSort && !dragDisabled ? getItemDropProps(field.name) : undefined}
                sortHandle={
                  showSortHandle ? (
                    <ExtraDataCategoryFieldSortHandle
                      disabled={sortDisabled}
                      dragProps={getHandleDragProps(field.name)}
                    />
                  ) : null
                }
              >
                <div className={styles.name}>{field.name}</div>
                <FieldTypes types={field.types} />

                <div className={styles.actions}>
                  {onDelete ? (
                    <Button
                      type="text"
                      size="small"
                      danger
                      icon={<DeleteOutlined />}
                      disabled={deleteDisabled}
                      onClick={() => onDelete(field)}
                      title={t("common.delete")}
                      aria-label={t("common.delete")}
                    />
                  ) : null}
                </div>
              </ExtraDataCategoryFieldsRow>
            );
          })
        )}

        {onCreate ? (
          <ExtraDataCategoryFieldsRow className={clsx(styles.rowEditable, styles.rowCreate)}>
            <CreateFieldRow
              existingNames={existingNames}
              loading={createLoading}
              disabled={createDisabled}
              onCreate={onCreate}
            />
          </ExtraDataCategoryFieldsRow>
        ) : null}
      </ul>
    </Flex>
  );
}
