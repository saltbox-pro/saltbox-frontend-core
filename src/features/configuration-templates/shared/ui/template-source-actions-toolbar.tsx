import type { TemplateSourcePublicSchema } from "@saltbox/saltbox-core-api-client";
import { Flex } from "antd";
import type { MessageInstance } from "antd/es/message/interface";
import { observer } from "mobx-react-lite";

import { ConnectSourceButton } from "../../connect/ui/connect-source-button";
import { SourceOperationSpinner } from "../../connect/ui/source-operation-spinner";
import { DisconnectSourceButton } from "../../disconnect/ui/disconnect-source-button";
import { EditSourceButton } from "../../edit/ui/edit-source-button";
import { DeleteSourceButton } from "../../remove/ui/delete-source-button";
import { SyncSourceButton } from "../../sync/ui/sync-source-button";
import {
  getSourceActionContext,
  isDeleteInProgress,
  isPlugInProgress,
  isSyncInProgress,
  isUnplugInProgress,
  shouldShowSourceOperationSpinner,
} from "../helpers/source-action-progress";
import type { SourceActionsPort } from "../types/source-action";

import styles from "./template-source-actions-toolbar.module.css";

export type TemplateSourceActionsToolbarProps = {
  source: TemplateSourcePublicSchema;
  actions: SourceActionsPort;
  canConnect: boolean;
  canSync: boolean;
  canUnplug: boolean;
  showDelete: boolean;
  messageApi: MessageInstance;
};

export const TemplateSourceActionsToolbar = observer(function TemplateSourceActionsToolbar({
  source,
  actions,
  canConnect,
  canSync,
  canUnplug,
  showDelete,
  messageApi,
}: TemplateSourceActionsToolbarProps) {
  const actionContext = getSourceActionContext(actions, source.id);

  const plugInProgress = isPlugInProgress({ ...actionContext, source });
  const deleteInProgress = isDeleteInProgress({ ...actionContext, source });
  const syncInProgress = isSyncInProgress({ source, ...actionContext });
  const unplugInProgress = isUnplugInProgress({ ...actionContext, source });
  const isActuallyPlugging = plugInProgress && canConnect;
  const isActuallyUnplugging = unplugInProgress && canUnplug;

  const showConnect = canConnect || isActuallyPlugging;
  const showSync = (canSync || syncInProgress) && !isActuallyPlugging && !isActuallyUnplugging;
  const showUnplug = (canUnplug || isActuallyUnplugging) && !isActuallyPlugging;

  const connectDisabled = deleteInProgress || syncInProgress || unplugInProgress;
  const syncDisabled =
    deleteInProgress || unplugInProgress || isActuallyPlugging || isActuallyUnplugging;
  const unplugDisabled = deleteInProgress || syncInProgress || isActuallyPlugging;
  const editDisabled = deleteInProgress;

  const showOperationSpinner = shouldShowSourceOperationSpinner({
    source,
    showConnect,
    showSync,
    showUnplug,
    isPlugInProgress: isActuallyPlugging,
    syncInProgress,
    unplugInProgress: isActuallyUnplugging,
    deleteInProgress,
  });

  return (
    <Flex align="center" gap={5} className={styles.toolbar}>
      {source.current_operation !== null && (
        <SourceOperationSpinner
          operation={source.current_operation}
          visible={showOperationSpinner}
        />
      )}

      <ConnectSourceButton
        source={source}
        actions={actions}
        canConnect={canConnect}
        disabled={connectDisabled}
        messageApi={messageApi}
      />

      <SyncSourceButton
        source={source}
        actions={actions}
        showSync={showSync}
        disabled={syncDisabled}
        messageApi={messageApi}
      />

      <DisconnectSourceButton
        source={source}
        actions={actions}
        canUnplug={canUnplug}
        disabled={unplugDisabled}
      />

      <EditSourceButton source={source} actions={actions} disabled={editDisabled} />

      {showDelete && <DeleteSourceButton source={source} actions={actions} />}
    </Flex>
  );
});
