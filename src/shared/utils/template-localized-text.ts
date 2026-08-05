import type {
  Description,
  TemplateDescription,
  TemplateTitle,
  Title,
} from "@saltbox/saltbox-core-api-client";

export type LocalizedTextValue =
  | string
  | Record<string, string>
  | Title
  | TemplateTitle
  | Description
  | TemplateDescription
  | null
  | undefined;

export function getLocalizedTemplateText(value: LocalizedTextValue, language: string): string {
  if (value == null) return "";
  if (typeof value === "string") return value.trim();

  const dict = value as Record<string, string>;
  const lang = language?.split("-")[0] ?? language;
  return (dict[lang] ?? dict["en"] ?? Object.values(dict)[0] ?? "").trim();
}

export function getTemplateTitleText(title: LocalizedTextValue, language: string): string {
  return getLocalizedTemplateText(title, language);
}

export function getTemplateDescriptionText(
  description: LocalizedTextValue,
  language: string
): string {
  return getLocalizedTemplateText(description, language);
}
