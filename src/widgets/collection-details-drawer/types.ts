import type { CollectionDetailSchema } from "@saltbox/saltbox-core-api-client";

export type CollectionDetailsDrawerOpenParams =
  | { mode: "view"; id: string; slug: string }
  | { mode: "create"; id: string; parentSlug: string }
  | {
      mode: "duplicate";
      id: string;
      sourceSlug: string;
      preloadedSource?: CollectionDetailSchema;
    };

export type CollectionEditFormType = {
  title: string;
  description?: string;
  parent_slug: string;
};

export type CollectionCreateDraft = {
  title: string;
  description: string;
  parent_slug: string;
  query: object;
};
