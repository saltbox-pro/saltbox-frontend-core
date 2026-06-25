export const TEMPLATE_SOURCE_FORM_I18N_PREFIX = "configuration-templates.source-form";

export const TEMPLATE_SOURCE_NAME_MAX_LENGTH = 100;
export const TEMPLATE_SOURCE_DESCRIPTION_MAX_LENGTH = 500;
export const TEMPLATE_SOURCE_BRANCH_MAX_LENGTH = 100;
export const TEMPLATE_SOURCE_NAMESPACE_MAX_LENGTH = 64;
export const TEMPLATE_SOURCE_NAMESPACE_PATTERN = /^[a-z0-9_]*$/;
export const TEMPLATE_SOURCE_REPO_URL_PATTERN = /^https?:\/\/.+/;

export const TEMPLATE_SOURCE_ARCHIVE_ALLOWED_EXTENSIONS = [
  ".tar.bz2",
  ".tar.gz",
  ".tar.xz",
  ".tbz2",
  ".tgz",
  ".txz",
  ".tar",
  ".zip",
] as const;

export const TEMPLATE_SOURCE_ARCHIVE_MAX_SIZE_BYTES = 4 * 1024 * 1024 * 1024;

export const TEMPLATE_SOURCE_ARCHIVE_MAX_SIZE_GB = 4;

export const TEMPLATE_SOURCE_ARCHIVE_ACCEPT = TEMPLATE_SOURCE_ARCHIVE_ALLOWED_EXTENSIONS.join(",");

export const TEMPLATE_SOURCE_ARCHIVE_FORMATS_LABEL =
  ".zip, .tar, .tar.gz (.tgz), .tar.bz2 (.tbz2), .tar.xz (.txz)";

export function trimRequired(value: string): string {
  return value.trim();
}

export function trimOptional(value?: string): string | undefined {
  const trimmed = value?.trim();
  return trimmed || undefined;
}
