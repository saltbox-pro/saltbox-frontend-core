import { Form, Input, FormRule } from "antd";
import { useTranslation } from "react-i18next";

import {
  TEMPLATE_SOURCE_DESCRIPTION_MAX_LENGTH,
  TEMPLATE_SOURCE_FORM_I18N_PREFIX,
  TEMPLATE_SOURCE_NAME_MAX_LENGTH,
  TEMPLATE_SOURCE_NAMESPACE_MAX_LENGTH,
  TEMPLATE_SOURCE_NAMESPACE_PATTERN,
} from "../constants/template-source-form";

type NameDescriptionFormValues = {
  name: string;
  description?: string;
  namespace?: string;
};

type TemplateSourceNameDescriptionFieldsProps = {
  i18nKeyPrefix: string;
  descriptionRows?: number;
};

export function TemplateSourceNameDescriptionFields({
  i18nKeyPrefix,
  descriptionRows = 2,
}: TemplateSourceNameDescriptionFieldsProps) {
  const { t } = useTranslation();

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

  const namespaceRules: FormRule[] = [
    {
      max: TEMPLATE_SOURCE_NAMESPACE_MAX_LENGTH,
      message: t(`${TEMPLATE_SOURCE_FORM_I18N_PREFIX}.namespace-max`, {
        max: TEMPLATE_SOURCE_NAMESPACE_MAX_LENGTH,
      }),
    },
    {
      pattern: TEMPLATE_SOURCE_NAMESPACE_PATTERN,
      message: t(`${TEMPLATE_SOURCE_FORM_I18N_PREFIX}.namespace-invalid`),
    },
  ];

  return (
    <>
      <Form.Item<NameDescriptionFormValues>
        label={t(`${i18nKeyPrefix}.name`)}
        name="name"
        rules={nameRules}
      >
        <Input placeholder={t(`${i18nKeyPrefix}.name-placeholder`)} />
      </Form.Item>

      <Form.Item<NameDescriptionFormValues>
        label={t(`${i18nKeyPrefix}.description`)}
        name="description"
        rules={descriptionRules}
      >
        <Input.TextArea
          rows={descriptionRows}
          placeholder={t(`${i18nKeyPrefix}.description-placeholder`)}
        />
      </Form.Item>

      <Form.Item<NameDescriptionFormValues>
        label={t(`${TEMPLATE_SOURCE_FORM_I18N_PREFIX}.namespace`)}
        name="namespace"
        rules={namespaceRules}
        tooltip={t(`${TEMPLATE_SOURCE_FORM_I18N_PREFIX}.namespace-tooltip`)}
      >
        <Input placeholder={t(`${TEMPLATE_SOURCE_FORM_I18N_PREFIX}.namespace-placeholder`)} />
      </Form.Item>
    </>
  );
}
