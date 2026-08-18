import type { CreateJobRequestTgtTypeEnum } from "@saltbox/saltbox-core-api-client";

export type JobReturnToPickerSnapshot = {
  salt_master: string;
  tgt: string;
  tgt_type: CreateJobRequestTgtTypeEnum;
  jsonFormData: unknown;
  ttlSeconds?: number;
};

export type JobModalTargeting = {
  target: string;
  targetType: CreateJobRequestTgtTypeEnum;
  defaultMaster: string;
  ttlSeconds?: number;
};

export type JobReplayBaseline = {
  fun: string;
  arg?: unknown[];
  kwarg?: Record<string, unknown>;
};
