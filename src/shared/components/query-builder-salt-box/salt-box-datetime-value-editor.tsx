import { useEffect, useState } from "react";
import { ValueEditorProps } from "react-querybuilder";
import dayjs, { Dayjs } from "dayjs";
import { DatePicker } from "antd";
import { DATETIME_FORMAT_FULL } from "@saltbox/saltbox-frontend-common";

export const SaltBoxDateTimeValueEditor = ({
  value,
  handleOnChange,
  title,
  className,
}: ValueEditorProps) => {
  const [internalValue, setInternalValue] = useState<Dayjs>(
    dayjs(value === "" ? undefined : value),
  );

  useEffect(() => {
    handleOnChange(internalValue);
  }, [value]);

  const handleChange = (newInternalValue: Dayjs) => {
    setInternalValue(newInternalValue);
    handleOnChange(newInternalValue);
  };

  return (
    <DatePicker
      defaultValue={internalValue}
      onChange={handleChange}
      showTime={true}
      title={title}
      className={className}
      format={DATETIME_FORMAT_FULL}
      allowClear={false}
      style={{ width: "100%" }}
    />
  );
};
