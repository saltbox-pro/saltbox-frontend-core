import { moveTemplateLabelsToRoot } from "./root-labels";
import { normalizeSecretPaths } from "./secret-pillars";
import type { TemplateMeta } from "./template-meta";

/**
 * Приводит схему открытого шаблона к текущему формату:
 * - название и описание переезжают из `ui_schema` в корень `meta`;
 * - `secret_pillars` теряет путь по схеме и хранит имена параметров.
 *
 * Правки живут в памяти редактора и уезжают на бекенд только при сохранении,
 * поэтому старый шаблон, который просто посмотрели, остаётся как был.
 */
export function migrateMetaFormat(meta: TemplateMeta, fun?: string): TemplateMeta {
  return normalizeSecretPaths(moveTemplateLabelsToRoot(meta), fun);
}
