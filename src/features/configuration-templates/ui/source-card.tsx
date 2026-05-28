import { DeleteOutlined, LinkOutlined, SyncOutlined } from "@ant-design/icons";
import {
  SourceState,
  SourceType,
  type TemplateSourcePublicSchema,
} from "@saltbox/saltbox-core-api-client";
import { isGlobalServerError } from "@saltbox/saltbox-frontend-common";
import { Alert, Button, Flex, Modal, Tag, Tooltip, message } from "antd";
import { observer } from "mobx-react-lite";
import { useCallback } from "react";
import { useTranslation } from "react-i18next";

import { RepoCard } from "saltbox-core/shared/components/repo-card";
import { RepoCardConnection } from "saltbox-core/shared/components/repo-card/repo-card-connection";

import {
  getSourcePresentation,
  getSourceTypeLabelKey,
  getSourceWebUrl,
  hasActiveSourceOperation,
  isPlugSourceOperation,
  isSyncSourceOperation,
} from "../helpers/source-presentation";
import { useSourceOperationPoll } from "../hooks/use-source-operation-poll";
import type { ConfigurationTemplatesStore } from "../model/configuration-templates-store";

import styles from "./source-card.module.css";

export interface SourceCardProps {
  source: TemplateSourcePublicSchema;
  store: ConfigurationTemplatesStore;
}

export const SourceCard = observer(({ source, store }: SourceCardProps) => {
  const { t } = useTranslation();

  const [messageApi, contextHolder] = message.useMessage();

  const presentation = getSourcePresentation(source);
  const templatesState = store.templatesStore.getState(source.id);

  const isPlugInProgress = store.actionSourceId === source.id && store.actionSourceKind === "plug";

  const showPlug = presentation.actions.includes("plug") || isPlugInProgress;
  const showSync = presentation.actions.includes("sync") && !isPlugInProgress;
  const showDelete = presentation.actions.includes("delete");

  const isSyncRequestLoading =
    store.actionSourceId === source.id && store.actionSourceKind === "sync";
  const isDeleteLoading = store.actionSourceId === source.id && store.actionSourceKind === "delete";

  const hasActiveOperation = hasActiveSourceOperation(source);

  const isPlugButtonLoading =
    isPlugInProgress ||
    (presentation.actions.includes("plug") &&
      hasActiveOperation &&
      isPlugSourceOperation(source.current_operation));

  const isSyncInProgress =
    isSyncRequestLoading || (hasActiveOperation && isSyncSourceOperation(source.current_operation));

  const showHeaderSpinner = hasActiveOperation && !showPlug && !showSync && !isPlugInProgress;

  const isConnected = presentation.isConnected && !isPlugInProgress;

  useSourceOperationPoll(source.id, source.current_operation, store);

  const handleSourceActionError = useCallback(
    (error: unknown, errorKey: string) => {
      console.error(error);
      if (isGlobalServerError(error)) return;
      messageApi.error(t(errorKey));
    },
    [messageApi, t]
  );

  const handlePlug = useCallback(async () => {
    try {
      await store.plugSource(source.id);
    } catch (error) {
      handleSourceActionError(error, "configuration-templates.source.action.plug-error");
    }
  }, [handleSourceActionError, source.id, store]);

  const handleSync = useCallback(async () => {
    try {
      await store.syncSource(source.id);
    } catch (error) {
      handleSourceActionError(error, "configuration-templates.source.action.sync-error");
    }
  }, [handleSourceActionError, source.id, store]);

  const handleDeleteConfirm = useCallback(async () => {
    try {
      await store.deleteSource(source.id);
    } catch (error) {
      handleSourceActionError(error, "configuration-templates.source.action.delete-error");
      throw error;
    }
  }, [handleSourceActionError, source.id, store]);

  const handleDelete = () => {
    Modal.confirm({
      title: t("configuration-templates.source.delete-confirm-title"),
      icon: null,
      content: t("configuration-templates.source.delete-confirm-content", {
        name: source.name,
      }),
      okText: t("common.delete"),
      cancelText: t("common.cancel"),
      okButtonProps: { danger: true },
      onOk: handleDeleteConfirm,
    });
  };

  const headerExtra = (
    <Flex
      align="center"
      gap="small"
      className={styles.headerActions}
      onClick={(event) => event.stopPropagation()}
    >
      {showHeaderSpinner && (
        <span className={styles.headerSpinner}>
          <Tooltip
            title={t(`configuration-templates.source.operation.${source.current_operation}`)}
          >
            <SyncOutlined spin />
          </Tooltip>
        </span>
      )}

      {showPlug && (
        <Button
          type="primary"
          size="small"
          icon={<LinkOutlined />}
          disabled={isDeleteLoading}
          loading={isPlugButtonLoading}
          onClick={handlePlug}
        >
          {t("common.connect")}
        </Button>
      )}

      {showSync && isSyncInProgress ? (
        <Tag className={styles.syncingTag} icon={<SyncOutlined spin />}>
          {t("configuration-templates.source.status.syncing")}
        </Tag>
      ) : (
        showSync && (
          <Button
            size="small"
            icon={<SyncOutlined />}
            disabled={isDeleteLoading}
            loading={isSyncRequestLoading}
            onClick={handleSync}
          >
            {t("common.sync")}
          </Button>
        )
      )}

      {showDelete && (
        <Button
          type="primary"
          danger
          size="small"
          icon={<DeleteOutlined />}
          loading={isDeleteLoading}
          onClick={handleDelete}
        >
          {t("common.delete")}
        </Button>
      )}
    </Flex>
  );

  const titleSuffix = (
    <Flex align="center" gap={4} className={styles.titleTags}>
      <Tag color={source.source_type === SourceType.LocalBundle ? "blue" : "orange"}>
        {t(getSourceTypeLabelKey(source.source_type))}
      </Tag>
      <RepoCardConnection isConnected={isConnected} />
    </Flex>
  );

  return (
    <Flex vertical gap="small">
      {contextHolder}

      <RepoCard
        name={source.name}
        titleSuffix={titleSuffix}
        description={source.description || undefined}
        webUrl={getSourceWebUrl(source)}
        isConnected={isConnected}
        forceDimmed={presentation.isDimmed || isPlugInProgress}
        syncedAt={source.synced_at}
        showNotSynced={presentation.showNotSynced && showSync}
        createdAt={source.created}
        headerExtra={headerExtra}
        betweenInfoAndTemplates={
          !!source.last_error ? (
            <Alert
              type={source.state === SourceState.Broken ? "error" : "warning"}
              showIcon
              message={source.last_error}
            />
          ) : null
        }
        templates={{
          items: templatesState.items,
          isLoading: templatesState.isLoading,
          isLoadedOnce: templatesState.isLoadedOnce,
          hasMore: false,
          hasError: templatesState.hasError,
          onOpen: () => store.templatesStore.loadAll(source.id),
          onLoadMore: () => {},
        }}
      />
    </Flex>
  );
});
