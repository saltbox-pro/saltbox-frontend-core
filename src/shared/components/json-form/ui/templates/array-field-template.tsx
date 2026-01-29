import {
  type ArrayFieldTemplateProps,
  type FormContextType,
  type GenericObjectType,
  type RJSFSchema,
  type StrictRJSFSchema,
  getTemplate,
  getUiOptions,
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

import type { CustomArrayFieldItemTemplateProps } from "./array-field-item-template";

import styles from "./array-field-template.module.css";

export function CustomArrayFieldTemplate<
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
  ) as ComponentType<CustomArrayFieldItemTemplateProps<T, S, F>>;
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
  const labelColClassName = `${labelClsBasic} ${labelAlign === "left" ? `${labelClsBasic}-left` : ""}`;

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
          <Col span={24} className={styles.fieldDescription}>
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
            items.map(({ key, ...itemProps }) => (
              <ArrayFieldItemTemplate
                key={key}
                {...itemProps}
                isParentNested={isParentNested}
                hasArrayItems={itemsAreArrays}
                hasObjectItems={itemsAreObjects}
              />
            ))}
        </Col>

        {canAdd && (
          <Col span={24}>
            <Row gutter={rowGutter} justify="end">
              <Col flex="120px">
                <AddButton
                  className="array-item-add"
                  disabled={disabled || readonly}
                  onClick={onAddClick}
                  uiSchema={uiSchema}
                  registry={registry}
                />
              </Col>
            </Row>
          </Col>
        )}
      </Row>
    </fieldset>
  );
}
