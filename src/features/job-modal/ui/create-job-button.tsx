import { PlusOutlined } from "@ant-design/icons";
import { AcceptedMastersActionButton } from "@saltbox/saltbox-frontend-common";
import { observer } from "mobx-react-lite";
import { useTranslation } from "react-i18next";
import Parcel from "single-spa-react/parcel";

import { asParcelConfig } from "saltbox-core/shared/utils/as-parcel-config";

import { useCreateJobButton } from "../hooks/use-create-job-button";

import { JobModalShell } from "./job-modal-shell";

type CreateJobButtonProps = {
  fixedMaster?: string;
};

export const CreateJobButton = observer(function CreateJobButton({
  fixedMaster,
}: CreateJobButtonProps) {
  const { t } = useTranslation();
  const {
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
  } = useCreateJobButton(fixedMaster);

  return (
    <>
      {contextHolder}

      <AcceptedMastersActionButton
        type="primary"
        icon={<PlusOutlined />}
        messageApi={messageApi}
        navigate={navigate}
        checkHasAcceptedMasters={checkHasAcceptedMasters}
        warningActionText={t("job-modal.warning-action.create-job")}
        onAction={openFunctionPicker}
      >
        {t("job-modal.create-job")}
      </AcceptedMastersActionButton>

      <JobModalShell
        pickerOpen={pickerOpen}
        onPickerOpenChange={setPickerOpen}
        configureFunction={configureFunction}
        onConfigureFunctionChange={setConfigureFunction}
        targeting={targeting}
        onTargetingChange={setTargeting}
        fixedMaster={fixedMaster}
      />

      {jobModalCreatePlugins?.map((plugin) => (
        <Parcel key={plugin.key} config={asParcelConfig(plugin.parcel)} wrapWith="div" />
      ))}
    </>
  );
});
