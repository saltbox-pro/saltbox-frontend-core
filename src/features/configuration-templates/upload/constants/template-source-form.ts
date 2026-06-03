export const TEMPLATE_SOURCE_NAME_MAX_LENGTH = 100;
export const TEMPLATE_SOURCE_DESCRIPTION_MAX_LENGTH = 500;
export const TEMPLATE_SOURCE_BRANCH_MAX_LENGTH = 100;

export const TEMPLATE_SOURCE_ARCHIVE_EXTENSIONS = [
  ".zip",
  ".tar",
  ".tar.gz",
  ".tar.bz2",
  ".tar.xz",
] as const;

export const TEMPLATE_SOURCE_ARCHIVE_ACCEPT = TEMPLATE_SOURCE_ARCHIVE_EXTENSIONS.join(",");

export const TEMPLATE_SOURCE_ARCHIVE_FORMATS_LABEL = TEMPLATE_SOURCE_ARCHIVE_EXTENSIONS.join(", ");

export function trimRequired(value: string): string {
  return value.trim();
}

export function trimOptional(value?: string): string | undefined {
  const trimmed = value?.trim();
  return trimmed || undefined;
}
