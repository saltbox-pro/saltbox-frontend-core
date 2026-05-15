import { CreateJobRequestTgtTypeEnum } from "@saltbox/saltbox-core-api-client";
import { useCallback, useState } from "react";

import type { JobModalTargeting } from "./job-modal-shell";

export const createDefaultJobModalTargeting = (): JobModalTargeting => ({
  target: "*",
  targetType: CreateJobRequestTgtTypeEnum.Glob,
  defaultMaster: "",
});

export const useJobModalFlowState = (initialTargeting?: JobModalTargeting) => {
  const [pickerOpen, setPickerOpen] = useState(false);
  const [configureFunction, setConfigureFunction] = useState<string | null>(null);
  const [targeting, setTargeting] = useState(initialTargeting ?? createDefaultJobModalTargeting());

  const openFunctionPicker = useCallback(() => {
    setPickerOpen(true);
  }, []);

  const openConfigureWithFunction = useCallback(
    (functionName: string, nextTargeting: JobModalTargeting) => {
      setTargeting(nextTargeting);
      setConfigureFunction(functionName);
      setPickerOpen(false);
    },
    []
  );

  const resetFlow = useCallback(() => {
    setConfigureFunction(null);
    setPickerOpen(false);
  }, []);

  return {
    pickerOpen,
    setPickerOpen,
    configureFunction,
    setConfigureFunction,
    targeting,
    setTargeting,
    openFunctionPicker,
    openConfigureWithFunction,
    resetFlow,
  };
};
