import type { BuiltinJobSchemaMeta } from "./types";

export const DEFAULT_JOB_SCHEMA: BuiltinJobSchemaMeta = {
  name: "default",
  title: "{{title}}",
  description: "{{description}}",
  json_schema: {
    type: "object",
    properties: {
      args: {
        type: "array",
        items: {
          type: "string",
        },
      },
      kwargs: {
        type: "object",
        additionalProperties: {
          type: "string",
        },
        propertyNames: {
          pattern: "^[A-Za-z_][A-Za-z0-9_]*$",
        },
      },
    },
  },
  ui_schema: {
    args: {
      "ui:title": "{{args_title}}",
    },
    kwargs: {
      "ui:title": "{{kwargs_title}}",
    },
  },
  i18n: {
    en: {
      title: "Default",
      description: "Arbitrary Salt function",
      args_title: "Args",
      kwargs_title: "Kwargs",
    },
    ru: {
      title: "Default",
      description: "Произвольная Salt-функция",
      args_title: "Аргументы",
      kwargs_title: "Именованные аргументы",
    },
  },
};
