import { DisconnectOutlined } from "@ant-design/icons";
import type { TemplateSourcePublicSchema } from "@saltbox/saltbox-core-api-client";
import { isGlobalServerError } from "@saltbox/saltbox-frontend-common";
import { Button, message } from "antd";
import { observer } from "mobx-react-lite";
import { useCallback } from "react";
import { useTranslation } from "react-i18next";

import { isBgTaskFailedError } from "saltbox-core/shared/errors/bg-task-failed.error";
import { isBgTaskPollAborted } from "saltbox-core/shared/errors/bg-task-poll-aborted.error";

import {
  getSourceActionContext,
  isUnplugInProgress,
  isUnplugRequestLoading,
} from "../../shared/helpers/source-action-progress";
import type { SourceActionsPort } from "../../shared/types/source-action";

export type DisconnectSourceButtonProps = {
  source: TemplateSourcePublicSchema;
  actions: SourceActionsPort;
  canUnplug: boolean;
  disabled?: boolean;
};

export const DisconnectSourceButton = observer(function DisconnectSourceButton({
  source,
  actions,
  canUnplug,
  disabled = false,
}: DisconnectSourceButtonProps) {
  const { t } = useTranslation();

  const actionContext = getSourceActionContext(actions, source.id);

  const unplugProgress = isUnplugInProgress({ ...actionContext, source });
  const unplugRequestLoading = isUnplugRequestLoading(actionContext);
  const isActuallyUnplugging = unplugProgress && canUnplug;
  const showDisconnect = canUnplug || isActuallyUnplugging;
  const isLoading = isActuallyUnplugging || unplugRequestLoading;

  const handleDisconnect = useCallback(async () => {
    try {
      await actions.unplugSource(source.id);
      message.success(
        t("configuration-templates.source.action.unplug-success", {
          name: source.name,
        })
      );
    } catch (error) {
      if (isGlobalServerError(error) || isBgTaskPollAborted(error)) return;

      if (isBgTaskFailedError(error)) {
        message.error(t("configuration-templates.source.action.unplug-error"));
        return;
      }

      console.error(error);
      message.error(t("configuration-templates.source.action.unplug-error"));
    }
  }, [actions, source.id, source.name, t]);

  if (!showDisconnect) return null;

  return (
    <Button
      size="small"
      icon={<DisconnectOutlined />}
      disabled={disabled}
      loading={isLoading}
      onClick={handleDisconnect}
    >
      {isLoading
        ? t("configuration-templates.source.status.disconnecting")
        : t("common.disconnect")}
    </Button>
  );
});
