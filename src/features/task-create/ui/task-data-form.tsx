import type { TaskData, TaskTemplateModel } from "@saltbox/saltbox-core-api-client";
import { JsonForm, type JsonFormRef } from "@saltbox/saltbox-frontend-common";
import { Button, Flex } from "antd";
import { type Ref, useImperativeHandle, useRef, useState } from "react";

import { isFieldlessSchema } from "saltbox-core/shared/utils/template-rjsf-schema";

import styles from "./task-data-form.module.css";

export interface TaskDataFormHandle {
  validate: () => boolean;
  getData: () => TaskData;
}

export interface TaskDataFormProps {
  jsonSchema: TaskTemplateModel["json_schema"] | undefined;
  uiSchema: TaskTemplateModel["ui_schema"] | undefined;
  initialData?: TaskData;
  onSubmit: (data: TaskData) => void;
  onError: () => void;
  ref?: Ref<TaskDataFormHandle>;
}

export function TaskDataForm({
  jsonSchema,
  uiSchema,
  initialData,
  onSubmit,
  onError,
  ref,
}: TaskDataFormProps) {
  const [jsonData, setJsonData] = useState<TaskData>(initialData ?? {});
  const jsonFormRef = useRef<JsonFormRef<TaskData>>(null);

  useImperativeHandle(
    ref,
    () => ({
      validate: () => jsonFormRef.current?.validateForm() ?? true,
      getData: () => jsonData,
    }),
    [jsonData]
  );

  if (!jsonSchema) {
    return null;
  }

  if (isFieldlessSchema(jsonSchema)) {
    const asText = (value: unknown) => (typeof value === "string" ? value : undefined);

    const title = asText(uiSchema?.["ui:title"] ?? jsonSchema.title);
    const description = asText(uiSchema?.["ui:description"] ?? jsonSchema.description);

    return (
      <Flex vertical gap="small">
        {title ? <div className={styles.fieldlessSchemaLabel}>{title}</div> : null}
        {description ? (
          <div className={styles.fieldlessSchemaDescription}>{description}</div>
        ) : null}
      </Flex>
    );
  }

  return (
    <JsonForm
      name="task-data-form"
      id="task-data-form"
      ref={jsonFormRef}
      schema={jsonSchema}
      uiSchema={uiSchema}
      formData={jsonData}
      onChange={(data) => setJsonData(data.formData)}
      onSubmit={(event) => onSubmit(event.formData)}
      onError={onError}
    >
      <Button
        type="primary"
        form="task-data-form"
        key="submit"
        htmlType="submit"
        style={{ display: "none" }}
      />
    </JsonForm>
  );
}
