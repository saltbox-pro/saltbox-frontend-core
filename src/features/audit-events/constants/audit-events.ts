import {
  type AuditEventListBody,
  AuditSeverity,
  AuditStatus,
  SortOrder,
} from "@saltbox/saltbox-audit-api-client";

export const AUDIT_EVENTS_SORT: NonNullable<AuditEventListBody["sort"]> = {
  created: SortOrder.NUMBER_MINUS_1,
  _id: SortOrder.NUMBER_MINUS_1,
};

export const AUDIT_EVENTS_PAGE_SIZES = [20, 50, 100];

export const DEFAULT_AUDIT_EVENTS_PAGE_SIZE = 50;

export const AUDIT_SEVERITY_TAG_COLOR: Record<AuditSeverity, string> = {
  [AuditSeverity.Info]: "default",
  [AuditSeverity.Low]: "blue",
  [AuditSeverity.Medium]: "gold",
  [AuditSeverity.High]: "orange",
  [AuditSeverity.Critical]: "red",
};

export const AUDIT_STATUS_TAG_COLOR: Record<AuditStatus, string> = {
  [AuditStatus.Success]: "green",
  [AuditStatus.Failure]: "red",
  [AuditStatus.Denied]: "orange",
  [AuditStatus.Blocked]: "magenta",
};
