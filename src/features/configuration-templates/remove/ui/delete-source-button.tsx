import { DeleteOutlined } from "@ant-design/icons";
import type { TemplateSourcePublicSchema } from "@saltbox/saltbox-core-api-client";
import { isGlobalServerError } from "@saltbox/saltbox-frontend-common";
import { Button, message } from "antd";
import { observer } from "mobx-react-lite";
import { useCallback } from "react";
import { useTranslation } from "react-i18next";

import { isBgTaskFailedError } from "saltbox-core/shared/errors/bg-task-failed.error";
import { isBgTaskPollAborted } from "saltbox-core/shared/errors/bg-task-poll-aborted.error";
import { getBgTaskErrorMessage } from "saltbox-core/shared/helpers/get-bg-task-error-message";

import {
  getSourceActionContext,
  isDeleteInProgress,
} from "../../shared/helpers/source-action-progress";
import type { SourceActionsPort } from "../../shared/types/source-action";
import type { SourceOperationProgressSnapshot } from "../../shared/types/source-operation-progress";
import { useConfirmDeleteSource } from "../hooks/use-confirm-delete-source";

export type DeleteSourceButtonProps = {
  source: Pick<TemplateSourcePublicSchema, "id" | "name"> & SourceOperationProgressSnapshot;
  actions: SourceActionsPort;
};

export const DeleteSourceButton = observer(function DeleteSourceButton({
  source,
  actions,
}: DeleteSourceButtonProps) {
  const { t } = useTranslation();
  const { confirmDeleteSource, modalContextHolder } = useConfirmDeleteSource();

  const deleteLoading = isDeleteInProgress({
    ...getSourceActionContext(actions, source.id),
    source,
  });

  const handleDeleteConfirm = useCallback(async () => {
    try {
      const result = await actions.deleteSource(source.id);

      if (result === "not_found") {
        message.warning(
          t("configuration-templates.source.action.delete-not-found", {
            name: source.name,
          })
        );
        return;
      }

      message.success(
        t("configuration-templates.source.action.delete-success", {
          name: source.name,
        })
      );
    } catch (error) {
      if (isGlobalServerError(error) || isBgTaskPollAborted(error)) return;

      if (isBgTaskFailedError(error)) {
        message.error(
          getBgTaskErrorMessage(error, t("configuration-templates.source.action.delete-error"))
        );
        return;
      }

      console.error(error);
      message.error(t("configuration-templates.source.action.delete-error"));
    }
  }, [actions, source.id, source.name, t]);

  const handleClick = () => {
    confirmDeleteSource({ name: source.name, onOk: handleDeleteConfirm });
  };

  return (
    <>
      {modalContextHolder}

      <Button
        type="default"
        danger
        size="small"
        icon={<DeleteOutlined />}
        loading={deleteLoading}
        onClick={handleClick}
      >
        {deleteLoading ? t("configuration-templates.source.status.deleting") : t("common.delete")}
      </Button>
    </>
  );
});
