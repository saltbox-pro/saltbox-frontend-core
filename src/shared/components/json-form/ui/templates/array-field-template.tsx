import {
  ArrayFieldTemplateProps,
  FormContextType,
  getTemplate,
  getUiOptions,
  GenericObjectType,
  RJSFSchema,
  StrictRJSFSchema,
} from "@rjsf/utils";
import { Col, ConfigProvider, Row } from "antd";
import { useContext, type ComponentType } from "react";

import {
  getHasDisplayLabel,
  getHasDescription,
  hasArrayItems,
  hasObjectItems,
  isNestedArray,
} from "../../helpers/array-field-utils";

import type { SaltboxArrayFieldItemTemplateProps } from "./array-field-item-template";

const DESCRIPTION_COL_STYLE = {
  paddingBottom: "8px",
} as const;

const ADD_BUTTON_STYLE = {
  width: "75%",
} as const;

export function SaltboxArrayFieldTemplate<
  T = unknown,
  S extends StrictRJSFSchema = RJSFSchema,
  F extends FormContextType = FormContextType,
>({
  canAdd,
  className,
  disabled,
  formContext,
  idSchema,
  items,
  onAddClick,
  readonly,
  registry,
  required,
  schema,
  title,
  uiSchema,
}: ArrayFieldTemplateProps<T, S, F>) {
  const uiOptions = getUiOptions<T, S, F>(uiSchema);
  const ArrayFieldDescriptionTemplate = getTemplate<"ArrayFieldDescriptionTemplate", T, S, F>(
    "ArrayFieldDescriptionTemplate",
    registry,
    uiOptions
  );
  const ArrayFieldItemTemplate = getTemplate<"ArrayFieldItemTemplate", T, S, F>(
    "ArrayFieldItemTemplate",
    registry,
    uiOptions
  ) as ComponentType<SaltboxArrayFieldItemTemplateProps<T, S, F>>;
  const ArrayFieldTitleTemplate = getTemplate<"ArrayFieldTitleTemplate", T, S, F>(
    "ArrayFieldTitleTemplate",
    registry,
    uiOptions
  );
  const {
    ButtonTemplates: { AddButton },
  } = registry.templates;
  const { labelAlign = "right", rowGutter = 24 } = formContext as GenericObjectType;
  const { getPrefixCls } = useContext(ConfigProvider.ConfigContext);
  const prefixCls = getPrefixCls("form");
  const labelClsBasic = `${prefixCls}-item-label`;
  const labelColClassName = `${labelClsBasic} ${labelAlign === "left" && `${labelClsBasic}-left`}`;

  const displayLabel = getHasDisplayLabel({
    uiOptionsTitle: uiOptions?.title,
    title,
  });
  const hasDescription = getHasDescription({
    uiOptionsDescription: uiOptions?.description,
    schemaDescription: schema?.description,
  });
  const isParentNested = isNestedArray(idSchema?.$id);
  const itemsAreArrays = hasArrayItems<S>(schema);
  const itemsAreObjects = hasObjectItems<S>(schema);

  return (
    <fieldset className={className} id={idSchema.$id}>
      <Row gutter={rowGutter}>
        {displayLabel && (
          <Col className={labelColClassName} span={24}>
            <ArrayFieldTitleTemplate
              idSchema={idSchema}
              required={required}
              title={uiOptions.title || title}
              schema={schema}
              uiSchema={uiSchema}
              registry={registry}
            />
          </Col>
        )}
        {hasDescription && (
          <Col span={24} style={DESCRIPTION_COL_STYLE}>
            <ArrayFieldDescriptionTemplate
              description={uiOptions.description || schema.description}
              idSchema={idSchema}
              schema={schema}
              uiSchema={uiSchema}
              registry={registry}
            />
          </Col>
        )}
        <Col className="row array-item-list" span={24}>
          {items &&
            items.map(({ key, ...itemProps }, index) => (
              <ArrayFieldItemTemplate
                key={key}
                {...itemProps}
                displayLabel={displayLabel}
                hasDescription={hasDescription}
                isParentNested={isParentNested}
                hasArrayItems={itemsAreArrays}
                hasObjectItems={itemsAreObjects}
                isLastItem={index === items.length - 1}
              />
            ))}
        </Col>

        {canAdd && (
          <Col span={24}>
            <Row gutter={rowGutter}>
              <Col flex="auto" />
              <Col flex="189px">
                <Row justify="end">
                  <AddButton
                    className="array-item-add"
                    disabled={disabled || readonly}
                    onClick={onAddClick}
                    style={ADD_BUTTON_STYLE}
                    uiSchema={uiSchema}
                    registry={registry}
                  />
                </Row>
              </Col>
            </Row>
          </Col>
        )}
      </Row>
    </fieldset>
  );
}
