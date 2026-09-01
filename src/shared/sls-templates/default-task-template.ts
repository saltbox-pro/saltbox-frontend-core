import type { TaskTemplateModel } from "@saltbox/saltbox-core-api-client";

import type { BuiltinJobSchemaMeta } from "./types";

const DEFAULT_TASK_TEMPLATE_TITLE = {
  en: "Arbitrary Salt function",
  ru: "Произвольная Salt-функция",
};

const DEFAULT_TASK_TEMPLATE_DESCRIPTION = {
  en: "Task without a template: the Salt function is run with the arguments below",
  ru: "Задача без шаблона: Salt-функция запускается с указанными ниже аргументами",
};

export const DEFAULT_TASK_TEMPLATE: BuiltinJobSchemaMeta = {
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
      title: DEFAULT_TASK_TEMPLATE_TITLE.en,
      description: DEFAULT_TASK_TEMPLATE_DESCRIPTION.en,
      args_title: "Args",
      kwargs_title: "Kwargs",
    },
    ru: {
      title: DEFAULT_TASK_TEMPLATE_TITLE.ru,
      description: DEFAULT_TASK_TEMPLATE_DESCRIPTION.ru,
      args_title: "Аргументы",
      kwargs_title: "Именованные аргументы",
    },
  },
};

export const buildDefaultTaskTemplate = (fun: string): TaskTemplateModel => ({
  id: "",
  created: "",
  modified: "",
  source_id: "",
  title: DEFAULT_TASK_TEMPLATE_TITLE,
  description: DEFAULT_TASK_TEMPLATE_DESCRIPTION,
  fun,
  name: fun,
  json_schema: DEFAULT_TASK_TEMPLATE.json_schema,
  ui_schema: DEFAULT_TASK_TEMPLATE.ui_schema,
  i18n: DEFAULT_TASK_TEMPLATE.i18n,
});

export const isDefaultTaskTemplate = (template: TaskTemplateModel | undefined): boolean =>
  template != null && !template.id;
