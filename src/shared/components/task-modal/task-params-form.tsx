import { useRef } from "react";
import { useTranslation } from "react-i18next";
import { Form } from "@rjsf/antd";
import validator from "@rjsf/validator-ajv8";
import { Button, Flex } from "antd";
import {
  TaskCreateRequestSchemaInput,
  TaskData,
  TaskTemplateModel,
} from "@saltbox/saltbox-core-api-client";
import styles from "./task-modal.module.css";

type TaskParamsFormProps = {
  taskTemplate?: TaskTemplateModel;
  onClose?: () => void;
  onFinish?: () => void;
  onChange?: (values: TaskData) => void;
  taskCreateRequest: Partial<TaskCreateRequestSchemaInput>;
};

export const TaskParamsForm = ({
  taskTemplate,
  taskCreateRequest,
  onClose,
  onFinish,
  onChange,
}: TaskParamsFormProps) => {
  const { t } = useTranslation();
  const formRef = useRef(null);

  const handleCreateTask = () => {
    //@ts-ignore
    if (formRef.current?.validateForm()) {
      onFinish?.();
    }
  };

  return (
    <Form
      ref={formRef}
      schema={taskTemplate?.json_schema ?? {}}
      uiSchema={taskTemplate?.ui_schema ?? {}}
      validator={validator}
      onChange={(data) => onChange?.(data.formData)}
      id="task-params-form"
      className={styles.taskParamsForm}
      idPrefix="task-params-form"
      idSeparator="-"
      showErrorList={false}
      formData={taskCreateRequest?.data}
      experimental_defaultFormStateBehavior={{
        allOf: 'populateDefaults',
      }}
    >
      <Flex justify="space-between">
        <Button type="default" onClick={() => onClose?.()}>
          {t("task-form.cancel")}
        </Button>

        <Button type="primary" onClick={handleCreateTask}>
          {t("task-form.create-task")}
        </Button>
      </Flex>
    </Form>
  );
};
