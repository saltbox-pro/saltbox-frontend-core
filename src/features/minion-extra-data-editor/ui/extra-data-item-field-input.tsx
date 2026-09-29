import type {
  MinionExtraDataCategoryField,
  MinionExtraDataCategoryFieldType,
} from "@saltbox/saltbox-core-api-client";
import { JsonEditorField } from "@saltbox/saltbox-frontend-common";
import { Flex, Form, Input, Select, Typography } from "antd";
import { useMemo } from "react";
import { useTranslation } from "react-i18next";

import {
  getDefaultFieldInputType,
  getFieldInputTypes,
  isEmptyFormFieldValue,
  isJsonFieldType,
  isJsonOfFieldType,
} from "../helpers/extra-data-item-form";

import styles from "./extra-data-item-field-input.module.css";
import { ExtraDataItemValueInput } from "./extra-data-item-value-input";

type ExtraDataItemFieldInputProps = {
  field: MinionExtraDataCategoryField;
};

export function ExtraDataItemFieldInput({ field }: ExtraDataItemFieldInputProps) {
  const { t } = useTranslation();
  const form = Form.useFormInstance();

  const typePath = ["values", field.name, "type"];
  const valuePath = ["values", field.name, "value"];

  const inputTypes = useMemo(() => getFieldInputTypes(field), [field]);
  const selectedType =
    (Form.useWatch(typePath, form) as MinionExtraDataCategoryFieldType | undefined) ??
    getDefaultFieldInputType(inputTypes);

  const typeOptions = useMemo(
    () =>
      inputTypes.map((type) => ({
        value: type,
        label: t(`extra-data-categories.field-types.${type}`),
      })),
    [inputTypes, t]
  );

  if (!selectedType) {
    return (
      <Form.Item label={field.name}>
        <Typography.Text type="secondary">
          {t("minions.extra-data.item-form.unsupported-type")}
        </Typography.Text>
      </Form.Item>
    );
  }

  return (
    <Form.Item label={field.name}>
      <Flex gap="small" align="flex-start">
        <Form.Item name={typePath} noStyle hidden={inputTypes.length < 2}>
          {inputTypes.length < 2 ? (
            <Input />
          ) : (
            <Select
              className={styles.typeSelect}
              options={typeOptions}
              getPopupContainer={(trigger) => trigger.parentElement ?? document.body}
              onChange={() => form.setFieldValue(valuePath, undefined)}
            />
          )}
        </Form.Item>

        {isJsonFieldType(selectedType) ? (
          <div className={styles.value}>
            <Form.Item
              name={valuePath}
              noStyle
              rules={[
                {
                  validator: async (_, value: string | undefined) => {
                    if (value === undefined || isEmptyFormFieldValue(value)) return;
                    if (!isJsonOfFieldType(selectedType, value)) {
                      throw new Error(
                        t(`minions.extra-data.item-form.invalid-json.${selectedType}`)
                      );
                    }
                  },
                },
              ]}
            >
              <JsonEditorField form={form} fieldName={valuePath} height={160} />
            </Form.Item>
          </div>
        ) : (
          <Form.Item name={valuePath} noStyle>
            <ExtraDataItemValueInput type={selectedType} />
          </Form.Item>
        )}
      </Flex>
    </Form.Item>
  );
}
