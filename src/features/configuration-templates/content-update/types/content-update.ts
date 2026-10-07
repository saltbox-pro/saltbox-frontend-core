import type {
  SourceType,
  TaskListResponseSchema,
  TaskTemplatePublicSchema,
} from "@saltbox/saltbox-core-api-client";

export type ContentUpdateChangeType = "A" | "D" | "M" | "R" | "C" | "T" | "U";

export type ContentUpdateFile = {
  path: string;
  change_type: ContentUpdateChangeType;
  checksum: string | null;
};

export type ContentUpdateCheckResult = {
  token: string;
  files: ContentUpdateFile[];
  templates: TaskTemplatePublicSchema[];
  dependant_tasks: TaskListResponseSchema[];
};

export type ContentUpdateApplyResult = {
  stopped_tasks: string[];
};

export type ContentUpdatableSourceType =
  | typeof SourceType.GitRepo
  | typeof SourceType.ArchiveBundle;

export type ContentUpdateCheckRequest =
  | { sourceType: typeof SourceType.GitRepo }
  | { sourceType: typeof SourceType.ArchiveBundle; file: File };

export type ContentUpdateApplyRequest = {
  sourceType: ContentUpdatableSourceType;
  token: string;
  stopDependents: boolean;
};
