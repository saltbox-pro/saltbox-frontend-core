import type { TemplateSourcePublicSchema } from "@saltbox/saltbox-core-api-client";
import { Flex } from "antd";
import { observer } from "mobx-react-lite";

import { ConnectSourceButton } from "../../connect/ui/connect-source-button";
import { SourceOperationSpinner } from "../../connect/ui/source-operation-spinner";
import { DeleteSourceButton } from "../../remove/ui/delete-source-button";
import { SyncSourceButton } from "../../sync/ui/sync-source-button";
import {
  getSourceActionContext,
  isDeleteInProgress,
  isPlugInProgress,
  isSyncInProgress,
  shouldShowSourceOperationSpinner,
} from "../../shared/helpers/source-action-progress";
import type { SourceActionsPort } from "../../shared/types/source-action";

import styles from "./template-source-actions-toolbar.module.css";

export type TemplateSourceActionsToolbarProps = {
  source: TemplateSourcePublicSchema;
  actions: SourceActionsPort;
  canConnect: boolean;
  canSync: boolean;
  showDelete: boolean;
};

export const TemplateSourceActionsToolbar = observer(function TemplateSourceActionsToolbar({
  source,
  actions,
  canConnect,
  canSync,
  showDelete,
}: TemplateSourceActionsToolbarProps) {
  const actionContext = getSourceActionContext(actions, source.id);

  const plugInProgress = isPlugInProgress(actionContext);
  const deleteInProgress = isDeleteInProgress(actionContext);

  const showConnect = canConnect || plugInProgress;
  const showSync = canSync && !plugInProgress;

  const syncInProgress = isSyncInProgress({ source, ...actionContext });

  const showOperationSpinner = shouldShowSourceOperationSpinner({
    source,
    showConnect,
    showSync,
    isPlugInProgress: plugInProgress,
    syncInProgress,
  });

  return (
    <Flex
      align="center"
      gap={5}
      className={styles.toolbar}
      onClick={(event) => event.stopPropagation()}
    >
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
        disabled={deleteInProgress}
      />

      <SyncSourceButton
        source={source}
        actions={actions}
        canSync={canSync}
        disabled={deleteInProgress}
      />

      {showDelete && (
        <DeleteSourceButton sourceId={source.id} sourceName={source.name} actions={actions} />
      )}
    </Flex>
  );
});
