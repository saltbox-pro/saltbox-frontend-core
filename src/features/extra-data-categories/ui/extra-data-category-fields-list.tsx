import { DeleteOutlined, PlusOutlined } from "@ant-design/icons";
import type {
  MinionExtraDataCategoryField,
  MinionExtraDataCategoryFieldType,
} from "@saltbox/saltbox-core-api-client";
import { Button, Flex, Form, Tag, Typography, theme } from "antd";
import clsx from "clsx";
import { useMemo } from "react";
import { useTranslation } from "react-i18next";

import { useExtraDataCategoryFieldsDrag } from "../hooks/use-extra-data-category-fields-drag";

import { ExtraDataCategoryFieldFormFields } from "./extra-data-category-field-form-fields";
import styles from "./extra-data-category-fields-list.module.css";
import {
  ExtraDataCategoryFieldSortHandle,
  ExtraDataCategoryFieldsRow,
} from "./extra-data-category-fields-shared";

type CreateFieldValues = {
  name: string;
  type: MinionExtraDataCategoryFieldType;
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

function FieldType({ type }: { type: MinionExtraDataCategoryField["type"] }) {
  const { t } = useTranslation();
  const { token } = theme.useToken();

  return (
    <div className={styles.type}>
      <Tag
        bordered={false}
        className={styles.typeTag}
        style={{
          fontSize: token.fontSize,
          background: token.colorFillSecondary,
        }}
      >
        {t(`extra-data-categories.field-types.${type}`, { defaultValue: type })}
      </Tag>
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
  const isDisabled = disabled || loading;

  return (
    <Form
      form={form}
      component={false}
      initialValues={{ name: "" }}
      onFinish={async (values) => {
        const ok = await onCreate(values);
        if (ok) form.resetFields();
      }}
      autoComplete="off"
      disabled={isDisabled}
    >
      <ExtraDataCategoryFieldFormFields isDuplicateName={(trimmed) => existingNames.has(trimmed)} />

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
                <FieldType type={field.type} />

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
