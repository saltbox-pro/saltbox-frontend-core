import { DurationInput, DURATION_FIELD_UNITS } from "@saltbox/saltbox-frontend-common";
import { useTranslation } from "react-i18next";

import { type DurationFieldUnit } from "saltbox-core/shared/utils/job-modal-utils";

export type DurationFieldProps = {
  value: number | null;
  unit: DurationFieldUnit;
  onValueChange: (value: number | null) => void;
  onUnitChange: (unit: DurationFieldUnit) => void;
  min?: number;
  defaultSeconds?: number;
  placeholder?: string;
  disabled?: boolean;
  className?: string;
};

export function DurationField({
  value,
  unit,
  onValueChange,
  onUnitChange,
  min,
  defaultSeconds,
  placeholder,
  disabled,
  className,
}: DurationFieldProps) {
  const { t } = useTranslation("common");

  const resolvedPlaceholder =
    placeholder ??
    (defaultSeconds == null ? undefined : `${defaultSeconds} ${t("time-units.seconds")}`);

  return (
    <DurationInput<DurationFieldUnit>
      value={value}
      unit={unit}
      units={DURATION_FIELD_UNITS}
      onValueChange={onValueChange}
      onUnitChange={onUnitChange}
      min={min}
      placeholder={resolvedPlaceholder}
      disabled={disabled}
      className={className}
    />
  );
}
