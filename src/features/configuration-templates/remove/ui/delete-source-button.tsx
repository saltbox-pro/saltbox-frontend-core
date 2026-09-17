import { DeleteOutlined } from "@ant-design/icons";
import type { TemplateSourcePublicSchema } from "@saltbox/saltbox-core-api-client";
import { notify, runMutation } from "@saltbox/saltbox-frontend-common";
import { Button } from "antd";
import { observer } from "mobx-react-lite";
import { useCallback } from "react";
import { useTranslation } from "react-i18next";

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
    const result = await runMutation({
      run: () => actions.deleteSource(source.id),
      errorMessage: t("configuration-templates.source.action.delete-error"),
    });

    if (!result.ok) return;

    if (result.data === "not_found") {
      notify.warning(
        t("configuration-templates.source.action.delete-not-found", {
          name: source.name,
        })
      );
      return;
    }

    notify.success(
      t("configuration-templates.source.action.delete-success", {
        name: source.name,
      })
    );
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
