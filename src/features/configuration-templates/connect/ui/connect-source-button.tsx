import { LinkOutlined } from "@ant-design/icons";
import type { TemplateSourcePublicSchema } from "@saltbox/saltbox-core-api-client";
import { AcceptedMastersActionButton, runMutation } from "@saltbox/saltbox-frontend-common";
import type { MessageInstance } from "antd/es/message/interface";
import { observer } from "mobx-react-lite";
import { useCallback } from "react";
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router";

import { mastersStore } from "saltbox-core/store";

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
  messageApi: MessageInstance;
};

export const ConnectSourceButton = observer(function ConnectSourceButton({
  source,
  actions,
  canConnect,
  disabled = false,
  messageApi,
}: ConnectSourceButtonProps) {
  const { t } = useTranslation();
  const navigate = useNavigate();

  const actionContext = getSourceActionContext(actions, source.id);

  const plugInProgress = isPlugInProgress({ ...actionContext, source });
  const isActuallyPlugging = plugInProgress && canConnect;
  const showConnect = canConnect || isActuallyPlugging;
  const isLoading = isActuallyPlugging;

  const executeConnect = useCallback(async () => {
    await runMutation({
      run: () => actions.plugSource(source.id),
      successMessage: t("configuration-templates.source.action.plug-success", {
        name: source.name,
      }),
      errorMessage: t("configuration-templates.source.action.plug-error"),
    });
  }, [actions, source.id, source.name, t]);

  if (!showConnect) return null;

  return (
    <AcceptedMastersActionButton
      type="primary"
      size="small"
      icon={<LinkOutlined />}
      disabled={disabled}
      loading={isLoading}
      messageApi={messageApi}
      navigate={navigate}
      checkHasAcceptedMasters={() => mastersStore.hasAcceptedMasters()}
      warningActionText={t("configuration-templates.warning-action.connect-source")}
      onAction={executeConnect}
    >
      {isLoading ? t("configuration-templates.source.status.connecting") : t("common.connect")}
    </AcceptedMastersActionButton>
  );
});
