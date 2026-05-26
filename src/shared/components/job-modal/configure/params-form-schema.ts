import type { RJSFSchema } from "@rjsf/utils";
import type { JobSchemaModel } from "@saltbox/saltbox-core-api-client";
import type { JsonFormRef } from "@saltbox/saltbox-frontend-common";
import type { RefObject } from "react";

export const JOB_PARAMS_FORM_ID = "job-params-form";

type SchemaNode = {
  properties?: Record<string, SchemaNode>;
  required?: string[];
  [key: string]: unknown;
};

type UiSchemaNode = Record<string, unknown>;

const PARAM_ROOT_KEYS = new Set(["kwargs", "kwarg", "args", "arg"]);

const asSchemaNode = (schema: JobSchemaModel["json_schema"] | undefined): SchemaNode | undefined =>
  schema as SchemaNode | undefined;

const getRequiredKeys = (node: SchemaNode): string[] =>
  Array.isArray(node.required) ? node.required : [];

const subtreeHasRequiredFields = (node: SchemaNode): boolean => {
  if (!node.properties) {
    return false;
  }

  const required = getRequiredKeys(node);

  return Object.entries(node.properties).some(
    ([key, child]) => required.includes(key) || subtreeHasRequiredFields(child)
  );
};

const isVisibleField = (node: SchemaNode, key: string, showOptionalFields: boolean): boolean => {
  if (showOptionalFields) {
    return true;
  }

  const required = getRequiredKeys(node);
  const child = node.properties?.[key];

  if (!child) {
    return false;
  }

  return required.includes(key) || subtreeHasRequiredFields(child);
};

const buildVisibilityUiSchema = (
  node: SchemaNode,
  uiSchema: UiSchemaNode | undefined,
  showOptionalFields: boolean
): UiSchemaNode => {
  if (!node.properties) {
    return uiSchema ?? {};
  }

  const mergedUi: UiSchemaNode = { ...(uiSchema ?? {}) };

  for (const [key, childSchema] of Object.entries(node.properties)) {
    const childUi = (mergedUi[key] as UiSchemaNode) ?? {};

    if (!isVisibleField(node, key, showOptionalFields)) {
      mergedUi[key] = { ...childUi, "ui:widget": "hidden" };
      continue;
    }

    if (childSchema.properties) {
      mergedUi[key] = buildVisibilityUiSchema(childSchema, childUi, showOptionalFields);
    }
  }

  return mergedUi;
};

const buildValidationSchema = (node: SchemaNode): SchemaNode => {
  if (!node.properties) {
    return { ...node };
  }

  const required = new Set(getRequiredKeys(node));
  const properties = Object.fromEntries(
    Object.entries(node.properties).map(([key, childSchema]) => {
      const augmentedChild = buildValidationSchema(childSchema);

      if (PARAM_ROOT_KEYS.has(key) && subtreeHasRequiredFields(augmentedChild)) {
        required.add(key);
      }

      return [key, augmentedChild];
    })
  );

  return {
    ...node,
    properties,
    ...(required.size > 0 ? { required: Array.from(required) } : {}),
  };
};

export const getInitialJobParamsFormData = (
  schema: JobSchemaModel["json_schema"] | undefined
): Record<string, unknown> => {
  const node = asSchemaNode(schema);

  if (!node?.properties) {
    return {};
  }

  const formData: Record<string, unknown> = {};

  if (node.properties.kwargs || node.properties.kwarg) {
    formData.kwargs = {};
  }

  if (node.properties.args || node.properties.arg) {
    formData.args = [];
  }

  return formData;
};

export const prepareJobParamsForm = (
  jsonSchema: JobSchemaModel["json_schema"] | undefined,
  uiSchema: JobSchemaModel["ui_schema"] | undefined,
  showOptionalFields: boolean
): { validationSchema?: RJSFSchema; uiSchema?: UiSchemaNode } => {
  const node = asSchemaNode(jsonSchema);

  if (!node) {
    return {};
  }

  return {
    validationSchema: buildValidationSchema(node) as RJSFSchema,
    uiSchema: buildVisibilityUiSchema(node, uiSchema ?? {}, showOptionalFields),
  };
};

export const scrollToJobParamsFormFirstError = (): void => {
  const selector = `#${JOB_PARAMS_FORM_ID} .ant-form-item-has-error input, #${JOB_PARAMS_FORM_ID} .ant-form-item-has-error textarea, #${JOB_PARAMS_FORM_ID} .ant-form-item-has-error .ant-select-selector`;
  const firstErrorField = document.querySelector<HTMLElement>(selector);

  if (!firstErrorField) {
    return;
  }

  firstErrorField.scrollIntoView({ block: "center", behavior: "smooth" });
  firstErrorField.focus({ preventScroll: true });
};

export const validateJobParamsForm = (
  formRef: RefObject<JsonFormRef | null>,
  validationSchema?: RJSFSchema
): boolean => {
  if (!validationSchema) {
    return true;
  }

  const isValid = formRef.current?.validateForm() === true;

  if (!isValid) {
    setTimeout(scrollToJobParamsFormFirstError, 0);
  }

  return isValid;
};

export const getJobFunctionDescription = (
  jsonSchema?: JobSchemaModel["json_schema"],
  uiSchema?: JobSchemaModel["ui_schema"]
): string | undefined => {
  const schemaNode = asSchemaNode(jsonSchema);
  const uiNode = uiSchema as UiSchemaNode | undefined;

  if (!schemaNode) {
    return undefined;
  }

  const uiDescription = uiNode?.["ui:description"];
  if (typeof uiDescription === "string" && uiDescription.trim()) {
    return uiDescription;
  }

  if (typeof schemaNode.description === "string" && schemaNode.description.trim()) {
    return schemaNode.description;
  }

  if (typeof schemaNode.title === "string" && schemaNode.title.trim()) {
    return schemaNode.title;
  }

  return undefined;
};
