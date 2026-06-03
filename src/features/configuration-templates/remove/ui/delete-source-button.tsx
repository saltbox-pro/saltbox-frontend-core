import { DeleteOutlined } from "@ant-design/icons";
import { isGlobalServerError } from "@saltbox/saltbox-frontend-common";
import { Button, message } from "antd";
import { observer } from "mobx-react-lite";
import { useCallback, type MouseEvent } from "react";
import { useTranslation } from "react-i18next";

import {
  getSourceActionContext,
  isDeleteInProgress,
} from "../../shared/helpers/source-action-progress";
import type { SourceActionsPort } from "../../shared/types/source-action";
import { useConfirmDeleteSource } from "../hooks/use-confirm-delete-source";

export type DeleteSourceButtonProps = {
  sourceId: string;
  sourceName: string;
  actions: SourceActionsPort;
};

export const DeleteSourceButton = observer(function DeleteSourceButton({
  sourceId,
  sourceName,
  actions,
}: DeleteSourceButtonProps) {
  const { t } = useTranslation();
  const { confirmDeleteSource, modalContextHolder } = useConfirmDeleteSource();

  const deleteLoading = isDeleteInProgress(getSourceActionContext(actions, sourceId));

  const handleDeleteConfirm = useCallback(async () => {
    try {
      await actions.deleteSource(sourceId);
      message.success(
        t("configuration-templates.source.action.delete-success", {
          name: sourceName,
        })
      );
    } catch (error) {
      console.error(error);
      if (isGlobalServerError(error)) return;
      message.error(t("configuration-templates.source.action.delete-error"));
      throw error;
    }
  }, [actions, sourceId, sourceName, t]);

  const handleClick = (event: MouseEvent<HTMLElement>) => {
    event.stopPropagation();
    confirmDeleteSource({ name: sourceName, onOk: handleDeleteConfirm });
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
        {t("common.delete")}
      </Button>
    </>
  );
});
