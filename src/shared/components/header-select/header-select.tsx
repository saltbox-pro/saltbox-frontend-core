import { Select, type SelectProps } from "antd";
import { type ComponentRef, useRef, useState } from "react";

import styles from "./header-select.module.css";

export interface HeaderSelectProps {
  value: string;
  onChange: (value: string) => void;
  options: { value: string; label: string }[];
  className?: string;
  placeholder?: string;
}

export const HeaderSelect = ({
  value,
  onChange,
  options,
  className,
  placeholder = "Select value",
}: HeaderSelectProps) => {
  const [isHeaderHovered, setIsHeaderHovered] = useState(false);
  const [isFocused, setIsFocused] = useState(false);

  const selectRef = useRef<ComponentRef<typeof Select>>(null);

  const handleSelectChange: SelectProps["onChange"] = (newValue) => {
    if (typeof newValue === "string") {
      onChange(newValue);
    }
  };

  const isExpanded = isHeaderHovered || isFocused;

  return (
    <div
      className={`${styles.headerSelectContainer} ${className || ""}`}
      onMouseEnter={() => setIsHeaderHovered(true)}
      onMouseLeave={() => setIsHeaderHovered(false)}
    >
      <div className={styles.headerSelectWrapper}>
        <Select
          ref={selectRef}
          style={{
            width: "100%",
            fontSize: isExpanded ? "" : "14px",
            fontWeight: isExpanded ? "" : "500",
          }}
          className={isExpanded ? "" : styles.headerSelectStyle}
          showSearch
          placeholder={placeholder}
          optionFilterProp="label"
          onChange={handleSelectChange}
          onSearch={() => {}}
          options={options}
          value={value}
          popupMatchSelectWidth={false}
          listHeight={300}
          allowClear={false}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setIsFocused(false)}
          placement="bottomLeft"
        />
      </div>
    </div>
  );
};
