import { useCallback, useMemo, useRef, useState } from "react";

import { type DurationFieldUnit } from "saltbox-core/shared/utils/job-modal-utils";

import type { TaskDurationParts } from "../type/types";

export function useDurationParts() {
  const [value, setValue] = useState<number | null>(null);
  const [unit, setUnit] = useState<DurationFieldUnit>("seconds");
  const partsRef = useRef({ value, unit });
  partsRef.current = { value, unit };

  const syncFrom = useCallback((parts: TaskDurationParts | undefined) => {
    if (parts == null) {
      setValue(null);
      setUnit("seconds");
      return;
    }

    const currentParts = partsRef.current;
    if (currentParts.value === parts.value && currentParts.unit === parts.unit) {
      return;
    }

    setValue(parts.value);
    setUnit(parts.unit);
  }, []);

  const parts = useMemo<TaskDurationParts>(() => ({ value, unit }), [value, unit]);

  return {
    value,
    unit,
    setValue,
    setUnit,
    syncFrom,
    parts,
  };
}
