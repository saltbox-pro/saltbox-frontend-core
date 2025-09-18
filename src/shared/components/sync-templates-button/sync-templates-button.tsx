import { useState } from "react";
import { useTranslation } from "react-i18next";
import { Button, message } from "antd";
import { SyncOutlined } from "@ant-design/icons";
import { apiCoreStore } from "saltbox-core/store";

interface SyncTemplatesButtonProps {
  onSyncComplete?: () => void;
}

export function SyncTemplatesButton({
  onSyncComplete,
}: SyncTemplatesButtonProps) {
  const { t } = useTranslation();
  const [isSyncTemplates, setIsSyncTemplates] = useState(false);
  const [messageApi, contextHolder] = message.useMessage();

  const checkTemplatesSyncTask = async (taskId: string): Promise<void> => {
    try {
      const result =
        await apiCoreStore.settingsApi?.repoSyncStatus(
          {
            task_id: taskId,
          },
        );

      if (!result) {
        setIsSyncTemplates(false);
        messageApi.error(t("sync-templates-button.error-checking-task-status"));
        return;
      }

      if (result.progress === "FAILURE") {
        setIsSyncTemplates(false);
        messageApi.error(t("sync-templates-button.task-failed"));
        return;
      }

      if (result.progress === "SUCCESS") {
        setIsSyncTemplates(false);
        messageApi.success(t("sync-templates-button.success-on-sync-templates"));
        return;
      }

      await new Promise((resolve) => setTimeout(resolve, 1000));
      await checkTemplatesSyncTask(taskId);
    } catch {
      messageApi.error(t("sync-templates-button.error-checking-task-status"));
      setIsSyncTemplates(false);
    } finally {
      onSyncComplete?.();
    }
  };

  const handleSyncTemplates = () => {
    setIsSyncTemplates(true);
    apiCoreStore.jsonSchemasApi
      ?.jobsSchemasSync()
      .then((res) => {
        checkTemplatesSyncTask(res.task_id);
      })
      .catch(() => {
        messageApi.error(t("sync-templates-button.sync-failed"));
        setIsSyncTemplates(false);
      });
  };

  return (
    <>
      {contextHolder}
      <Button
        onClick={() => handleSyncTemplates()}
        loading={isSyncTemplates}
        icon={<SyncOutlined />}
      >
        {t("sync-templates-button.sync-templates")}
      </Button>
    </>
  );
}
