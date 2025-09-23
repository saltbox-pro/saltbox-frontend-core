import { useEffect, useState } from "react";
import { ValueEditorProps } from "react-querybuilder";
import { Select } from "antd";

export const SaltBoxMultiselectValueEditor = ({
  value,
  handleOnChange,
  title,
  className,
  fieldData,
}: ValueEditorProps) => {
  const [internalValue, setInternalValue] = useState(value);

  useEffect(() => {
    handleOnChange(internalValue);
  }, [value]);

  const handleChange = (newInternalValue: Array<string>) => {
    setInternalValue(newInternalValue.join(","));
    handleOnChange(newInternalValue);
  };

  return (
    <Select
      mode="multiple"
      options={fieldData?.selectOptions as any}
      fieldNames={fieldData?.selectFieldNames}
      defaultValue={value}
      allowClear={true}
      onChange={handleChange}
      className={className}
      title={title}
      style={{ width: "100%" }}
      styles={{
        popup: {
          root: {
            minWidth: 450,
            maxWidth: 550,
          },
        },
      }}
    />
  );
};
