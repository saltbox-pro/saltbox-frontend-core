import type { TaskTemplatePublicSchema } from "@saltbox/saltbox-core-api-client";

export type TaskTemplateWithRepository = TaskTemplatePublicSchema & {
  repository?: string;
};

export type TaskTemplatePickerItem = TaskTemplateWithRepository & {
  isAccessible: boolean;
};

export type TemplatePickerMode = "task" | "command";

export type PickedTemplate = {
  sourceId: string;
  templateId: string;
  fun: string;
  name: string;
  isFunctionTemplate: boolean;
};
