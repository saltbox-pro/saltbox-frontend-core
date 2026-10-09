import { Form, Input, Select } from "antd";
import type { FormListFieldData } from "antd/es/form/FormList";
import { useTranslation } from "react-i18next";

import { getParentPopupContainer } from "saltbox-core/shared/helpers/get-parent-popup-container";

import { useExtraDataCategoryFieldTypeOptions } from "../hooks/use-extra-data-category-field-type-options";

import {
  getExtraDataCategoryFieldNameRules,
  getExtraDataCategoryFieldTypeRules,
} from "./extra-data-category-field-form-rules";
import styles from "./extra-data-category-fields-list.module.css";

type ExtraDataCategoryFieldFormFieldsProps = {
  listFieldName?: FormListFieldData["name"];
  listFieldRest?: Omit<FormListFieldData, "key" | "name">;
  isDuplicateName: (trimmedName: string) => boolean;
};

export function ExtraDataCategoryFieldFormFields({
  listFieldName,
  listFieldRest,
  isDuplicateName,
}: ExtraDataCategoryFieldFormFieldsProps) {
  const { t } = useTranslation();
  const typeOptions = useExtraDataCategoryFieldTypeOptions();
  const namePath = listFieldName === undefined ? "name" : [listFieldName, "name"];
  const typePath = listFieldName === undefined ? "type" : [listFieldName, "type"];

  return (
    <>
      <Form.Item
        {...listFieldRest}
        name={namePath}
        className={styles.nameField}
        rules={getExtraDataCategoryFieldNameRules(t, isDuplicateName)}
      >
        <Input
          autoComplete="extra-data-field-name"
          placeholder={t("extra-data-categories.field-form.field-name-placeholder")}
        />
      </Form.Item>

      <Form.Item
        {...listFieldRest}
        name={typePath}
        className={styles.typeField}
        rules={getExtraDataCategoryFieldTypeRules(t)}
      >
        <Select
          options={typeOptions}
          optionFilterProp="label"
          notFoundContent={t("common.no-data")}
          placeholder={t("extra-data-categories.field-form.field-type-placeholder")}
          getPopupContainer={getParentPopupContainer}
        />
      </Form.Item>
    </>
  );
}
