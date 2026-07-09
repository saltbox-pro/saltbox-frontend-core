import { getSyncErrorDetail, resolveSyncErrorKind, type SyncErrorKind } from "./sync-error-detail";

export type MountedSyncErrorKind = SyncErrorKind;

export const resolveMountedSyncErrorKind = resolveSyncErrorKind;

export const getMountedSyncErrorMessageKey = (error: MountedSyncErrorKind): string => {
  switch (error) {
    case "failed":
      return "configuration-templates.sync-mounted-sources-failed";
    default:
      return "configuration-templates.sync-mounted-sources-error";
  }
};

export const getMountedSyncErrorDetail = getSyncErrorDetail;
