import type { TaskTemplatePublicSchema } from "@saltbox/saltbox-core-api-client";
import { isGlobalServerError } from "@saltbox/saltbox-frontend-common";
import { message } from "antd";
import type { TFunction } from "i18next";

import { isBgTaskFailedError } from "saltbox-core/shared/errors/bg-task-failed.error";
import { isBgTaskPollAborted } from "saltbox-core/shared/errors/bg-task-poll-aborted.error";
import { getBgTaskErrorMessage } from "saltbox-core/shared/helpers/get-bg-task-error-message";

export type DeleteTemplateItemParams = {
  template: Pick<TaskTemplatePublicSchema, "id" | "title">;
  onDelete: (templateId: string) => Promise<void>;
  onDeleteError?: () => Promise<void>;
  onSuccess?: () => void;
  t: TFunction;
};

export type DeleteTemplateItemResult = "success" | "cancelled" | "failed";

export async function deleteTemplateItem({
  template,
  onDelete,
  onDeleteError,
  onSuccess,
  t,
}: DeleteTemplateItemParams): Promise<DeleteTemplateItemResult> {
  try {
    await onDelete(template.id);
    message.success(
      t("configuration-templates.source.template-delete-success", {
        title: template.title,
      })
    );
    onSuccess?.();
    return "success";
  } catch (error) {
    if (isGlobalServerError(error) || isBgTaskPollAborted(error)) {
      return "cancelled";
    }

    if (isBgTaskFailedError(error)) {
      message.error(
        getBgTaskErrorMessage(error, t("configuration-templates.source.template-delete-error"))
      );
      await onDeleteError?.();
      return "failed";
    }

    console.error(error);
    message.error(t("configuration-templates.source.template-delete-error"));
    await onDeleteError?.();
    return "failed";
  }
}
