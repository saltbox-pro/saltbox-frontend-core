import type { TemplateSourcePublicSchema } from "@saltbox/saltbox-core-api-client";

export type SourceOperationProgressSnapshot = Pick<
  TemplateSourcePublicSchema,
  "current_operation" | "last_error" | "state"
>;

export type SourceBrokenRetryActionsSnapshot = Pick<
  TemplateSourcePublicSchema,
  "current_operation" | "synced_at"
>;
