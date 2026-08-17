import {
  canRenderInVisualEditor,
  type VisualEditorCompatibilityResult,
} from "@saltbox/react-jsonschema-form-generator";

import { extractParamsFormSchema } from "./params-subtree";
import type { TemplateMeta } from "./template-meta";

/**
 * Держим отдельно от `params-subtree`: расчёт путей — чистая логика без
 * зависимости от ESM-сборки генератора, её можно тестировать напрямую.
 */
export function getParamsCompatibility(
  meta: TemplateMeta,
  fun?: string
): VisualEditorCompatibilityResult {
  return canRenderInVisualEditor(extractParamsFormSchema(meta, fun));
}
