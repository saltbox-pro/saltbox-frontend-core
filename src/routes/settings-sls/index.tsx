import {
  PlusOutlined,
  SyncOutlined,
  EditOutlined,
  DeleteOutlined,
  CloudDownloadOutlined,
} from "@ant-design/icons";
import {
  SettingsSlsRepoCreateSchema,
  SettingsSlsRepoShortSchema,
} from "@saltbox/saltbox-core-api-client";
import {
  formatTimeByUserTZ,
  PageHeader,
  FastTablePaginated,
  Modal,
} from "@saltbox/saltbox-frontend-common";
import { createColumnHelper } from "@tanstack/react-table";
import { Button, Switch, message } from "antd";
import { observer } from "mobx-react-lite";
import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";

import { SlsFormData, SlsModal } from "saltbox-core/shared/components/sls-modal/sls-modal";
import { apiCoreStore, settingsSlsStore } from "saltbox-core/store";

import { SlsGitLabModal } from "./-components/sls-gitlab-modal/sls-gitlab-modal";

const SettingsSlsTable = FastTablePaginated<SettingsSlsRepoShortSchema>;

const columnHelper = createColumnHelper<SettingsSlsRepoShortSchema>();

type ModalType = "slsCreate" | "slsEdit" | "slsDelete" | "slsGitLab" | null;

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
              settingsSlsStore.handleSlsActivation(row.original.id, row.original.is_active)
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
              loading={syncingSlsId === row.original.id}
              disabled={!row.original.is_active || syncingSlsId !== null}
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

  const [activeModal, setActiveModal] = useState<ModalType>(null);
  const [syncingSlsId, setSyncingSlsId] = useState<string | null>(null);
  const [recordToEdit, setRecordToEdit] = useState<SettingsSlsRepoShortSchema>();

  useEffect(() => {
    settingsSlsStore.reload();
  }, []);

  const handleEditSls = (id: string) => {
    const record = settingsSlsStore.slsreps.find((item) => item.id === id);
    setRecordToEdit(record);
    setActiveModal("slsEdit");
  };

  const handleSlsSync = (id: string) => {
    setSyncingSlsId(id);
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
        setSyncingSlsId(null);
      });
  };

  const checkSlsSyncTask = async (taskId: string): Promise<void> => {
    try {
      const result = await apiCoreStore.settingsApi?.repoSyncStatus({
        task_id: taskId,
      });

      if (!result) {
        setSyncingSlsId(null);
        messageApi.error(t("settings-sls.error-on-check-task-status"));
        return;
      }

      if (result.progress === "FAILURE") {
        setSyncingSlsId(null);
        messageApi.error(t("settings-sls.task-failed"));
        return;
      }

      if (result.progress === "SUCCESS") {
        setSyncingSlsId(null);
        messageApi.success(t("settings-sls.success-on-sync-sls"));
        return;
      }

      await new Promise((resolve) => setTimeout(resolve, 1000));
      await checkSlsSyncTask(taskId);
    } catch {
      messageApi.error(t("settings-sls.error-on-check-task-status"));
      setSyncingSlsId(null);
    }
    settingsSlsStore.reload();
  };

  const handleCreateSls = () => {
    setActiveModal("slsCreate");
  };

  const handleDeleteSls = (repo: SettingsSlsRepoShortSchema) => {
    setRecordToEdit(repo);
    setActiveModal("slsDelete");
  };

  const handleSlsModalClose = (formValue?: SlsFormData) => {
    if (formValue === undefined) {
      setActiveModal(null);
      return;
    }

    if (activeModal === "slsCreate") {
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
          setActiveModal(null);
        });
    }

    if (activeModal === "slsEdit") {
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
          setActiveModal(null);
        });
    }
  };

  const handleLoadSlsRepositories = () => {
    setActiveModal("slsGitLab");
  };

  const handleSlsGitLabModalClose = (request?: SettingsSlsRepoCreateSchema) => {
    if (request) {
      apiCoreStore.settingsApi
        ?.repoCreate({
          SettingsSlsRepoCreateSchema: request,
        })
        .then(() => {
          messageApi.success(t("settings-sls.success-on-create-sls-from-gitlab"));
        })
        .catch(() => {
          messageApi.error(t("settings-sls.error-on-create-sls-from-gitlab"));
        })
        .finally(() => {
          settingsSlsStore.reload();
          setActiveModal(null);
        });
    } else {
      setActiveModal(null);
    }
  };

  return (
    <>
      {contextHolder}

      <PageHeader title={t("settings-sls.title")}></PageHeader>

      <div className="page-actions-buttons">
        <Button type="primary" icon={<PlusOutlined />} onClick={handleCreateSls}>
          {t("settings-sls.table-add-repository")}
        </Button>

        <Button type="default" icon={<CloudDownloadOutlined />} onClick={handleLoadSlsRepositories}>
          {t("settings-sls.add-repository-from-gitlab")}
        </Button>
      </div>

      <SettingsSlsTable
        columns={columns}
        data={settingsSlsStore.slsreps}
        isLoading={settingsSlsStore.isLoading}
        pagination={settingsSlsStore.pagination}
        sorting={settingsSlsStore.sorting}
        onLazyLoad={(pagination, sorting) => settingsSlsStore.handleLazyLoad(pagination, sorting)}
      />

      {(activeModal === "slsCreate" || activeModal === "slsEdit") && (
        <SlsModal
          isOpen={true}
          onClose={handleSlsModalClose}
          mode={activeModal === "slsCreate" ? "create" : "edit"}
          record={recordToEdit}
        />
      )}

      {activeModal === "slsDelete" && (
        <Modal
          title={t("settings-sls.modal-delete-repository")}
          open={true}
          onOk={() => {
            if (recordToEdit) {
              settingsSlsStore.handleSlsDelete(recordToEdit.id);
              setActiveModal(null);
            }
          }}
          onCancel={() => setActiveModal(null)}
          okText={t("settings-sls.modal-delete-repository-confirm")}
          cancelText={t("settings-sls.modal-delete-repository-reject")}
          okButtonProps={{ danger: true }}
          closable={false}
        >
          <p>
            {t("settings-sls.modal-delete-repository-confirm-text", {
              name: recordToEdit ? recordToEdit.name : "",
            })}
            ?
          </p>
        </Modal>
      )}

      {activeModal === "slsGitLab" && (
        <SlsGitLabModal isOpen={true} onClose={handleSlsGitLabModalClose} />
      )}
    </>
  );
});

export default SettingsSlsPage;
