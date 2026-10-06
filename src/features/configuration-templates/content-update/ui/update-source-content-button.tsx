import { CloudDownloadOutlined } from "@ant-design/icons";
import type { TemplateSourcePublicSchema } from "@saltbox/saltbox-core-api-client";
import { AcceptedMastersActionButton } from "@saltbox/saltbox-frontend-common";
import type { MessageInstance } from "antd/es/message/interface";
import { observer } from "mobx-react-lite";
import { useCallback, useState } from "react";
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router";

import { mastersStore } from "saltbox-core/store";

import {
  getSourceActionContext,
  isContentUpdateInProgress,
} from "../../shared/helpers/source-action-progress";
import type { SourceActionsPort } from "../../shared/types/source-action";
import { isContentUpdatableSourceType } from "../helpers/can-update-source-content";

import { UpdateSourceContentModal } from "./update-source-content-modal";

export type UpdateSourceContentButtonProps = {
  source: Pick<TemplateSourcePublicSchema, "id" | "name" | "source_type">;
  actions: SourceActionsPort;
  showUpdate: boolean;
  disabled?: boolean;
  messageApi: MessageInstance;
};

export const UpdateSourceContentButton = observer(function UpdateSourceContentButton({
  source,
  actions,
  showUpdate,
  disabled = false,
  messageApi,
}: UpdateSourceContentButtonProps) {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [isModalOpen, setIsModalOpen] = useState(false);

  const updateInProgress = isContentUpdateInProgress(getSourceActionContext(actions, source.id));

  const handleOpen = useCallback(() => {
    setIsModalOpen(true);
  }, []);

  const handleClose = useCallback(() => {
    setIsModalOpen(false);
  }, []);

  if (!isContentUpdatableSourceType(source.source_type)) return null;
  if (!showUpdate && !isModalOpen) return null;

  return (
    <>
      {showUpdate && (
        <AcceptedMastersActionButton
          size="small"
          icon={<CloudDownloadOutlined />}
          disabled={disabled}
          loading={updateInProgress}
          messageApi={messageApi}
          navigate={navigate}
          checkHasAcceptedMasters={() => mastersStore.hasAcceptedMasters()}
          warningActionText={t("configuration-templates.warning-action.update-source")}
          onAction={handleOpen}
        >
          {t("configuration-templates.source-update.button")}
        </AcceptedMastersActionButton>
      )}

      <UpdateSourceContentModal
        open={isModalOpen}
        source={source}
        sourceType={source.source_type}
        actions={actions}
        onClose={handleClose}
      />
    </>
  );
});
