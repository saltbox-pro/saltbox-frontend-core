import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { createColumnHelper } from "@tanstack/react-table";
import { observer } from "mobx-react-lite";
import { Breadcrumb, Button, Modal, Switch, message } from "antd";
import {
  HomeOutlined,
  PlusOutlined,
  SyncOutlined,
  EditOutlined,
  DeleteOutlined,
} from "@ant-design/icons";
import { SettingsSlsRepoShortSchema } from "@saltbox/saltbox-core-api-client";
import {
  SlsFormData,
  SlsModal,
} from "saltbox-core/shared/components/sls-modal/sls-modal";
import { formatTimeByUserTZ, PageHeader, FastTablePaginated } from "@saltbox/saltbox-frontend-common";
import { apiCoreStore, settingsSlsStore } from "saltbox-core/store";

const SettingsSlsTable = FastTablePaginated<SettingsSlsRepoShortSchema>;

const columnHelper = createColumnHelper<SettingsSlsRepoShortSchema>();

const SettingsSlsPage = observer(() => {
  const { t } = useTranslation();
  const [messageApi, contextHolder] = message.useMessage();
  const columns = [
    columnHelper.accessor("name", {
      header: t("settings-sls.table-name"),
    }),
    columnHelper.accessor("description", {
      header: t("settings-sls.table-description"),
    }),
    columnHelper.accessor("repo_url", {
      header: t("settings-sls.table-repo-url"),
    }),
    columnHelper.accessor("local_path", {
      header: t("settings-sls.table-local-path"),
    }),
    columnHelper.accessor("last_synced", {
      header: t("settings-sls.table-last-synced"),
      cell: (data) => {
        if (data) {
          const value = data.getValue();
          if (value === undefined) {
            return <div>{t("settings-sls.table-no-sync")}</div>;
          } else {
            const created = formatTimeByUserTZ(value);
            return <div>{created}</div>;
          }
        }
      },
    }),
    columnHelper.accessor("is_last_sync_successful", {
      header: t("settings-sls.table-sync-status"),
    }),
    columnHelper.display({
      header: t("settings-sls.table-is-active"),
      cell: ({ row }) => {
        return (
          <Switch
            checked={row.original.is_active}
            onClick={() =>
              settingsSlsStore.handleSlsActivation(
                row.original.id,
                row.original.is_active
              )
            }
          />
        );
      },
    }),
    columnHelper.display({
      header: t("settings-sls.table-actions"),
      cell: ({ row }) => {
        return (
          <div style={{ display: "flex", gap: "8px" }}>
            <Button
              type="default"
              icon={<EditOutlined />}
              shape="circle"
              onClick={() => handleEditSls(row.original.id)}
              title={t("settings-sls.table-edit")}
            />

            <Button
              type="default"
              icon={<SyncOutlined />}
              shape="circle"
              loading={row.original.is_active && isSyncSls}
              disabled={!row.original.is_active}
              onClick={() => handleSlsSync(row.original.id)}
              title={t("settings-sls.table-sync")}
            />

            <Button
              danger
              icon={<DeleteOutlined />}
              shape="circle"
              onClick={() => handleDeleteSls(row.original)}
              title={t("settings-sls.table-delete")}
            />
          </div>
        );
      },
    }),
  ];

  const [isSlsModalOpen, setIsSlsModalOpen] = useState(false);
  const [isSlsDeleteModalOpen, setIsSlsDeleteModalOpen] = useState(false);
  const [dialogMode, setDialogMode] = useState<"create" | "edit">("create");
  const [isSyncSls, setIsSyncSls] = useState(false);
  const [recordToEdit, setRecordToEdit] =
    useState<SettingsSlsRepoShortSchema>();

  useEffect(() => {
    settingsSlsStore.reload();
  }, []);

  const handleEditSls = (id: string) => {
    const record = settingsSlsStore.slsreps.find((item) => item.id === id);
    setRecordToEdit(record);
    setDialogMode("edit");
    setIsSlsModalOpen(true);
  };

  const handleSlsSync = (id: string) => {
    setIsSyncSls(true);
    apiCoreStore.settingsApi
      ?.repoSync({
        sid: id,
      })
      .then((res) => {
        checkSlsSyncTask(res.task_id);
      })
      .catch(() => {
        messageApi.error(t("settings-sls.error-on-sync"));
        settingsSlsStore.reload();
        setIsSyncSls(false);
      });
  };

  const checkSlsSyncTask = async (taskId: string): Promise<void> => {
    try {
      const result =
        await apiCoreStore.settingsApi?.repoSyncStatus(
          {
            task_id: taskId,
          }
        );

      if (!result) {
        setIsSyncSls(false);
        messageApi.error(t("settings-sls.error-on-check-task-status"));
        return;
      }

      if (result.progress === "FAILURE") {
        setIsSyncSls(false);
        messageApi.error(t("settings-sls.task-failed"));
        return;
      }

      if (result.progress === "SUCCESS") {
        setIsSyncSls(false);
        messageApi.success(t("settings-sls.success-on-sync-sls"));
        return;
      }

      await new Promise((resolve) => setTimeout(resolve, 1000));
      await checkSlsSyncTask(taskId);
    } catch {
      messageApi.error(t("settings-sls.error-on-check-task-status"));
      setIsSyncSls(false);
    }
    settingsSlsStore.reload();
  };

  const handleCreateSls = () => {
    setDialogMode("create");
    setIsSlsModalOpen(true);
  };

  const handleDeleteSls = (repo: SettingsSlsRepoShortSchema) => {
    setRecordToEdit(repo);
    setIsSlsDeleteModalOpen(true);
  };

  const handleSlsModalClose = (formValue?: SlsFormData) => {
    if (formValue === undefined) {
      setIsSlsModalOpen(false);
      return;
    }

    if (dialogMode === "create") {
      apiCoreStore.settingsApi
        ?.repoCreate({
          SettingsSlsRepoCreateSchema: {
            name: formValue.name,
            description: formValue.description ? formValue.description : "",
            repo_url: formValue.repo_url ? formValue.repo_url : "",
            repo_user: formValue.repo_user ? formValue.repo_user : "",
            repo_pass: formValue.repo_pass ? formValue.repo_pass : "",
          },
        })
        .then(() => {
          messageApi.success(t("settings-sls.success-on-create-sls"));
        })
        .catch(() => {
          messageApi.error(t("settings-sls.error-on-create-sls"));
        })
        .finally(() => {
          settingsSlsStore.reload();
          setIsSlsModalOpen(false);
        });
    }
    if (dialogMode === "edit") {
      apiCoreStore.settingsApi
        ?.repoUpdate({
          sid: recordToEdit ? recordToEdit?.id : "",
          SettingsSlsRepoUpdateSchema: {
            name: formValue.name,
            description: formValue.description ? formValue.description : "",
            repo_user: formValue.repo_user ? formValue.repo_user : "",
            repo_pass: formValue.repo_pass ? formValue.repo_pass : "",
          },
        })
        .then(() => {
          messageApi.success(t("settings-sls.success-on-edit-sls"));
        })
        .catch(() => {
          messageApi.error(t("settings-sls.error-on-edit-sls"));
        })
        .finally(() => {
          settingsSlsStore.reload();
          setIsSlsModalOpen(false);
        });
    }
  };

  return (
    <>
      {contextHolder}
      <Breadcrumb
        items={[
          {
            href: "/",
            title: <HomeOutlined />,
          },
          {
            title: t("settings-sls.title"),
          },
        ]}
      />

      <PageHeader title={t("settings-sls.title")}></PageHeader>

      <div className="page-actions-buttons">
        <Button
          type="primary"
          icon={<PlusOutlined />}
          onClick={handleCreateSls}
        >
          {t("settings-sls.table-add-repository")}
        </Button>
      </div>

      <SettingsSlsTable
        columns={columns}
        data={settingsSlsStore.slsreps}
        pagination={settingsSlsStore.pagination}
        onLazyLoad={(pagination) => settingsSlsStore.handleLazyLoad(pagination)}
      ></SettingsSlsTable>

      {isSlsModalOpen && (
        <SlsModal
          isOpen={isSlsModalOpen}
          onClose={handleSlsModalClose}
          mode={dialogMode}
          record={recordToEdit}
        />
      )}
      <Modal
        title={t("settings-sls.modal-delete-repository")}
        open={isSlsDeleteModalOpen}
        onOk={() => {
          if (recordToEdit) {
            settingsSlsStore.handleSlsDelete(recordToEdit.id);
            setIsSlsDeleteModalOpen(false);
          }
        }}
        onCancel={() => setIsSlsDeleteModalOpen(false)}
        okText={t("settings-sls.modal-delete-repository-confirm")}
        cancelText={t("settings-sls.modal-delete-repository-reject")}
        okButtonProps={{ danger: true }}
        closable={false}
      >
        <p>
          {t("settings-sls.modal-delete-repository-confirm-text", { name: recordToEdit ? recordToEdit.name : "" })}?
        </p>
      </Modal>
    </>
  );
});

export default SettingsSlsPage;
