import type { SourceType } from "@saltbox/saltbox-core-api-client";

import {
  SOURCE_TYPE_LABEL_KEY_PREFIX,
  SOURCE_TYPE_TAG_COLORS,
} from "../constants/source-type-presentation";

export function getSourceTypeLabelKey(sourceType: SourceType): string {
  return `${SOURCE_TYPE_LABEL_KEY_PREFIX}${sourceType}`;
}

export function getSourceTypeColor(sourceType: SourceType): string {
  return SOURCE_TYPE_TAG_COLORS[sourceType] ?? "default";
}
