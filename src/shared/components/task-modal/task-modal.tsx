import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import Ajv from "ajv";
import { Modal, Tabs, message } from "antd";
import {
  CollectionModel,
  MasterViewSchema,
  TaskCreateRequestSchemaInput,
  TaskData,
  TaskTargetMinion,
  TaskTemplateModel,
} from "@saltbox/saltbox-core-api-client";
import { apiCoreStore } from "saltbox-core/store";
import { TaskForm, TaskFormData } from "./task-form";
import { TaskParamsForm } from "./task-params-form";
import { TaskRaw } from "./task-raw";
import { publish } from "@saltbox/saltbox-frontend-common";

const filterAdditionalParams = (
  formData: Partial<TaskCreateRequestSchemaInput>,
  taskTemplate?: TaskTemplateModel
): TaskData | undefined => {
  const data = formData.data ?? {};
  const ajv = new Ajv({ removeAdditional: true });
  const validate = ajv.compile(taskTemplate?.json_schema ?? {});
  if (validate(data)) {
    return data;
  }
};

export type TaskModalProps = {
  isOpen: boolean;
  collection?: CollectionModel;
  minionList?: Array<TaskTargetMinion>;
  query?: object;
  onClose: (form?: TaskCreateRequestSchemaInput) => void;
  saltMasters: Array<MasterViewSchema>;
}

export function TaskModal({
  isOpen,
  collection,
  minionList,
  query,
  onClose,
  saltMasters,
}: TaskModalProps) {
  const { t } = useTranslation();
  const [taskTemplate, setTaskTemplate] = useState<TaskTemplateModel>();
  const [activeTabKey, setActiveTabKey] = useState<string>("task-info");
  const [messageApi] = message.useMessage();

  const [taskCreateRequest, setTaskCreateRequest] = useState<
    Partial<TaskCreateRequestSchemaInput>
  >({});

  const handleModalCancel = () => {
    onClose();
  };

  const handleTaskForm = (formData: TaskFormData) => {
    setTaskCreateRequest({ ...taskCreateRequest, ...formData });
  };

  const handleTaskParamsForm = (formData: TaskData) => {
    setTaskCreateRequest({ ...taskCreateRequest, data: { ...formData } });
  };

  const handleTaskRawChange = (formData: TaskCreateRequestSchemaInput) => {
    setTaskCreateRequest(formData);
  };

  const handleChooseParams = () => {
    setActiveTabKey("task-params");
  };

  const getTaskCreateRequest = () => {
    return {
      task_template_id: taskCreateRequest?.task_template_id ?? "",
      salt_masters: taskCreateRequest?.salt_masters ?? [],
      collection_slug: collection?.slug ?? "",
      minions: minionList ?? [],
      query: query ?? {},
      batch_size: taskCreateRequest?.batch_size ?? 0,
      max_retries: taskCreateRequest?.max_retries ?? 3,
      max_jobs_count_at_same_time:
        taskCreateRequest?.max_jobs_count_at_same_time ?? 1,
      data: filterAdditionalParams(taskCreateRequest, taskTemplate),
    };
  }

  const handleCreateTask = () => {
    onClose(getTaskCreateRequest());
  };

  const handleCreateTaskPlugin = (pluginKey: string) => {
    publish("minions.taskmodal.create", {
      pluginKey: pluginKey,
      taskCreateRequest: getTaskCreateRequest(),
      templateDescription: taskTemplate?.title ?? "",
    });
    onClose();
  }

  useEffect(() => {
    if (taskCreateRequest?.task_template_id) {
      apiCoreStore.taskTemplatesApi
        ?.taskTemplateRetrieve({
          tpl_id: taskCreateRequest?.task_template_id,
        })
        .then((template) => {
          setTaskTemplate(template);
          setTaskCreateRequest({ ...taskCreateRequest, data: {} });
        })
        .catch(() => {
          setTaskTemplate(undefined);
          messageApi.error(t("task-modal.error-on-load-task-template"));
        });
    } else {
      setTaskTemplate(undefined);
    }
  }, [taskCreateRequest?.task_template_id]);

  const tabs = [
    {
      key: "task-info",
      label: t("task-modal.task-info"),
      children: (
        <TaskForm
          taskTemplate={taskTemplate}
          taskCreateRequest={taskCreateRequest}
          onFinish={handleCreateTask}
          onCreateTaskPlugin={handleCreateTaskPlugin}
          onChange={handleTaskForm}
          onChooseParams={handleChooseParams}
          onClose={onClose}
          saltMasters={saltMasters}
        />
      ),
    },
    {
      key: "task-params",
      label: t("task-modal.task-params"),
      disabled: !taskTemplate,
      children: (
        <TaskParamsForm
          taskTemplate={taskTemplate}
          taskCreateRequest={taskCreateRequest}
          onClose={onClose}
          onFinish={handleCreateTask}
          onCreateTaskPlugin={handleCreateTaskPlugin}
          onChange={handleTaskParamsForm}
        />
      ),
    },
    {
      key: "task-raw",
      label: t("task-modal.task-raw"),
      children: (
        <TaskRaw
          taskCreateRequest={taskCreateRequest}
          onClose={onClose}
          onChange={handleTaskRawChange}
          onFinish={handleCreateTask}
        />
      ),
    },
  ];

  return (
    <>
      <Modal
        title={t("task-modal.dialog-title")}
        open={isOpen}
        onCancel={handleModalCancel}
        width={"50%"}
        height={"80vh"}
        styles={{ body: { height: "100%" } }}
        footer={""}
        maskClosable={false}
        closable={false}
      >
        <Tabs
          defaultActiveKey="task-info"
          activeKey={activeTabKey}
          onChange={setActiveTabKey}
          items={tabs}
        ></Tabs>
      </Modal>
    </>
  );
}
