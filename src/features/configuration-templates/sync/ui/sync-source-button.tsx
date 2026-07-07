import { SyncOutlined } from "@ant-design/icons";
import type { TemplateSourcePublicSchema } from "@saltbox/saltbox-core-api-client";
import { isGlobalServerError } from "@saltbox/saltbox-frontend-common";
import { Tag, message } from "antd";
import { observer } from "mobx-react-lite";
import { useCallback } from "react";
import { useTranslation } from "react-i18next";

import { AcceptedMastersActionButton } from "saltbox-core/shared/components/accepted-masters";
import { isBgTaskFailedError } from "saltbox-core/shared/errors/bg-task-failed.error";
import { isBgTaskPollAborted } from "saltbox-core/shared/errors/bg-task-poll-aborted.error";

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
};

export const SyncSourceButton = observer(function SyncSourceButton({
  source,
  actions,
  showSync,
  disabled = false,
}: SyncSourceButtonProps) {
  const { t } = useTranslation();

  const actionContext = getSourceActionContext(actions, source.id);

  const syncProgress = isSyncInProgress({ source, ...actionContext });
  const syncRequestLoading = isSyncRequestLoading(actionContext);

  const executeSync = useCallback(async () => {
    try {
      await actions.syncSource(source.id);
      message.success(
        t("configuration-templates.source.action.sync-success", {
          name: source.name,
        })
      );
    } catch (error) {
      if (isGlobalServerError(error) || isBgTaskPollAborted(error)) return;

      if (isBgTaskFailedError(error)) {
        message.error(t("configuration-templates.source.action.sync-error"));
        return;
      }

      console.error(error);
      message.error(t("configuration-templates.source.action.sync-error"));
    }
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
      warningActionText={t("configuration-templates.warning-action.sync-source")}
      onAction={executeSync}
    >
      {t("common.sync")}
    </AcceptedMastersActionButton>
  );
});
