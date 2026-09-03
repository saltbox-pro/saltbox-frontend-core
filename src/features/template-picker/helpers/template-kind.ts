import type { TaskTemplatePublicSchema } from "@saltbox/saltbox-core-api-client";

import type { PickedTemplate, TaskTemplatePickerItem } from "../type/types";

export const SLS_TEMPLATE_FUN = "state.apply";

const FUNCTION_TEMPLATE_NAME_PREFIX = "schemas.";

type TemplateKindShape = Pick<TaskTemplatePublicSchema, "fun" | "name">;

export function isFunctionTemplate(template: TemplateKindShape): boolean {
  return (
    template.fun !== SLS_TEMPLATE_FUN || template.name.startsWith(FUNCTION_TEMPLATE_NAME_PREFIX)
  );
}

export function toPickedTemplate(template: TaskTemplatePickerItem): PickedTemplate {
  return {
    sourceId: template.source_id,
    templateId: template.id,
    fun: template.fun,
    name: template.name,
    isFunctionTemplate: isFunctionTemplate(template),
    sourceName: template.repository,
  };
}

export function getFunctionModuleName(fun: string): string {
  return fun.split(".")[0] ?? "";
}

export function getFunctionDisplayName(fun: string): string {
  const parts = fun.split(".");
  return parts[parts.length - 1] || fun;
}
