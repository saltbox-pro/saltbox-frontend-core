import { CreateJobRequestTgtTypeEnum } from "@saltbox/saltbox-core-api-client";
import { useCallback, useState } from "react";
import { useTranslation } from "react-i18next";

import type { JobModalTargeting } from "./job-modal-shell";
import { runWithAcceptedMastersCheck } from "./run-with-accepted-masters-check";

export const createDefaultJobModalTargeting = (): JobModalTargeting => ({
  target: "*",
  targetType: CreateJobRequestTgtTypeEnum.Glob,
  defaultMaster: "",
});

export const useJobModalFlowState = (initialTargeting?: JobModalTargeting) => {
  const { t } = useTranslation();
  const [pickerOpen, setPickerOpen] = useState(false);
  const [configureFunction, setConfigureFunction] = useState<string | null>(null);
  const [targeting, setTargeting] = useState(initialTargeting ?? createDefaultJobModalTargeting());

  const openFunctionPicker = useCallback(() => {
    runWithAcceptedMastersCheck(t, () => {
      setPickerOpen(true);
    });
  }, [t]);

  const openConfigureWithFunction = useCallback(
    (functionName: string, nextTargeting: JobModalTargeting) => {
      runWithAcceptedMastersCheck(t, () => {
        setTargeting(nextTargeting);
        setConfigureFunction(functionName);
        setPickerOpen(true);
      });
    },
    [t]
  );

  return {
    pickerOpen,
    setPickerOpen,
    configureFunction,
    setConfigureFunction,
    targeting,
    setTargeting,
    openFunctionPicker,
    openConfigureWithFunction,
  };
};
