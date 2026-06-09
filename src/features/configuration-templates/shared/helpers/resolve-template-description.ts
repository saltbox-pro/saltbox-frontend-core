import type { Description } from "@saltbox/saltbox-core-api-client";

export function resolveTemplateDescription(
  description: Description | null | undefined,
  language: string
): string | undefined {
  if (description == null) return undefined;

  if (typeof description === "string") return description;

  if (typeof description === "object") {
    const localized = (description as Record<string, string>)[language];
    if (localized) return localized;

    return Object.values(description as Record<string, string>)[0];
  }

  return undefined;
}
