import type { SourceListWithExtrasSchema } from "@saltbox/saltbox-core-api-client";

export type RefreshSourceResult =
  | { status: "found"; source: SourceListWithExtrasSchema }
  | { status: "not_found" }
  | { status: "failed" };
