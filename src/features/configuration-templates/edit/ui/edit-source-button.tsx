import { EditOutlined } from "@ant-design/icons";
import type { TemplateSourcePublicSchema } from "@saltbox/saltbox-core-api-client";
import { Button, message } from "antd";
import { observer } from "mobx-react-lite";
import { useCallback, useState } from "react";
import { useTranslation } from "react-i18next";

import {
  getSourceActionContext,
  isDeleteInProgress,
  isUpdateInProgress,
} from "../../shared/helpers/source-action-progress";
import type { SourceActionsPort } from "../../shared/types/source-action";
import type { SourceOperationProgressSnapshot } from "../../shared/types/source-operation-progress";

import { EditSourceModal } from "./edit-source-modal";

export type EditSourceButtonProps = {
  source: Pick<TemplateSourcePublicSchema, "id" | "name" | "description"> &
    SourceOperationProgressSnapshot;
  actions: SourceActionsPort;
  disabled?: boolean;
};

export const EditSourceButton = observer(function EditSourceButton({
  source,
  actions,
  disabled = false,
}: EditSourceButtonProps) {
  const { t } = useTranslation();
  const [messageApi, contextHolder] = message.useMessage();
  const [isModalOpen, setIsModalOpen] = useState(false);

  const actionContext = getSourceActionContext(actions, source.id);
  const deleteInProgress = isDeleteInProgress({ ...actionContext, source });
  const updateInProgress = isUpdateInProgress(actionContext);

  const handleOpen = useCallback(() => {
    setIsModalOpen(true);
  }, []);

  const handleClose = useCallback(() => {
    setIsModalOpen(false);
  }, []);

  const handleSuccess = useCallback(
    (name: string) => {
      messageApi.success(t("configuration-templates.source.action.update-success", { name }));
    },
    [messageApi, t]
  );

  return (
    <>
      {contextHolder}

      <Button
        type="default"
        size="small"
        icon={<EditOutlined />}
        disabled={disabled || deleteInProgress || updateInProgress}
        loading={updateInProgress}
        onClick={handleOpen}
      >
        {t("common.edit")}
      </Button>

      <EditSourceModal
        open={isModalOpen}
        source={source}
        actions={actions}
        onClose={handleClose}
        onSuccess={handleSuccess}
      />
    </>
  );
});
