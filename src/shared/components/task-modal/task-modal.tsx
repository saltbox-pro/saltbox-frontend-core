import {
  CollectionModel,
  MasterViewSchema,
  TaskCreateRequestSchema,
  TaskTargetMinion,
  TaskTemplateModel,
  TaskType,
  TaskData,
} from "@saltbox/saltbox-core-api-client";
import { publish, Modal } from "@saltbox/saltbox-frontend-common";
import Ajv from "ajv";
import { Tabs, message } from "antd";
import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";

import { apiCoreStore } from "saltbox-core/store";

import { TaskForm } from "./task-form";
import { TaskParamsForm } from "./task-params-form";
import { TaskRaw } from "./task-raw";
import { TaskFormData } from "./types";

const filterTaskData = (
  formData: Partial<TaskCreateRequestSchema>,
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
  onClose: (form?: TaskCreateRequestSchema) => void;
  saltMasters: Array<MasterViewSchema>;
};

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

  const [taskCreateRequest, setTaskCreateRequest] = useState<Partial<TaskCreateRequestSchema>>({});

  const handleModalCancel = () => {
    onClose();
  };

  const handleTaskForm = (formData: TaskFormData) => {
    setTaskCreateRequest({ ...taskCreateRequest, ...formData });
  };

  const handleTaskParamsForm = (formData: TaskData) => {
    setTaskCreateRequest({ ...taskCreateRequest, data: { ...formData } });
  };

  const handleTaskRawChange = (formData: TaskCreateRequestSchema) => {
    setTaskCreateRequest(formData);
  };

  const handleChooseParams = () => {
    setActiveTabKey("task-params");
  };

  const getTaskCreateRequest = () => {
    return {
      task_type: taskCreateRequest?.task_type ?? TaskType.Classic,
      task_template_id: taskCreateRequest?.task_template_id ?? "",
      collection_slug: collection?.slug ?? "",
      minions: minionList ?? [],
      query: query ?? {},
      batch_size: taskCreateRequest?.batch_size ?? 0,
      max_retries: taskCreateRequest?.max_retries ?? 3,
      max_jobs_count_at_same_time: taskCreateRequest?.max_jobs_count_at_same_time ?? 1,
      data: filterTaskData(taskCreateRequest, taskTemplate),
    } as TaskCreateRequestSchema;
  };

  const handleCreateTask = () => {
    onClose(getTaskCreateRequest());
  };

  const handleCreateTaskPlugin = (pluginKey: string) => {
    publish("minions.taskmodal.create", {
      action: "create",
      pluginKey: pluginKey,
      taskCreateRequest: getTaskCreateRequest(),
      templateDescription: taskTemplate?.title ?? "",
    });
    onClose();
  };

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
          taskCreateRequest={taskCreateRequest}
          onFinish={handleCreateTask}
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
          onCreateTaskPlugin={handleCreateTaskPlugin}
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
