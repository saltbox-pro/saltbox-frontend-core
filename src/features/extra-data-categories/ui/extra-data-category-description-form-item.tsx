import {
  LocalizedLanguageSwitcher,
  LocalizedTextArea,
  renderLocalizedFormLabel,
  useLocalizedLanguage,
} from "@saltbox/saltbox-frontend-common";
import { Form } from "antd";
import { useTranslation } from "react-i18next";

import { EXTRA_DATA_CATEGORY_DESCRIPTION_NAME } from "../constants/form-field-names";

import formItemStyles from "./extra-data-category-form-item.module.css";

type ExtraDataCategoryDescriptionFormItemProps = {
  disabled?: boolean;
  readOnly?: boolean;
  hideLabel?: boolean;
};

export function ExtraDataCategoryDescriptionFormItem({
  disabled = false,
  readOnly = false,
  hideLabel = false,
}: ExtraDataCategoryDescriptionFormItemProps) {
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

  return (
    <Form.Item
      name={EXTRA_DATA_CATEGORY_DESCRIPTION_NAME}
      label={
        hideLabel
          ? undefined
          : renderLocalizedFormLabel(
              t("extra-data-categories.create.field-description"),
              languageSwitcher
            )
      }
      className={hideLabel ? formItemStyles.flush : undefined}
    >
      <LocalizedTextArea
        Form={Form}
        rows={3}
        activeLanguage={activeLanguage}
        onActiveLanguageChange={setActiveLanguage}
        showLanguageSwitcher={hideLabel}
        disabled={disabled}
        readOnly={readOnly}
        placeholder={t("extra-data-categories.create.field-description-placeholder")}
      />
    </Form.Item>
  );
}
