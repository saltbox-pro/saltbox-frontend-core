import { CreateJobRequestTgtTypeEnum } from "@saltbox/saltbox-core-api-client";
import { useCallback, useState } from "react";
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router";

import type { JobModalTargeting } from "../job-modal-shell";
import { runWithAcceptedMastersCheck } from "../run-with-accepted-masters-check";

export const createDefaultJobModalTargeting = (): JobModalTargeting => ({
  target: "*",
  targetType: CreateJobRequestTgtTypeEnum.Glob,
  defaultMaster: "",
});

export const useJobModalFlowState = (initialTargeting?: JobModalTargeting) => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [pickerOpen, setPickerOpen] = useState(false);
  const [configureFunction, setConfigureFunction] = useState<string | null>(null);
  const [targeting, setTargeting] = useState(initialTargeting ?? createDefaultJobModalTargeting());

  const openConfigureWithFunction = useCallback(
    (functionName: string, nextTargeting: JobModalTargeting) => {
      runWithAcceptedMastersCheck({
        t,
        warningActionText: t("job-modal.warning-action.create-job"),
        onMastersClick: () => navigate("/core/masters"),
        onSuccess: () => {
          setTargeting(nextTargeting);
          setConfigureFunction(functionName);
          setPickerOpen(true);
        },
      });
    },
    [navigate, t]
  );

  return {
    pickerOpen,
    setPickerOpen,
    configureFunction,
    setConfigureFunction,
    targeting,
    setTargeting,
    openConfigureWithFunction,
  };
};
