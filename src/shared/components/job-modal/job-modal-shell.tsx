import type { CreateJobRequestTgtTypeEnum } from "@saltbox/saltbox-core-api-client";
import { useCallback, useRef, useState } from "react";

import { JobModal, type JobReturnToPickerSnapshot } from "./job-modal";
import { JobModalFunctionSelect } from "./job-modal-function-select";

export type JobModalTargeting = {
  target: string;
  targetType: CreateJobRequestTgtTypeEnum;
  defaultMaster: string;
  ttlSeconds?: number;
};

export type { JobReturnToPickerSnapshot };

type JobModalShellProps = {
  pickerOpen: boolean;
  onPickerOpenChange: (open: boolean) => void;
  configureFunction: string | null;
  onConfigureFunctionChange: (functionName: string | null) => void;
  targeting: JobModalTargeting;
  onTargetingChange: (next: JobModalTargeting) => void;
  repeatBaselineFun?: string | null;
  repeatBaselineArg?: unknown[];
  repeatBaselineKwarg?: Record<string, unknown>;
  onAfterConfigureClose?: () => void;
};

export const JobModalShell = ({
  pickerOpen,
  onPickerOpenChange,
  configureFunction,
  onConfigureFunctionChange,
  targeting,
  onTargetingChange,
  repeatBaselineFun,
  repeatBaselineArg,
  repeatBaselineKwarg,
  onAfterConfigureClose,
}: JobModalShellProps) => {
  const jsonFormByFunRef = useRef<Record<string, unknown>>({});
  const [, setFormCacheRevision] = useState(0);

  let resolvedArg: unknown[] | undefined;
  let resolvedKwarg: Record<string, unknown> | undefined;
  if (!configureFunction) {
    resolvedArg = undefined;
    resolvedKwarg = undefined;
  } else if (Object.prototype.hasOwnProperty.call(jsonFormByFunRef.current, configureFunction)) {
    const data = jsonFormByFunRef.current[configureFunction] as Record<string, unknown>;
    resolvedArg = (data?.args ?? data?.arg) as unknown[] | undefined;
    resolvedKwarg = (data?.kwargs ?? data?.kwarg) as Record<string, unknown> | undefined;
  } else if (repeatBaselineFun && configureFunction === repeatBaselineFun) {
    resolvedArg = repeatBaselineArg;
    resolvedKwarg = repeatBaselineKwarg;
  } else {
    resolvedArg = undefined;
    resolvedKwarg = undefined;
  }

  const handleReturnToFunctionPicker = useCallback(
    (payload: JobReturnToPickerSnapshot) => {
      if (configureFunction) {
        jsonFormByFunRef.current[configureFunction] = payload.jsonFormData;
        setFormCacheRevision((value) => value + 1);
      }
      onTargetingChange({
        target: payload.tgt,
        targetType: payload.tgt_type,
        defaultMaster: payload.salt_master,
        ttlSeconds: payload.ttlSeconds,
      });
      onConfigureFunctionChange(null);
      onPickerOpenChange(true);
    },
    [configureFunction, onConfigureFunctionChange, onPickerOpenChange, onTargetingChange]
  );

  const handleFunctionSelect = useCallback(
    (functionName: string) => {
      onConfigureFunctionChange(functionName);
      onPickerOpenChange(false);
    },
    [onConfigureFunctionChange, onPickerOpenChange]
  );

  const handleJobModalAfterClose = useCallback(() => {
    onConfigureFunctionChange(null);
    onPickerOpenChange(false);
    onAfterConfigureClose?.();
  }, [onAfterConfigureClose, onConfigureFunctionChange, onPickerOpenChange]);

  return (
    <>
      <JobModalFunctionSelect
        open={pickerOpen}
        onCancel={() => onPickerOpenChange(false)}
        onSelect={handleFunctionSelect}
      />

      {configureFunction && (
        <JobModal
          key={configureFunction}
          target={targeting.target}
          targetType={targeting.targetType}
          defaultMaster={targeting.defaultMaster}
          initialTtlSeconds={targeting.ttlSeconds}
          fun={configureFunction}
          arg={resolvedArg}
          kwarg={resolvedKwarg}
          openOnMount
          onAfterClose={handleJobModalAfterClose}
          onReturnToFunctionPicker={handleReturnToFunctionPicker}
        />
      )}
    </>
  );
};
