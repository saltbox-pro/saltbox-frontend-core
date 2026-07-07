import { CreateJobRequestTgtTypeEnum } from "@saltbox/saltbox-core-api-client";
import { useWithAcceptedMastersCheck } from "@saltbox/saltbox-frontend-common";
import type { MessageInstance } from "antd/es/message/interface";
import { useCallback, useState } from "react";
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router";

import { mastersStore } from "saltbox-core/store";

import type { JobModalTargeting } from "../job-modal-shell";

export const createDefaultJobModalTargeting = (): JobModalTargeting => ({
  target: "*",
  targetType: CreateJobRequestTgtTypeEnum.Glob,
  defaultMaster: "",
});

export const useJobModalFlowState = (
  messageApi: MessageInstance,
  initialTargeting?: JobModalTargeting
) => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const withAcceptedMastersCheck = useWithAcceptedMastersCheck(messageApi);
  const [pickerOpen, setPickerOpen] = useState(false);
  const [configureFunction, setConfigureFunction] = useState<string | null>(null);
  const [targeting, setTargeting] = useState(initialTargeting ?? createDefaultJobModalTargeting());

  const openConfigureWithFunction = useCallback(
    (functionName: string, nextTargeting: JobModalTargeting) => {
      withAcceptedMastersCheck({
        warningActionText: t("job-modal.warning-action.create-job"),
        navigate,
        checkHasAcceptedMasters: () => mastersStore.hasAcceptedMasters(),
        onSuccess: () => {
          setTargeting(nextTargeting);
          setConfigureFunction(functionName);
          setPickerOpen(true);
        },
      });
    },
    [navigate, t, withAcceptedMastersCheck]
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
