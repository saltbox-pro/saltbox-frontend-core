import { SourceType } from "@saltbox/saltbox-core-api-client";

export const SOURCE_TYPE_LABEL_KEY_PREFIX = "configuration-templates.source.type." as const;

export const SOURCE_TYPE_TAG_COLORS: Partial<Record<SourceType, string>> = {
  [SourceType.LocalBundle]: "blue",
  [SourceType.GitRepo]: "orange",
  [SourceType.ArchiveBundle]: "purple",
};
