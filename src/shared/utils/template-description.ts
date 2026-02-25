export type TemplateDescriptionValue = string | Record<string, string> | null | undefined;

export function getTemplateDescriptionText(
  description: TemplateDescriptionValue,
  language: string
): string {
  if (description == null) return "";
  if (typeof description === "string") return description.trim();
  const dict = description;
  const lang = language?.split("-")[0] ?? language;
  return (dict[lang] ?? dict["en"] ?? Object.values(dict)[0] ?? "").trim();
}
