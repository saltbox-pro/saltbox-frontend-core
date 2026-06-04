import { SyncOutlined } from "@ant-design/icons";
import type { TemplateSourcePublicSchema } from "@saltbox/saltbox-core-api-client";
import { isGlobalServerError } from "@saltbox/saltbox-frontend-common";
import { Button, Tag, message } from "antd";
import { observer } from "mobx-react-lite";
import { useCallback } from "react";
import { useTranslation } from "react-i18next";

import {
  getSourceActionContext,
  isPlugInProgress,
  isSyncInProgress,
  isSyncRequestLoading,
} from "../../shared/helpers/source-action-progress";
import type { SourceActionsPort } from "../../shared/types/source-action";

import styles from "./sync-source-button.module.css";

export type SyncSourceButtonProps = {
  source: TemplateSourcePublicSchema;
  actions: SourceActionsPort;
  canSync: boolean;
  disabled?: boolean;
};

export const SyncSourceButton = observer(function SyncSourceButton({
  source,
  actions,
  canSync,
  disabled = false,
}: SyncSourceButtonProps) {
  const { t } = useTranslation();

  const actionContext = getSourceActionContext(actions, source.id);

  const showSync = canSync && !isPlugInProgress(actionContext);

  const syncProgress = isSyncInProgress({ source, ...actionContext });

  const syncRequestLoading = isSyncRequestLoading(actionContext);

  const handleSync = useCallback(async () => {
    try {
      await actions.syncSource(source.id);
      message.success(
        t("configuration-templates.source.action.sync-success", {
          name: source.name,
        })
      );
    } catch (error) {
      console.error(error);
      if (isGlobalServerError(error)) return;
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
    <Button
      size="small"
      icon={<SyncOutlined />}
      disabled={disabled}
      loading={syncRequestLoading}
      onClick={handleSync}
    >
      {t("common.sync")}
    </Button>
  );
});
