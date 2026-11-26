import { notify } from "@saltbox/saltbox-frontend-common";
import type { TFunction } from "i18next";

import type { TaskBulkActionResult } from "../model/map-bulk-stop-result";

export const notifyBulkActionResult = (
  t: TFunction,
  { succeeded, failedTaskIds, skipped, notFoundTaskIds }: TaskBulkActionResult
) => {
  const title = t("tasks-bulk.result", {
    succeeded,
    failed: failedTaskIds.length,
    skipped,
    notFound: notFoundTaskIds.length,
  });

  const descriptionParts = [
    failedTaskIds.length > 0
      ? t("tasks-bulk.failed-tasks", { ids: failedTaskIds.join(", ") })
      : null,
    notFoundTaskIds.length > 0
      ? t("tasks-bulk.not-found-tasks", { ids: notFoundTaskIds.join(", ") })
      : null,
  ].filter(Boolean);

  if (failedTaskIds.length === 0 && notFoundTaskIds.length === 0) {
    if (succeeded === 0 && skipped > 0) {
      notify.warning(title);
      return;
    }
    if (succeeded === 0) {
      notify.info(title);
      return;
    }
    notify.success(title);
    return;
  }

  const toast = {
    title,
    description: descriptionParts.join("\n"),
  };

  if (succeeded === 0) {
    notify.error(toast);
    return;
  }

  notify.warning(toast);
};
