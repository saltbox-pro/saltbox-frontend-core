import type {
  ArrayFieldTemplateItemType,
  FormContextType,
  RJSFSchema,
  StrictRJSFSchema,
} from "@rjsf/utils";
import { Button, Col, Divider, Flex, Row } from "antd";

import { getToolbarAlign, getToolbarMarginTop } from "../../helpers/array-field-utils";

type ArrayFormContext = { rowGutter?: number; toolbarAlign?: "top" | "middle" | "bottom" };

const BTN_GRP_STYLE = {
  width: "100%",
  justifyContent: "flex-end",
} as const;

const BTN_STYLE = {
  width: "calc(100% / 4)",
} as const;

export type SaltboxArrayFieldItemTemplateProps<
  T = unknown,
  S extends StrictRJSFSchema = RJSFSchema,
  F extends FormContextType = FormContextType,
> = ArrayFieldTemplateItemType<T, S, F> & {
  displayLabel?: boolean;
  hasDescription?: boolean;
  isParentNested?: boolean;
  hasArrayItems?: boolean;
  hasObjectItems?: boolean;
  isLastItem?: boolean;
};

export function SaltboxArrayFieldItemTemplate<
  T = unknown,
  S extends StrictRJSFSchema = RJSFSchema,
  F extends FormContextType = FormContextType,
>({
  children,
  disabled,
  displayLabel,
  hasArrayItems,
  hasCopy,
  hasDescription,
  hasMoveDown,
  hasMoveUp,
  hasObjectItems,
  hasRemove,
  hasToolbar,
  index,
  isLastItem,
  isParentNested,
  onCopyIndexClick,
  onDropIndexClick,
  onReorderClick,
  readonly,
  registry,
  uiSchema,
}: SaltboxArrayFieldItemTemplateProps<T, S, F>) {
  const { templates, formContext } = registry;
  const { CopyButton, MoveDownButton, MoveUpButton, RemoveButton } = templates.ButtonTemplates;

  const { rowGutter = 24, toolbarAlign: toolbarAlignFromContext } = (formContext ??
    {}) as ArrayFormContext;

  const toolbarAlign = getToolbarAlign({
    toolbarAlignFromContext,
    hasArrayItems,
    hasObjectItems,
  });
  const toolbarMarginTop = getToolbarMarginTop({
    displayLabel,
    hasDescription,
    isParentNested,
    hasArrayItems,
    hasObjectItems,
  });
  const isDisabled = disabled || readonly;
  const shouldShowDivider = toolbarAlign !== "middle" && !isLastItem;

  return (
    <>
      <Row align={toolbarAlign} key={`array-item-${index}`} gutter={rowGutter}>
        <Col flex="1">{children}</Col>

        {hasToolbar && (
          <Col flex="192px" style={{ marginTop: toolbarMarginTop }}>
            <Button.Group style={BTN_GRP_STYLE}>
              {(hasMoveUp || hasMoveDown) && (
                <MoveUpButton
                  disabled={isDisabled || !hasMoveUp}
                  onClick={onReorderClick(index, index - 1)}
                  style={BTN_STYLE}
                  uiSchema={uiSchema}
                  registry={registry}
                />
              )}
              {(hasMoveUp || hasMoveDown) && (
                <MoveDownButton
                  disabled={isDisabled || !hasMoveDown}
                  onClick={onReorderClick(index, index + 1)}
                  style={BTN_STYLE}
                  uiSchema={uiSchema}
                  registry={registry}
                />
              )}
              {hasCopy && (
                <CopyButton
                  disabled={isDisabled}
                  onClick={onCopyIndexClick(index)}
                  style={BTN_STYLE}
                  uiSchema={uiSchema}
                  registry={registry}
                />
              )}
              {hasRemove && (
                <RemoveButton
                  disabled={isDisabled}
                  onClick={onDropIndexClick(index)}
                  style={BTN_STYLE}
                  uiSchema={uiSchema}
                  registry={registry}
                />
              )}
            </Button.Group>
          </Col>
        )}
      </Row>

      {shouldShowDivider && <Divider />}
    </>
  );
}
