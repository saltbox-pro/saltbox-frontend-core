import { LinkOutlined } from "@ant-design/icons";
import type { TemplateSourcePublicSchema } from "@saltbox/saltbox-core-api-client";
import { isGlobalServerError } from "@saltbox/saltbox-frontend-common";
import { Button, message } from "antd";
import { observer } from "mobx-react-lite";
import { useCallback } from "react";
import { useTranslation } from "react-i18next";

import {
  getSourceActionContext,
  isPlugInProgress,
  isPlugSourceOperation,
  isSourceOperationInProgress,
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

  const plugInProgress = isPlugInProgress(actionContext);
  const showConnect = canConnect || plugInProgress;

  const isLoading =
    plugInProgress ||
    (canConnect &&
      isSourceOperationInProgress(source) &&
      isPlugSourceOperation(source.current_operation));

  const handleConnect = useCallback(async () => {
    try {
      await actions.plugSource(source.id);
    } catch (error) {
      console.error(error);
      if (isGlobalServerError(error)) return;
      message.error(t("configuration-templates.source.action.plug-error"));
    }
  }, [actions, source.id, t]);

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
      {t("common.connect")}
    </Button>
  );
});
