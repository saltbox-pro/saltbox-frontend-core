export const TEMPLATE_SOURCE_FORM_I18N_PREFIX = "configuration-templates.source-form";

export type TemplateSourceNameDescriptionFormValues = {
  name: string;
  description?: string;
};

export const TEMPLATE_SOURCE_NAME_MAX_LENGTH = 100;
export const TEMPLATE_SOURCE_DESCRIPTION_MAX_LENGTH = 500;
export const TEMPLATE_SOURCE_DESCRIPTION_ROWS = 3;

export function trimRequired(value: string): string {
  return value.trim();
}

export function trimOptional(value?: string): string | undefined {
  const trimmed = value?.trim();
  return trimmed || undefined;
}
