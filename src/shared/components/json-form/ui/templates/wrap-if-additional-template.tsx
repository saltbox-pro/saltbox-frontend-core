import { FocusEvent } from "react";
import { Col, Form, Input, Row } from "antd";
import {
  ADDITIONAL_PROPERTY_FLAG,
  FormContextType,
  RJSFSchema,
  StrictRJSFSchema,
  TranslatableString,
  UI_OPTIONS_KEY,
  getUiOptions,
  type WrapIfAdditionalTemplateProps,
} from "@rjsf/utils";

import styles from "./wrap-if-additional-template.module.css";

export function CustomWrapIfAdditionalTemplate<
  T = unknown,
  S extends StrictRJSFSchema = RJSFSchema,
  F extends FormContextType = FormContextType,
>({
  children,
  classNames,
  style,
  disabled,
  id,
  label,
  onDropPropertyClick,
  onKeyChange,
  readonly,
  required,
  registry,
  schema,
  uiSchema,
}: WrapIfAdditionalTemplateProps<T, S, F>) {
  const {
    colon,
    labelCol = { span: 24 },
    readonlyAsDisabled = true,
    rowGutter = 24,
    toolbarAlign = "top",
    wrapperCol = { span: 24 },
    wrapperStyle,
  } = registry.formContext;

  const { templates, translateString } = registry;
  const { RemoveButton } = templates.ButtonTemplates;

  const keyLabel = translateString(TranslatableString.KeyLabel, [label]);
  const additional = ADDITIONAL_PROPERTY_FLAG in schema;

  if (!additional) {
    return (
      <div className={classNames} style={style}>
        {children}
      </div>
    );
  }

  const handleBlur = ({ target }: FocusEvent<HTMLInputElement>) => onKeyChange(target?.value);

  const uiOptions = getUiOptions<T, S, F>(uiSchema);
  const shouldShowKeyLabel = uiOptions.label !== false;

  const buttonUiOptions = {
    ...uiSchema,
    [UI_OPTIONS_KEY]: { ...(uiSchema?.[UI_OPTIONS_KEY] ?? {}), block: true },
  };

  return (
    <div className={classNames} style={style}>
      <Row align={toolbarAlign} gutter={rowGutter}>
        <Col className="form-additional" flex="1">
          <div className="form-group">
            <Form.Item
              colon={colon}
              className="form-group"
              hasFeedback
              htmlFor={`${id}-key`}
              label={shouldShowKeyLabel ? keyLabel : undefined}
              labelCol={labelCol}
              required={required}
              style={wrapperStyle}
              wrapperCol={wrapperCol}
            >
              <Input
                className={`form-control ${styles.formControl}`}
                defaultValue={label}
                disabled={disabled || (readonlyAsDisabled && readonly)}
                id={`${id}-key`}
                name={`${id}-key`}
                onBlur={!readonly ? handleBlur : undefined}
                type="text"
              />
            </Form.Item>
          </div>
        </Col>
        <Col className="form-additional" flex="1">
          {children}
        </Col>
        <Col flex="192px">
          <RemoveButton
            className="array-item-remove"
            disabled={disabled || readonly}
            onClick={onDropPropertyClick(label)}
            uiSchema={buttonUiOptions}
            registry={registry}
          />
        </Col>
      </Row>
    </div>
  );
}
