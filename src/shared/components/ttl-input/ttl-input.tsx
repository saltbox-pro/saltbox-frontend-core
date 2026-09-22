import { Flex, InputNumber, Select } from "antd";
import type { ClipboardEvent, KeyboardEvent } from "react";
import { useTranslation } from "react-i18next";

import { DEFAULT_JOB_TIMEOUT_SECONDS } from "saltbox-core/shared/constants/job-timeout";
import {
  isTimeoutInputKeyAllowed,
  isTimeoutPasteAllowed,
  type TtlUnit,
} from "saltbox-core/shared/utils/job-modal-utils";

export type TtlInputProps = {
  value: number | null;
  unit: TtlUnit;
  onValueChange: (value: number | null) => void;
  onUnitChange: (unit: TtlUnit) => void;
  disabled?: boolean;
  className?: string;
};

export function TtlInput({
  value,
  unit,
  onValueChange,
  onUnitChange,
  disabled,
  className,
}: TtlInputProps) {
  const { t } = useTranslation();

  const handleKeyDown = (event: KeyboardEvent<HTMLInputElement>) => {
    if (!isTimeoutInputKeyAllowed(event)) {
      event.preventDefault();
    }
  };

  const handlePaste = (event: ClipboardEvent<HTMLInputElement>) => {
    const pasted = event.clipboardData.getData("text") ?? "";
    if (!isTimeoutPasteAllowed(pasted)) {
      event.preventDefault();
    }
  };

  return (
    <Flex gap={8} align="center" wrap>
      <InputNumber
        min={0}
        precision={0}
        value={value ?? undefined}
        onChange={(nextValue) => onValueChange(nextValue ?? null)}
        placeholder={String(DEFAULT_JOB_TIMEOUT_SECONDS)}
        inputMode="numeric"
        pattern="[0-9]*"
        onKeyDown={handleKeyDown}
        onPaste={handlePaste}
        disabled={disabled}
        className={className}
      />
      <Select
        value={unit}
        onChange={(nextUnit) => onUnitChange(nextUnit)}
        options={[
          { label: t("job-modal.timeout-unit-seconds"), value: "seconds" },
          { label: t("job-modal.timeout-unit-minutes"), value: "minutes" },
          { label: t("job-modal.timeout-unit-hours"), value: "hours" },
        ]}
        style={{ width: 100 }}
        disabled={disabled}
      />
    </Flex>
  );
}
