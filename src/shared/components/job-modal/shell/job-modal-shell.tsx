import type { CreateJobRequestTgtTypeEnum } from "@saltbox/saltbox-core-api-client";
import { useCallback, useEffect, useRef, useState } from "react";

import { JobModal, type JobReturnToPickerSnapshot } from "../configure/job-modal";
import { JobModalFunctionSelect } from "../function-picker/function-select";

export type JobModalTargeting = {
  target: string;
  targetType: CreateJobRequestTgtTypeEnum;
  defaultMaster: string;
  ttlSeconds?: number;
};

export type JobReplayBaseline = {
  fun: string;
  arg?: unknown[];
  kwarg?: Record<string, unknown>;
};

export type { JobReturnToPickerSnapshot };

type JobModalShellProps = {
  pickerOpen: boolean;
  onPickerOpenChange: (open: boolean) => void;
  configureFunction: string | null;
  onConfigureFunctionChange: (functionName: string | null) => void;
  targeting: JobModalTargeting;
  onTargetingChange: (next: JobModalTargeting) => void;
  repeatBaseline?: JobReplayBaseline | null;
  onAfterConfigureClose?: () => void;
};

export const JobModalShell = ({
  pickerOpen,
  onPickerOpenChange,
  configureFunction,
  onConfigureFunctionChange,
  targeting,
  onTargetingChange,
  repeatBaseline,
  onAfterConfigureClose,
}: JobModalShellProps) => {
  const jsonFormByFunRef = useRef<Record<string, unknown>>({});
  const [, setFormCacheRevision] = useState(0);
  const [jobModalFun, setJobModalFun] = useState<string | null>(null);

  useEffect(() => {
    if (!pickerOpen) {
      jsonFormByFunRef.current = {};
      setFormCacheRevision(0);
    }
  }, [pickerOpen]);

  useEffect(() => {
    if (configureFunction) {
      setJobModalFun(configureFunction);
    }
  }, [configureFunction]);

  const funForArgs = configureFunction ?? jobModalFun;

  const resolvedArgKwarg = (() => {
    if (!funForArgs) {
      return { arg: undefined, kwarg: undefined };
    }
    if (Object.prototype.hasOwnProperty.call(jsonFormByFunRef.current, funForArgs)) {
      const data = jsonFormByFunRef.current[funForArgs] as Record<string, unknown>;
      return {
        arg: (data?.args ?? data?.arg) as unknown[] | undefined,
        kwarg: (data?.kwargs ?? data?.kwarg) as Record<string, unknown> | undefined,
      };
    }
    if (repeatBaseline && funForArgs === repeatBaseline.fun) {
      return { arg: repeatBaseline.arg, kwarg: repeatBaseline.kwarg };
    }
    return { arg: undefined, kwarg: undefined };
  })();

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

  const handleJobModalClosed = useCallback(() => {
    setJobModalFun(null);
  }, []);

  const handleJobModalAfterClose = useCallback(() => {
    setJobModalFun(null);
    onConfigureFunctionChange(null);
    onPickerOpenChange(false);
    onAfterConfigureClose?.();
  }, [onAfterConfigureClose, onConfigureFunctionChange, onPickerOpenChange]);

  return (
    <>
      <JobModalFunctionSelect
        open={pickerOpen && !configureFunction}
        pickerSessionOpen={pickerOpen}
        onCancel={() => onPickerOpenChange(false)}
        onSelect={onConfigureFunctionChange}
      />

      {jobModalFun && (
        <JobModal
          key={jobModalFun}
          target={targeting.target}
          targetType={targeting.targetType}
          defaultMaster={targeting.defaultMaster}
          initialTtlSeconds={targeting.ttlSeconds}
          fun={jobModalFun}
          arg={resolvedArgKwarg.arg}
          kwarg={resolvedArgKwarg.kwarg}
          openOnMount
          onAfterClose={handleJobModalAfterClose}
          onReturnToFunctionPicker={handleReturnToFunctionPicker}
          onJobModalClosed={handleJobModalClosed}
        />
      )}
    </>
  );
};
