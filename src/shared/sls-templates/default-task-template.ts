import { type TaskTemplateModel, TaskType } from "@saltbox/saltbox-core-api-client";

import type { BuiltinJobSchemaMeta } from "./types";

const DEFAULT_TASK_TEMPLATE_TITLE = {
  en: "Arbitrary Salt function",
  ru: "Произвольная Salt-функция",
};

const DEFAULT_TEMPLATE_DESCRIPTION_BY_TASK_TYPE = {
  [TaskType.Classic]: {
    en: "Task without a template: the Salt function is run with the arguments below",
    ru: "Задача без шаблона: Salt-функция запускается с указанными ниже аргументами",
  },
  [TaskType.Policy]: {
    en: "Policy without a template: the Salt function is run with the arguments below",
    ru: "Политика без шаблона: Salt-функция запускается с указанными ниже аргументами",
  },
} as const;

const DEFAULT_TASK_TEMPLATE_DESCRIPTION =
  DEFAULT_TEMPLATE_DESCRIPTION_BY_TASK_TYPE[TaskType.Classic];

const DEFAULT_TASK_TEMPLATE_I18N = {
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
  i18n: DEFAULT_TASK_TEMPLATE_I18N,
};

export const buildDefaultTaskTemplate = (
  fun: string,
  taskType: TaskType = TaskType.Classic
): TaskTemplateModel => {
  const description =
    DEFAULT_TEMPLATE_DESCRIPTION_BY_TASK_TYPE[taskType] ?? DEFAULT_TASK_TEMPLATE_DESCRIPTION;

  return {
    id: "",
    created: "",
    modified: "",
    source_id: "",
    title: DEFAULT_TASK_TEMPLATE_TITLE,
    description,
    fun,
    name: fun,
    json_schema: DEFAULT_TASK_TEMPLATE.json_schema,
    ui_schema: DEFAULT_TASK_TEMPLATE.ui_schema,
    i18n: {
      en: { ...DEFAULT_TASK_TEMPLATE_I18N.en, description: description.en },
      ru: { ...DEFAULT_TASK_TEMPLATE_I18N.ru, description: description.ru },
    },
  };
};

export const isDefaultTaskTemplate = (template: TaskTemplateModel | undefined): boolean =>
  template != null && !template.id;
