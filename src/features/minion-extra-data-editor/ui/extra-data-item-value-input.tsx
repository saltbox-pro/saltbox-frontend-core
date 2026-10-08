import { MinionExtraDataCategoryFieldType } from "@saltbox/saltbox-core-api-client";
import { DATETIME_FORMAT_FULL } from "@saltbox/saltbox-frontend-common";
import { DatePicker, Input, InputNumber, Select } from "antd";
import type { Dayjs } from "dayjs";
import { useTranslation } from "react-i18next";

import { getParentPopupContainer } from "saltbox-core/shared/helpers/get-parent-popup-container";

import styles from "./extra-data-item-field-input.module.css";

type ExtraDataItemValueInputProps = {
  type: MinionExtraDataCategoryFieldType;
  value?: unknown;
  onChange?: (value: unknown) => void;
};

export function ExtraDataItemValueInput({ type, value, onChange }: ExtraDataItemValueInputProps) {
  const { t } = useTranslation();

  switch (type) {
    case MinionExtraDataCategoryFieldType.Int:
      return (
        <InputNumber
          className={styles.value}
          precision={0}
          value={value as number | undefined}
          onChange={onChange}
        />
      );
    case MinionExtraDataCategoryFieldType.Float:
      return (
        <InputNumber
          className={styles.value}
          value={value as number | undefined}
          onChange={onChange}
        />
      );
    case MinionExtraDataCategoryFieldType.Bool:
      return (
        <Select
          className={styles.value}
          allowClear
          value={value as boolean | undefined}
          onChange={onChange}
          getPopupContainer={getParentPopupContainer}
          options={[
            { value: true, label: t("common.yes") },
            { value: false, label: t("common.no") },
          ]}
        />
      );
    case MinionExtraDataCategoryFieldType.Datetime:
      return (
        <DatePicker
          className={styles.value}
          showTime
          allowClear
          format={DATETIME_FORMAT_FULL}
          value={value as Dayjs | undefined}
          onChange={onChange}
          getPopupContainer={getParentPopupContainer}
        />
      );
    default:
      return (
        <Input
          className={styles.value}
          autoComplete="extra-data-field-value"
          value={value as string | undefined}
          onChange={(event) => onChange?.(event.target.value)}
        />
      );
  }
}
