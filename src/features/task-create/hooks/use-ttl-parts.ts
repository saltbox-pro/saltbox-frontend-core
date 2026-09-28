import { useCallback, useRef, useState } from "react";

import { ttlPartsToTotalSeconds, type TtlUnit } from "saltbox-core/shared/utils/job-modal-utils";

const TTL_UNIT_SECONDS: Record<TtlUnit, number> = { seconds: 1, minutes: 60, hours: 3600 };

const totalSecondsToUnit = (
  totalSeconds: number,
  unit: TtlUnit
): { value: number; unit: TtlUnit } => {
  const divisor = TTL_UNIT_SECONDS[unit];
  return totalSeconds % divisor === 0
    ? { value: totalSeconds / divisor, unit }
    : { value: totalSeconds, unit: "seconds" };
};

export function useTtlParts() {
  const [value, setValue] = useState<number | null>(null);
  const [unit, setUnit] = useState<TtlUnit>("seconds");
  const partsRef = useRef({ value, unit });
  partsRef.current = { value, unit };

  const syncFrom = useCallback(
    (initialSeconds: number | undefined, initialUnit: TtlUnit | undefined) => {
      if (initialSeconds == null || !Number.isFinite(initialSeconds) || initialSeconds < 0) {
        setValue(null);
        setUnit("seconds");
        return;
      }

      const currentParts = partsRef.current;
      if (ttlPartsToTotalSeconds(currentParts.value, currentParts.unit) === initialSeconds) {
        return;
      }

      const ttlParts = totalSecondsToUnit(initialSeconds, initialUnit ?? "seconds");
      setValue(ttlParts.value);
      setUnit(ttlParts.unit);
    },
    []
  );

  return {
    value,
    unit,
    setValue,
    setUnit,
    syncFrom,
    totalSeconds: ttlPartsToTotalSeconds(value, unit),
  };
}
