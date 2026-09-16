import { SyncOutlined } from "@ant-design/icons";
import type { TemplateSourcePublicSchema } from "@saltbox/saltbox-core-api-client";
import { AcceptedMastersActionButton, runMutation } from "@saltbox/saltbox-frontend-common";
import { Tag } from "antd";
import type { MessageInstance } from "antd/es/message/interface";
import { observer } from "mobx-react-lite";
import { useCallback } from "react";
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router";

import { mastersStore } from "saltbox-core/store";

import {
  getSourceActionContext,
  isSyncInProgress,
  isSyncRequestLoading,
} from "../../shared/helpers/source-action-progress";
import type { SourceActionsPort } from "../../shared/types/source-action";

import styles from "./sync-source-button.module.css";

export type SyncSourceButtonProps = {
  source: TemplateSourcePublicSchema;
  actions: SourceActionsPort;
  showSync: boolean;
  disabled?: boolean;
  messageApi: MessageInstance;
};

export const SyncSourceButton = observer(function SyncSourceButton({
  source,
  actions,
  showSync,
  disabled = false,
  messageApi,
}: SyncSourceButtonProps) {
  const { t } = useTranslation();
  const navigate = useNavigate();

  const actionContext = getSourceActionContext(actions, source.id);

  const syncProgress = isSyncInProgress({ source, ...actionContext });
  const syncRequestLoading = isSyncRequestLoading(actionContext);

  const executeSync = useCallback(async () => {
    await runMutation({
      run: () => actions.syncSource(source.id),
      successMessage: t("configuration-templates.source.action.sync-success", {
        name: source.name,
      }),
      errorMessage: t("configuration-templates.source.action.sync-error"),
    });
  }, [actions, source.id, source.name, t]);

  if (!showSync) return null;

  if (syncProgress) {
    return (
      <Tag className={styles.syncingTag} icon={<SyncOutlined spin />}>
        {t("configuration-templates.source.status.syncing")}
      </Tag>
    );
  }

  return (
    <AcceptedMastersActionButton
      size="small"
      icon={<SyncOutlined />}
      disabled={disabled}
      loading={syncRequestLoading}
      messageApi={messageApi}
      navigate={navigate}
      checkHasAcceptedMasters={() => mastersStore.hasAcceptedMasters()}
      warningActionText={t("configuration-templates.warning-action.sync-source")}
      onAction={executeSync}
    >
      {t("common.sync")}
    </AcceptedMastersActionButton>
  );
});
