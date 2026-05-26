import type { CreateJobRequestTgtTypeEnum } from "@saltbox/saltbox-core-api-client";

export type JobConfigurationData = {
  tgt: string;
  tgt_type: CreateJobRequestTgtTypeEnum;
  salt_master: string;
  jsonFormValue: Record<string, unknown>;
  ttlSeconds?: number;
};
