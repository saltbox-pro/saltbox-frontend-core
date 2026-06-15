import {
  TEMPLATE_SOURCE_ARCHIVE_ALLOWED_EXTENSIONS,
  TEMPLATE_SOURCE_ARCHIVE_FORMATS_LABEL,
  TEMPLATE_SOURCE_ARCHIVE_MAX_SIZE_BYTES,
  TEMPLATE_SOURCE_ARCHIVE_MAX_SIZE_GB,
} from "../constants/template-source-form";

export type ArchiveSourceFileValidationErrorCode = "unsupported-format" | "file-too-large";

export type ArchiveSourceFileValidationError = {
  code: ArchiveSourceFileValidationErrorCode;
  extension?: string;
  maxSizeBytes: number;
};

type TranslateArchiveSourceFileValidationError = (
  key: string,
  options?: Record<string, string | number>
) => string;

const I18N_PREFIX = "configuration-templates.archive-source-modal";

const EXTENSIONS_LONGEST_FIRST = [...TEMPLATE_SOURCE_ARCHIVE_ALLOWED_EXTENSIONS].sort(
  (a, b) => b.length - a.length
);

export function getArchiveFileExtension(filename: string): string | null {
  const lower = filename.toLowerCase();

  return EXTENSIONS_LONGEST_FIRST.find((ext) => lower.endsWith(ext)) ?? null;
}

export function isAllowedArchiveFilename(filename: string): boolean {
  return getArchiveFileExtension(filename) !== null;
}

function getUnsupportedExtensionLabel(filename: string): string {
  const lower = filename.toLowerCase();
  const compoundMatch = lower.match(/\.(tar\.(gz|bz2|xz)|tgz|tbz2|txz|zip|tar)$/);
  if (compoundMatch) {
    return compoundMatch[0];
  }

  const lastDot = lower.lastIndexOf(".");
  return lastDot >= 0 ? lower.slice(lastDot) : lower;
}

export function validateArchiveSourceFile(file: File): ArchiveSourceFileValidationError | null {
  if (!isAllowedArchiveFilename(file.name)) {
    return {
      code: "unsupported-format",
      extension: getUnsupportedExtensionLabel(file.name),
      maxSizeBytes: TEMPLATE_SOURCE_ARCHIVE_MAX_SIZE_BYTES,
    };
  }

  if (file.size > TEMPLATE_SOURCE_ARCHIVE_MAX_SIZE_BYTES) {
    return {
      code: "file-too-large",
      maxSizeBytes: TEMPLATE_SOURCE_ARCHIVE_MAX_SIZE_BYTES,
    };
  }

  return null;
}

export function formatArchiveSourceFileValidationError(
  error: ArchiveSourceFileValidationError,
  t: TranslateArchiveSourceFileValidationError
): string {
  if (error.code === "unsupported-format") {
    return t(`${I18N_PREFIX}.file-unsupported-format`, {
      extension: error.extension ?? "",
      formats: TEMPLATE_SOURCE_ARCHIVE_FORMATS_LABEL,
    });
  }

  return t(`${I18N_PREFIX}.file-too-large`, {
    maxSizeGb: TEMPLATE_SOURCE_ARCHIVE_MAX_SIZE_GB,
  });
}
