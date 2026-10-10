import type { RJSFSchema } from "@rjsf/utils";
import type { TaskData, TaskTemplateModel } from "@saltbox/saltbox-core-api-client";
import {
  JsonForm,
  revalidateJsonFormAfterAdvancedOpen,
  type JsonFormRef,
} from "@saltbox/saltbox-frontend-common";
import { Button } from "antd";
import { type Ref, useImperativeHandle, useLayoutEffect, useRef, useState } from "react";

import { TemplateParamsPlaceholder } from "saltbox-core/shared/components/template-params-placeholder/template-params-placeholder";
import { getDefaultJsonFormValue } from "saltbox-core/shared/utils/job-modal-utils";
import {
  validateJobJsonFormData,
  type JsonSchemaRecord,
  type UiSchemaRecord,
} from "saltbox-core/shared/utils/job-schema-split";

export interface TaskDataFormHandle {
  validate: () => boolean;
  getData: () => TaskData;
}

export interface TaskDataFormProps {
  jsonSchema: RJSFSchema | undefined;
  uiSchema: TaskTemplateModel["ui_schema"] | undefined;
  displaySchema: JsonSchemaRecord | null;
  displayUiSchema: UiSchemaRecord | undefined;
  isFieldless: boolean;
  isAdvanced: boolean;
  initialData?: TaskData;
  onSubmit: (data: TaskData) => void;
  onError: () => void;
  onRequestAdvanced: () => void;
  ref?: Ref<TaskDataFormHandle>;
}

export function TaskDataForm({
  jsonSchema,
  uiSchema,
  displaySchema,
  displayUiSchema,
  isFieldless,
  isAdvanced,
  initialData,
  onSubmit,
  onError,
  onRequestAdvanced,
  ref,
}: TaskDataFormProps) {
  const [jsonData, setJsonData] = useState<TaskData>(() => ({
    ...getDefaultJsonFormValue(jsonSchema),
    ...(initialData ?? {}),
  }));
  const jsonFormRef = useRef<JsonFormRef<TaskData>>(null);
  const shouldRevalidateAfterAdvancedOpenRef = useRef(false);

  useLayoutEffect(() => {
    if (!isAdvanced) {
      shouldRevalidateAfterAdvancedOpenRef.current = false;
      return;
    }

    revalidateJsonFormAfterAdvancedOpen({
      shouldRevalidateRef: shouldRevalidateAfterAdvancedOpenRef,
      isAdvanced,
      formRef: jsonFormRef,
      onMissingForm: onError,
    });
  }, [isAdvanced, onError]);

  const validate = (): boolean => {
    if (!jsonSchema || isFieldless) {
      return true;
    }

    const result = validateJobJsonFormData(
      jsonData as Record<string, unknown>,
      jsonSchema as JsonSchemaRecord | undefined,
      uiSchema as UiSchemaRecord | undefined,
      isAdvanced,
      displaySchema,
      displayUiSchema
    );

    if (result.ok) {
      return true;
    }

    if ("openAdvanced" in result) {
      shouldRevalidateAfterAdvancedOpenRef.current = true;
      onRequestAdvanced();
      return false;
    }

    if ("useFormRef" in result) {
      const form = jsonFormRef.current;
      if (!form) {
        onError();
        return false;
      }
      return form.validateForm() === true;
    }

    return false;
  };

  useImperativeHandle(ref, () => ({
    validate,
    getData: () => jsonData,
  }));

  if (!jsonSchema) {
    return null;
  }

  if (isFieldless) {
    return <TemplateParamsPlaceholder jsonSchema={jsonSchema} uiSchema={uiSchema} />;
  }

  if (!displaySchema) {
    return null;
  }

  return (
    <JsonForm
      key={isAdvanced ? "advanced" : "basic"}
      name="task-data-form"
      id="task-data-form"
      ref={jsonFormRef}
      schema={displaySchema}
      uiSchema={displayUiSchema}
      omitExtraData={false}
      formData={jsonData}
      onChange={(data) => {
        setJsonData(data.formData);
      }}
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
