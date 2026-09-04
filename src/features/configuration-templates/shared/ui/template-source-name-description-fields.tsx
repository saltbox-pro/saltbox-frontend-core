import { Form, Input, FormRule } from "antd";
import { useTranslation } from "react-i18next";

import {
  TEMPLATE_SOURCE_DESCRIPTION_MAX_LENGTH,
  TEMPLATE_SOURCE_DESCRIPTION_ROWS,
  TEMPLATE_SOURCE_FORM_I18N_PREFIX,
  TEMPLATE_SOURCE_NAME_MAX_LENGTH,
  type TemplateSourceNameDescriptionFormValues,
} from "../constants/template-source-name-description-form";

export function TemplateSourceNameDescriptionFields() {
  const { t } = useTranslation();
  const i18nKeyPrefix = TEMPLATE_SOURCE_FORM_I18N_PREFIX;

  const nameRules: FormRule[] = [
    {
      required: true,
      whitespace: true,
      message: t(`${i18nKeyPrefix}.name-required`),
    },
    {
      max: TEMPLATE_SOURCE_NAME_MAX_LENGTH,
      message: t(`${i18nKeyPrefix}.name-max`, {
        max: TEMPLATE_SOURCE_NAME_MAX_LENGTH,
      }),
    },
  ];

  const descriptionRules: FormRule[] = [
    {
      max: TEMPLATE_SOURCE_DESCRIPTION_MAX_LENGTH,
      message: t(`${i18nKeyPrefix}.description-max`, {
        max: TEMPLATE_SOURCE_DESCRIPTION_MAX_LENGTH,
      }),
    },
  ];

  return (
    <>
      <Form.Item<TemplateSourceNameDescriptionFormValues>
        label={t(`${i18nKeyPrefix}.name`)}
        name="name"
        validateFirst
        rules={nameRules}
      >
        <Input placeholder={t(`${i18nKeyPrefix}.name-placeholder`)} />
      </Form.Item>

      <Form.Item<TemplateSourceNameDescriptionFormValues>
        label={t(`${i18nKeyPrefix}.description`)}
        name="description"
        rules={descriptionRules}
      >
        <Input.TextArea
          rows={TEMPLATE_SOURCE_DESCRIPTION_ROWS}
          placeholder={t(`${i18nKeyPrefix}.description-placeholder`)}
        />
      </Form.Item>
    </>
  );
}
