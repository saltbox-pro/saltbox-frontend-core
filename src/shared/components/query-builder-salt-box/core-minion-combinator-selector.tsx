import {
  isItemCombinator,
  resolveItemGroupQuery,
  SaltBoxValueSelector,
} from "@saltbox/saltbox-frontend-common";
import type { ComponentProps } from "react";
import type { CombinatorSelectorProps } from "react-querybuilder";

import {
  canSelectItemCombinator,
  getItemGroupFieldConstraint,
} from "saltbox-core/shared/helpers/filter-fields-for-item-group";
import { withDisabledItemCombinators } from "saltbox-core/shared/helpers/item-combinator-selector-options";
import { readMinionSchemaFieldsFromContext } from "saltbox-core/shared/helpers/minion-field-cascader";

type SaltBoxValueSelectorProps = ComponentProps<typeof SaltBoxValueSelector>;

export const CoreMinionCombinatorSelector = (props: CombinatorSelectorProps) => {
  const schemaFields = readMinionSchemaFieldsFromContext(props.context) ?? [];
  const query = resolveItemGroupQuery(props.schema.getQuery(), props.context);
  const insideItem = query && getItemGroupFieldConstraint(query, props.path).active;
  const itemAllowed = !insideItem && canSelectItemCombinator(props.rules ?? [], schemaFields);
  const options = itemAllowed ? props.options : withDisabledItemCombinators(props.options);

  const handleOnChange = (value: string) => {
    if (isItemCombinator(value) && !itemAllowed) {
      return;
    }

    props.handleOnChange(value);
  };

  const selectorProps = {
    options,
    value: props.value,
    handleOnChange,
    className: props.className,
    title: props.title,
    disabled: props.disabled,
    path: props.path,
    level: props.level,
    context: props.context,
    validation: props.validation,
    testID: props.testID,
  } as SaltBoxValueSelectorProps;

  return <SaltBoxValueSelector {...selectorProps} />;
};
