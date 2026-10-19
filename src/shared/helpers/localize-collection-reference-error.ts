import type { CollectionFlatListItemSchema } from "@saltbox/saltbox-core-api-client";
import type { AppError } from "@saltbox/saltbox-frontend-common";
import type { TFunction } from "i18next";

import { buildCollectionLabelBySlug } from "saltbox-core/shared/helpers/collection-filter-field";

type CollectionReferenceErrorRule = {
  status: number;
  prefix: string;
  separator: string;
  messageKey: string;
  joinWith: string;
  param: string;
};

const COLLECTION_REFERENCE_ERROR_RULES: CollectionReferenceErrorRule[] = [
  {
    status: 400,
    prefix: "Collection query references unknown collections: ",
    separator: ", ",
    messageKey: "collection.error-unknown-references",
    joinWith: ", ",
    param: "collections",
  },
  {
    status: 400,
    prefix: "Collection references form a cycle: ",
    separator: " -> ",
    messageKey: "collection.error-reference-cycle",
    joinWith: " → ",
    param: "path",
  },
  {
    status: 409,
    prefix: "Collection is referenced by other collections: ",
    separator: ", ",
    messageKey: "collection.error-referenced-by-collections",
    joinWith: ", ",
    param: "collections",
  },
];

export function localizeCollectionReferenceError(
  error: AppError,
  t: TFunction,
  collections: ReadonlyArray<CollectionFlatListItemSchema>
): AppError {
  const serverMessage = error.serverMessage;
  if (!serverMessage) {
    return error;
  }

  const rule = COLLECTION_REFERENCE_ERROR_RULES.find(
    (candidate) => candidate.status === error.status && serverMessage.startsWith(candidate.prefix)
  );
  if (!rule) {
    return error;
  }

  const labelBySlug = buildCollectionLabelBySlug(collections);
  const titles = serverMessage
    .slice(rule.prefix.length)
    .split(rule.separator)
    .map((slug) => slug.trim())
    .filter(Boolean)
    .map((slug) => labelBySlug.get(slug) ?? slug);

  return {
    ...error,
    serverMessage: t(rule.messageKey, { [rule.param]: titles.join(rule.joinWith) }),
  };
}
