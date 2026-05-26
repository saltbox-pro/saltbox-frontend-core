import { Flex, Form, InputNumber, Select } from "antd";
import type { KeyboardEvent, ClipboardEvent } from "react";
import { useTranslation } from "react-i18next";

import { DEFAULT_JOB_TIMEOUT_SECONDS } from "saltbox-core/shared/constants/job-timeout";
import {
  isTimeoutInputKeyAllowed,
  isTimeoutPasteAllowed,
  type TtlUnit,
} from "saltbox-core/shared/utils/job-modal-utils";

type JobModalTimeoutFieldsProps = {
  ttlValue: number | null;
  ttlUnit: TtlUnit;
  onTtlValueChange: (value: number | null) => void;
  onTtlUnitChange: (unit: TtlUnit) => void;
};

export const JobModalTimeoutFields = ({
  ttlValue,
  ttlUnit,
  onTtlValueChange,
  onTtlUnitChange,
}: JobModalTimeoutFieldsProps) => {
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
    <Form.Item label={t("job-modal.timeout-label")}>
      <Flex gap={8} align="center" wrap>
        <InputNumber
          min={0}
          precision={0}
          value={ttlValue ?? undefined}
          onChange={(value) => onTtlValueChange(value ?? null)}
          placeholder={String(DEFAULT_JOB_TIMEOUT_SECONDS)}
          inputMode="numeric"
          pattern="[0-9]*"
          onKeyDown={handleKeyDown}
          onPaste={handlePaste}
        />
        <Select
          value={ttlUnit}
          onChange={onTtlUnitChange}
          options={[
            { label: t("job-modal.timeout-unit-seconds"), value: "seconds" },
            { label: t("job-modal.timeout-unit-minutes"), value: "minutes" },
            { label: t("job-modal.timeout-unit-hours"), value: "hours" },
          ]}
          style={{ width: 100 }}
        />
      </Flex>
    </Form.Item>
  );
};
