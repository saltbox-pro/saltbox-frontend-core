import { DisconnectOutlined } from "@ant-design/icons";
import type { TemplateSourcePublicSchema } from "@saltbox/saltbox-core-api-client";
import { runMutation } from "@saltbox/saltbox-frontend-common";
import { Button } from "antd";
import { observer } from "mobx-react-lite";
import { useCallback } from "react";
import { useTranslation } from "react-i18next";

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
    await runMutation({
      run: () => actions.unplugSource(source.id),
      successMessage: t("configuration-templates.source.action.unplug-success", {
        name: source.name,
      }),
      errorMessage: t("configuration-templates.source.action.unplug-error"),
    });
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
