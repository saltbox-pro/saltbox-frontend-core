import {
  stringifyMeta,
  type TemplateMeta,
} from "saltbox-core/features/task-template-editor/lib/template-meta";

function isPlainObject(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function hasTemplatePreviewMeta(meta: unknown): boolean {
  return isPlainObject(meta) && Object.keys(meta).length > 0;
}

export function formatTemplatePreviewMeta(meta: unknown): string {
  if (!hasTemplatePreviewMeta(meta)) {
    return "";
  }

  return stringifyMeta(meta as TemplateMeta);
}
