import type { CreateJobRequestTgtTypeEnum } from "@saltbox/saltbox-core-api-client";
import { useCallback, useEffect, useRef, useState } from "react";

import {
  TemplatePickerModal,
  SLS_TEMPLATE_FUN,
  type PickedTemplate,
} from "saltbox-core/features/template-picker";

import { JobModal, type JobReturnToPickerSnapshot } from "./job-modal";

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

type PickedTemplateBaseline = {
  sourceId: string;
  templateId: string;
  fun: string;
  templateArgs?: unknown[];
};

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
  const jsonFormByKeyRef = useRef<Record<string, unknown>>({});
  const [, setFormCacheRevision] = useState(0);
  const [jobModalFun, setJobModalFun] = useState<string | null>(null);
  const [pickedTemplate, setPickedTemplate] = useState<PickedTemplateBaseline | null>(null);

  useEffect(() => {
    if (!pickerOpen) {
      jsonFormByKeyRef.current = {};
      setFormCacheRevision(0);
      setPickedTemplate(null);
    }
  }, [pickerOpen]);

  useEffect(() => {
    if (configureFunction) {
      setJobModalFun(configureFunction);
    }
  }, [configureFunction]);

  const funForArgs = configureFunction ?? jobModalFun;

  const formCacheKey = pickedTemplate?.templateId ?? funForArgs;
  const cachedFormData =
    formCacheKey && Object.prototype.hasOwnProperty.call(jsonFormByKeyRef.current, formCacheKey)
      ? (jsonFormByKeyRef.current[formCacheKey] as Record<string, unknown>)
      : undefined;

  const resolvedArgKwarg = (() => {
    if (!funForArgs || pickedTemplate) {
      return { arg: undefined, kwarg: undefined };
    }
    if (cachedFormData) {
      return {
        arg: (cachedFormData.args ?? cachedFormData.arg) as unknown[] | undefined,
        kwarg: (cachedFormData.kwargs ?? cachedFormData.kwarg) as
          | Record<string, unknown>
          | undefined,
      };
    }
    if (repeatBaseline && funForArgs === repeatBaseline.fun) {
      return { arg: repeatBaseline.arg, kwarg: repeatBaseline.kwarg };
    }
    return { arg: undefined, kwarg: undefined };
  })();

  const handleSelectTemplate = useCallback(
    (template: PickedTemplate) => {
      const baseline: PickedTemplateBaseline = template.isFunctionTemplate
        ? { sourceId: template.sourceId, templateId: template.templateId, fun: template.fun }
        : {
            sourceId: template.sourceId,
            templateId: template.templateId,
            fun: SLS_TEMPLATE_FUN,
            templateArgs: [template.name],
          };

      setPickedTemplate(baseline);
      onConfigureFunctionChange(baseline.fun);
    },
    [onConfigureFunctionChange]
  );

  const handleSelectCustomFunction = useCallback(
    (functionName: string) => {
      setPickedTemplate(null);
      onConfigureFunctionChange(functionName);
    },
    [onConfigureFunctionChange]
  );

  const handleReturnToFunctionPicker = useCallback(
    (payload: JobReturnToPickerSnapshot) => {
      const cacheKey = pickedTemplate?.templateId ?? configureFunction;
      if (cacheKey) {
        jsonFormByKeyRef.current[cacheKey] = payload.jsonFormData;
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
    [
      configureFunction,
      onConfigureFunctionChange,
      onPickerOpenChange,
      onTargetingChange,
      pickedTemplate,
    ]
  );

  const handleJobModalClosed = useCallback(() => {
    setJobModalFun(null);
  }, []);

  const handleJobModalAfterClose = useCallback(() => {
    setJobModalFun(null);
    setPickedTemplate(null);
    onConfigureFunctionChange(null);
    onPickerOpenChange(false);
    onAfterConfigureClose?.();
  }, [onAfterConfigureClose, onConfigureFunctionChange, onPickerOpenChange]);

  return (
    <>
      {pickerOpen && (
        <TemplatePickerModal
          mode="command"
          isOpen={pickerOpen && !configureFunction}
          destroyOnHidden={false}
          onClose={() => onPickerOpenChange(false)}
          onLeaveFlow={() => onPickerOpenChange(false)}
          onSelectTemplate={handleSelectTemplate}
          onSelectCustomFunction={handleSelectCustomFunction}
        />
      )}

      {jobModalFun && (
        <JobModal
          key={`${jobModalFun}-${pickedTemplate?.templateId ?? ""}`}
          target={targeting.target}
          targetType={targeting.targetType}
          defaultMaster={targeting.defaultMaster}
          initialTtlSeconds={targeting.ttlSeconds}
          fun={jobModalFun}
          sourceId={pickedTemplate?.sourceId}
          templateId={pickedTemplate?.templateId}
          templateArgs={pickedTemplate?.templateArgs}
          initialJsonFormValue={pickedTemplate ? cachedFormData : undefined}
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
