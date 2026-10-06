import {
  LocalizedInput,
  LocalizedLanguageSwitcher,
  hasLocalizedText,
  renderLocalizedFormLabel,
  useLocalizedLanguage,
} from "@saltbox/saltbox-frontend-common";
import { Form } from "antd";
import type { ReactNode } from "react";
import { useTranslation } from "react-i18next";

import { EXTRA_DATA_CATEGORY_TITLE_NAME } from "../constants/form-field-names";

import formItemStyles from "./extra-data-category-form-item.module.css";

type ExtraDataCategoryTitleFormItemProps = {
  disabled?: boolean;
  readOnly?: boolean;
  hideLabel?: boolean;
  required?: boolean;
  addonAfter?: ReactNode;
};

export function ExtraDataCategoryTitleFormItem({
  disabled = false,
  readOnly = false,
  hideLabel = false,
  required = false,
  addonAfter,
}: ExtraDataCategoryTitleFormItemProps) {
  const { t } = useTranslation();
  const { languages, activeLanguage, setActiveLanguage } = useLocalizedLanguage();

  const languageSwitcher = (
    <LocalizedLanguageSwitcher
      value={activeLanguage}
      languages={languages}
      disabled={disabled}
      onChange={setActiveLanguage}
    />
  );

  const rules = required
    ? [
        {
          validator: async (_, value: Record<string, string> | undefined) => {
            if (hasLocalizedText(value)) {
              return;
            }
            throw new Error(t("extra-data-categories.create.field-title-required"));
          },
        },
      ]
    : undefined;

  return (
    <Form.Item
      name={EXTRA_DATA_CATEGORY_TITLE_NAME}
      label={
        hideLabel
          ? undefined
          : renderLocalizedFormLabel(
              t("extra-data-categories.create.field-title"),
              languageSwitcher
            )
      }
      required={required}
      className={hideLabel ? formItemStyles.flush : undefined}
      rules={rules}
    >
      <LocalizedInput
        Form={Form}
        activeLanguage={activeLanguage}
        onActiveLanguageChange={setActiveLanguage}
        showLanguageSwitcher={hideLabel}
        disabled={disabled}
        readOnly={readOnly}
        placeholder={t("extra-data-categories.create.field-title-placeholder")}
        addonAfter={addonAfter}
      />
    </Form.Item>
  );
}
