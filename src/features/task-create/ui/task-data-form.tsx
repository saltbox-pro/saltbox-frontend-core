import type { RJSFSchema } from "@rjsf/utils";
import type { TaskData, TaskTemplateModel } from "@saltbox/saltbox-core-api-client";
import { JsonForm, type JsonFormRef } from "@saltbox/saltbox-frontend-common";
import { Button } from "antd";
import { type Ref, useImperativeHandle, useRef, useState } from "react";

import { TemplateParamsPlaceholder } from "saltbox-core/shared/components/template-params-placeholder/template-params-placeholder";

export interface TaskDataFormHandle {
  validate: () => boolean;
  getData: () => TaskData;
}

export interface TaskDataFormProps {
  jsonSchema: RJSFSchema | undefined;
  uiSchema: TaskTemplateModel["ui_schema"] | undefined;
  isFieldless: boolean;
  initialData?: TaskData;
  onSubmit: (data: TaskData) => void;
  onError: () => void;
  ref?: Ref<TaskDataFormHandle>;
}

export function TaskDataForm({
  jsonSchema,
  uiSchema,
  isFieldless,
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

  if (isFieldless) {
    return <TemplateParamsPlaceholder jsonSchema={jsonSchema} uiSchema={uiSchema} />;
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
