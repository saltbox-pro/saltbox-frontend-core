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
