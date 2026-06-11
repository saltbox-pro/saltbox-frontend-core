import { DeleteOutlined } from "@ant-design/icons";
import type { TemplateSourcePublicSchema } from "@saltbox/saltbox-core-api-client";
import { isGlobalServerError } from "@saltbox/saltbox-frontend-common";
import { Button, message } from "antd";
import { observer } from "mobx-react-lite";
import { useCallback, type MouseEvent } from "react";
import { useTranslation } from "react-i18next";

import {
  getSourceActionContext,
  isDeleteInProgress,
} from "../../shared/helpers/source-action-progress";
import type { SourceOperationProgressSnapshot } from "../../shared/types/source-operation-progress";
import type { SourceActionsPort } from "../../shared/types/source-action";
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
      } else {
        message.success(
          t("configuration-templates.source.action.delete-success", {
            name: source.name,
          })
        );
      }
    } catch (error) {
      console.error(error);
      if (isGlobalServerError(error)) return;
      message.error(t("configuration-templates.source.action.delete-error"));
    }
  }, [actions, source.id, source.name, t]);

  const handleClick = (event: MouseEvent<HTMLElement>) => {
    event.stopPropagation();
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
        {t("common.delete")}
      </Button>
    </>
  );
});
