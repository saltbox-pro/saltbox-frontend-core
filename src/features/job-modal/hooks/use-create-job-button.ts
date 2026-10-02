import { message } from "antd";
import { useCallback } from "react";
import { useNavigate } from "react-router";

import { appStore, mastersStore } from "saltbox-core/store";

import { createDefaultJobModalTargeting, useJobModalFlowState } from "./use-job-modal-flow-state";

export const useCreateJobButton = (fixedMaster?: string) => {
  const navigate = useNavigate();
  const [messageApi, contextHolder] = message.useMessage();
  const {
    pickerOpen,
    setPickerOpen,
    configureFunction,
    setConfigureFunction,
    targeting,
    setTargeting,
  } = useJobModalFlowState(messageApi);

  const checkHasAcceptedMasters = useCallback(
    () =>
      fixedMaster ? mastersStore.isMasterAccepted(fixedMaster) : mastersStore.hasAcceptedMasters(),
    [fixedMaster]
  );

  const openFunctionPicker = useCallback(() => {
    setTargeting(createDefaultJobModalTargeting());
    setPickerOpen(true);
  }, [setPickerOpen, setTargeting]);

  const jobModalCreatePlugins = appStore.pluginsStore?.plugins?.["jobs.jobmodal.create"];

  return {
    navigate,
    messageApi,
    contextHolder,
    pickerOpen,
    setPickerOpen,
    configureFunction,
    setConfigureFunction,
    targeting,
    setTargeting,
    checkHasAcceptedMasters,
    openFunctionPicker,
    jobModalCreatePlugins,
  };
};
