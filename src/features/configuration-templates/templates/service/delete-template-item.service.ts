import type { TaskTemplatePublicSchema } from "@saltbox/saltbox-core-api-client";
import { notify, runMutation } from "@saltbox/saltbox-frontend-common";
import type { TFunction } from "i18next";

import { isBgTaskPollAborted } from "saltbox-core/shared/errors/bg-task-poll-aborted.error";

export type DeleteTemplateItemParams = {
  template: Pick<TaskTemplatePublicSchema, "id">;
  templateTitle: string;
  onDelete: (templateId: string) => Promise<void>;
  onDeleteError?: () => Promise<void>;
  onSuccess?: () => void;
  t: TFunction;
};

export type DeleteTemplateItemResult = "success" | "cancelled" | "failed";

export async function deleteTemplateItem({
  template,
  templateTitle,
  onDelete,
  onDeleteError,
  onSuccess,
  t,
}: DeleteTemplateItemParams): Promise<DeleteTemplateItemResult> {
  const result = await runMutation({
    run: () => onDelete(template.id),
    errorMessage: t("configuration-templates.source.template-delete-error"),
  });

  if (result.ok === false) {
    if (isBgTaskPollAborted(result.error.raw)) {
      return "cancelled";
    }

    await onDeleteError?.();
    return "failed";
  }

  notify.success(
    t("configuration-templates.source.template-delete-success", {
      title: templateTitle,
    })
  );
  onSuccess?.();
  return "success";
}
