import {
  type ArrayFieldTemplateItemType,
  type FormContextType,
  type RJSFSchema,
  type StrictRJSFSchema,
  getUiOptions,
} from "@rjsf/utils";
import { Button, Col, Row } from "antd";

import { getToolbarAlign, getToolbarMarginTop } from "../../helpers/array-field-utils";

import styles from "./array-field-item-template.module.css";

type ArrayFormContext = { rowGutter?: number; toolbarAlign?: "top" | "middle" | "bottom" };

export type CustomArrayFieldItemTemplateProps<
  T = unknown,
  S extends StrictRJSFSchema = RJSFSchema,
  F extends FormContextType = FormContextType,
> = ArrayFieldTemplateItemType<T, S, F> & {
  isParentNested?: boolean;
  hasArrayItems?: boolean;
  hasObjectItems?: boolean;
};

export function CustomArrayFieldItemTemplate<
  T = unknown,
  S extends StrictRJSFSchema = RJSFSchema,
  F extends FormContextType = FormContextType,
>({
  children,
  disabled,
  hasArrayItems,
  hasCopy,
  hasMoveDown,
  hasMoveUp,
  hasObjectItems,
  hasRemove,
  hasToolbar,
  index,
  isParentNested,
  onCopyIndexClick,
  onDropIndexClick,
  onReorderClick,
  readonly,
  registry,
  schema,
  uiSchema,
}: CustomArrayFieldItemTemplateProps<T, S, F>) {
  const { templates, formContext, schemaUtils, globalUiOptions } = registry;
  const { CopyButton, MoveDownButton, MoveUpButton, RemoveButton } = templates.ButtonTemplates;

  const { rowGutter = 24, toolbarAlign: toolbarAlignFromContext } = (formContext ??
    {}) as ArrayFormContext;

  const displayLabel = schemaUtils.getDisplayLabel(schema, uiSchema, globalUiOptions);
  const itemUiOptions = getUiOptions<T, S, F>(uiSchema, globalUiOptions);
  const hasItemDescription = !!itemUiOptions?.description || !!schema?.description;

  const toolbarAlign = getToolbarAlign({
    toolbarAlignFromContext,
    displayLabel,
    hasArrayItems,
    hasObjectItems,
  });

  const toolbarMarginTop = getToolbarMarginTop({
    displayLabel,
    hasItemDescription,
    isParentNested,
    hasArrayItems,
    hasObjectItems,
  });
  const isDisabled = disabled || readonly;

  return (
    <Row align={toolbarAlign} key={`array-item-${index}`} gutter={rowGutter}>
      <Col flex="1">{children}</Col>

      {hasToolbar && (
        <Col flex="192px" style={{ marginTop: toolbarMarginTop }}>
          <Button.Group className={styles.buttonGroup}>
            {(hasMoveUp || hasMoveDown) && (
              <MoveUpButton
                disabled={isDisabled || !hasMoveUp}
                onClick={onReorderClick(index, index - 1)}
                uiSchema={uiSchema}
                registry={registry}
              />
            )}
            {(hasMoveUp || hasMoveDown) && (
              <MoveDownButton
                disabled={isDisabled || !hasMoveDown}
                onClick={onReorderClick(index, index + 1)}
                uiSchema={uiSchema}
                registry={registry}
              />
            )}
            {hasCopy && (
              <CopyButton
                disabled={isDisabled}
                onClick={onCopyIndexClick(index)}
                uiSchema={uiSchema}
                registry={registry}
              />
            )}
            {hasRemove && (
              <RemoveButton
                disabled={isDisabled}
                onClick={onDropIndexClick(index)}
                uiSchema={uiSchema}
                registry={registry}
              />
            )}
          </Button.Group>
        </Col>
      )}
    </Row>
  );
}
