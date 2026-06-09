import { BgTaskFailedError } from "../../shared/errors/bg-task-failed.error";

export type GitlabSyncErrorKind = "failed" | "error";

export const resolveGitlabSyncErrorKind = (reason: unknown): GitlabSyncErrorKind => {
  if (reason instanceof BgTaskFailedError) {
    return "failed";
  }

  return "error";
};

export const getGitlabSyncErrorMessageKey = (error: GitlabSyncErrorKind): string => {
  switch (error) {
    case "failed":
      return "configuration-templates.sync-gitlab-sources-failed";
    default:
      return "configuration-templates.sync-gitlab-sources-error";
  }
};

export const getGitlabSyncErrorDetail = (reason: unknown): string | null => {
  if (reason instanceof BgTaskFailedError && reason.message !== "BG_TASK_FAILED") {
    return reason.message;
  }

  return null;
};
