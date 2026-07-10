export function extractCreatedTemplateId(returnValue: unknown): string | undefined {
  if (typeof returnValue !== "object" || returnValue === null || !("template_id" in returnValue)) {
    return undefined;
  }

  const templateId = returnValue.template_id;
  return typeof templateId === "string" && templateId.length > 0 ? templateId : undefined;
}
