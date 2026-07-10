import {
  getSyncErrorDetail,
  resolveSyncErrorKind,
  type SyncErrorKind,
} from "../../shared/helpers/sync-error-detail";

export type GitlabSyncErrorKind = SyncErrorKind;

export const resolveGitlabSyncErrorKind = resolveSyncErrorKind;

export const getGitlabSyncErrorMessageKey = (error: GitlabSyncErrorKind): string => {
  switch (error) {
    case "failed":
      return "configuration-templates.sync-gitlab-sources-failed";
    default:
      return "configuration-templates.sync-gitlab-sources-error";
  }
};

export const getGitlabSyncErrorDetail = getSyncErrorDetail;
