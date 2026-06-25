import { LinkOutlined } from "@ant-design/icons";
import type { TemplateSourcePublicSchema } from "@saltbox/saltbox-core-api-client";
import { isGlobalServerError } from "@saltbox/saltbox-frontend-common";
import { Button, message } from "antd";
import { observer } from "mobx-react-lite";
import { useCallback } from "react";
import { useTranslation } from "react-i18next";

import { isBgTaskFailedError } from "../../shared/errors/bg-task-failed.error";
import { isBgTaskPollAborted } from "../../shared/errors/bg-task-poll-aborted.error";
import {
  getSourceActionContext,
  isPlugInProgress,
} from "../../shared/helpers/source-action-progress";
import type { SourceActionsPort } from "../../shared/types/source-action";

export type ConnectSourceButtonProps = {
  source: TemplateSourcePublicSchema;
  actions: SourceActionsPort;
  canConnect: boolean;
  disabled?: boolean;
};

export const ConnectSourceButton = observer(function ConnectSourceButton({
  source,
  actions,
  canConnect,
  disabled = false,
}: ConnectSourceButtonProps) {
  const { t } = useTranslation();

  const actionContext = getSourceActionContext(actions, source.id);

  const plugInProgress = isPlugInProgress({ ...actionContext, source });
  const isActuallyPlugging = plugInProgress && canConnect;
  const showConnect = canConnect || isActuallyPlugging;
  const isLoading = isActuallyPlugging;

  const handleConnect = useCallback(async () => {
    try {
      await actions.plugSource(source.id);
      message.success(
        t("configuration-templates.source.action.plug-success", {
          name: source.name,
        })
      );
    } catch (error) {
      if (isGlobalServerError(error) || isBgTaskPollAborted(error)) return;

      if (isBgTaskFailedError(error)) {
        message.error(t("configuration-templates.source.action.plug-error"));
        return;
      }

      console.error(error);
      message.error(t("configuration-templates.source.action.plug-error"));
    }
  }, [actions, source.id, source.name, t]);

  if (!showConnect) return null;

  return (
    <Button
      type="primary"
      size="small"
      icon={<LinkOutlined />}
      disabled={disabled}
      loading={isLoading}
      onClick={handleConnect}
    >
      {isLoading ? t("configuration-templates.source.status.connecting") : t("common.connect")}
    </Button>
  );
});
