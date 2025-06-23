import type { ComponentPropsWithoutRef } from "react";
import * as React from "react";
import {
  joinWith,
  useValueSelector,
  VersatileSelectorProps,
} from "react-querybuilder";
import { Flex, Input, Select } from "antd";

/**
 * @group Props
 */
export type AntDValueSelectorProps = VersatileSelectorProps &
  Omit<ComponentPropsWithoutRef<typeof Select>, "onChange" | "defaultValue">;

/**
 * @group Components
 */
export const SaltBoxMinionValueSelector = ({
  className,
  handleOnChange,
  options,
  value,
  title,
  disabled,
  multiple,
  listsAsArrays,
  // Props that should not be in extraProps
  testID: _testID,
  rule: _rule,
  rules: _rules,
  level: _level,
  path: _path,
  context: _context,
  validation: _validation,
  operator: _operator,
  field: _field,
  fieldData: _fieldData,
  schema: _schema,
  ...extraProps
}: AntDValueSelectorProps): React.JSX.Element => {
  const [isCustomValue, setIsCustomValue] = React.useState(false);
  const [customValue, setCustomValue] = React.useState("");

  // Alternate onChange handler that doesn't use arrays even when `multiple` is true
  const { onChange: onChangeNoArrays } = useValueSelector({
    handleOnChange,
    listsAsArrays: false,
    multiple: false,
    value,
  });
  const { onChange: onChangeNormal, val } = useValueSelector({
    handleOnChange,
    // This forces `val` to be an array if `multiple` is true,
    // even if `listsAsArrays` is false
    listsAsArrays: multiple || listsAsArrays,
    multiple,
    value,
  });

  const onChange = React.useCallback(
    (v: string | string[]) => {
      if (multiple && !listsAsArrays && Array.isArray(v)) {
        // `multiple: true` means `v` is probably an array, but we don't want
        // to send an array to `handleOnChange` when `listsAsArrays` is false
        onChangeNoArrays(joinWith(v));
      } else {
        onChangeNormal(v);
      }
    },
    [listsAsArrays, multiple, onChangeNoArrays, onChangeNormal]
  );

  if (className === "rule-fields") {
    return (
      <Flex gap={8}>
        <Select
          {...(multiple ? { mode: "multiple", allowClear: true } : {})}
          title={title}
          className={className}
          popupMatchSelectWidth={false}
          disabled={disabled}
          value={isCustomValue ? "custom" : val}
          onChange={(v) => {
            if (v === "custom") {
              setIsCustomValue(true);
              onChange("grains.");
            } else {
              setIsCustomValue(false);
              onChange(v);
            }
          }}
          optionFilterProp="label"
          options={[
            ...(options || []),
            { label: "Custom grain", value: "custom" },
          ]}
          {...extraProps}
        />
        {isCustomValue && (
          <Input
            value={customValue}
            onChange={(e) => {
              const newValue = e.target.value;
              setCustomValue(newValue);
              onChange(`grains.${newValue}`);
            }}
            disabled={disabled}
            placeholder="Grain name"
          />
        )}
      </Flex>
    );
  }

  return (
    <Select
      {...(multiple ? { mode: "multiple", allowClear: true } : {})}
      title={title}
      className={className}
      popupMatchSelectWidth={false}
      disabled={disabled}
      value={val}
      onChange={onChange}
      optionFilterProp="label"
      options={options}
      {...extraProps}
    />
  );
};
