import {
  SourceState,
  SourceType,
  type TemplateSourcePublicSchema,
} from "@saltbox/saltbox-core-api-client";

import {
  getSourceActionContext,
  isSourceOperationInProgress,
} from "../../shared/helpers/source-action-progress";
import type { SourceActionState } from "../../shared/types/source-action";

type ManageTemplatesSource = Pick<
  TemplateSourcePublicSchema,
  "id" | "state" | "source_type" | "current_operation" | "last_error"
>;

function isSourceReadable(source: Pick<TemplateSourcePublicSchema, "state">): boolean {
  return source.state === SourceState.Plugged || source.state === SourceState.Active;
}

function isSourceFree(
  source: Pick<TemplateSourcePublicSchema, "id" | "state" | "current_operation" | "last_error">,
  actionState?: SourceActionState
): boolean {
  if (isSourceOperationInProgress(source)) {
    return false;
  }

  if (actionState) {
    const { actionKind } = getSourceActionContext(actionState, source.id);
    if (actionKind !== null) {
      return false;
    }
  }

  return true;
}

/** Показывать ли блок действий над шаблонами источника. */
export function canShowManageTemplatesControls(
  source: Pick<TemplateSourcePublicSchema, "state">
): boolean {
  return isSourceReadable(source);
}

/**
 * Показывать ли кнопку создания шаблона — только для локальных (редактируемых)
 * источников в читаемом состоянии (доступность кнопки гейтится отдельно).
 */
export function canShowCreateTemplateButton(
  source: Pick<TemplateSourcePublicSchema, "state" | "source_type">
): boolean {
  return source.source_type === SourceType.LocalBundle && isSourceReadable(source);
}

/**
 * Создание и редактирование шаблонов доступны только для локальных (редактируемых)
 * источников, которые сейчас не заняты операцией.
 */
export function canEditSourceTemplates(
  source: ManageTemplatesSource,
  actionState?: SourceActionState
): boolean {
  if (source.source_type !== SourceType.LocalBundle) {
    return false;
  }

  if (!isSourceReadable(source)) {
    return false;
  }

  return isSourceFree(source, actionState);
}

/**
 * Дублирование доступно для шаблонов любого читаемого источника — целевой
 * локальный источник пользователь выбирает в модалке сохранения.
 */
export function canDuplicateSourceTemplate(
  source: ManageTemplatesSource,
  actionState?: SourceActionState
): boolean {
  if (!isSourceReadable(source)) {
    return false;
  }

  return isSourceFree(source, actionState);
}
