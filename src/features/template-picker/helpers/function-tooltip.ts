import { getFunctionDisplayName } from "./template-kind";

export type FunctionArgument = {
  name: string;
  type?: string;
  required: boolean;
  description?: string;
};

export type FunctionTooltipData = {
  name: string;
  description?: string;
  arguments: FunctionArgument[];
  example?: string;
  isLoadError?: boolean;
};

type FunctionSchemaProperty = {
  type?: string | string[];
  description?: string;
  properties?: Record<string, FunctionSchemaProperty>;
  required?: string[];
};

export type FunctionSchema = {
  description?: string;
  title?: string;
  example?: string;
  properties?: Record<string, FunctionSchemaProperty>;
};

type FunctionUiSchemaProperty = {
  "ui:description"?: string;
  "ui:title"?: string;
};

export type FunctionUiSchema = {
  "ui:description"?: string;
  [argumentName: string]: unknown;
};

export const buildFunctionTooltipData = (
  functionName: string,
  schema: FunctionSchema,
  uiSchema: FunctionUiSchema = {}
): FunctionTooltipData => {
  const kwargsSchema = schema.properties?.kwargs;
  const schemaProperties = kwargsSchema?.properties ?? {};
  const requiredProperties = kwargsSchema?.required ?? [];
  const uiKwargs = (uiSchema.kwargs as Record<string, FunctionUiSchemaProperty> | undefined) ?? {};

  const argumentsList = Object.entries(schemaProperties).map(([argumentName, argumentSchema]) => {
    const uiArgument = uiKwargs[argumentName];
    const argumentType = Array.isArray(argumentSchema.type)
      ? argumentSchema.type.join(" | ")
      : argumentSchema.type;
    const argumentDisplayName = uiArgument?.["ui:title"] ?? argumentName;
    const argumentDescription = uiArgument?.["ui:description"] ?? argumentSchema.description;

    return {
      name: argumentDisplayName,
      type: argumentType,
      required: requiredProperties.includes(argumentName),
      description: argumentDescription,
    };
  });

  return {
    name: getFunctionDisplayName(functionName),
    description: schema.description ?? schema.title ?? uiSchema["ui:description"],
    arguments: argumentsList,
    example: schema.example,
  };
};
