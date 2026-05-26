import type { CreateJobRequestTgtTypeEnum } from "@saltbox/saltbox-core-api-client";

export type JobConfigurationData = {
  tgt: string;
  tgt_type: CreateJobRequestTgtTypeEnum;
  salt_master: string;
  jsonFormValue: Record<string, unknown>;
  ttlSeconds?: number;
};

export type JobTargetingFormData = Pick<JobConfigurationData, "tgt" | "tgt_type" | "salt_master">;

export type JobMasterOption = {
  value: string;
  label: string;
};

export const JobModalTabKey = {
  Settings: "Settings",
  Overview: "Overview",
} as const;

export type JobModalTabKey = (typeof JobModalTabKey)[keyof typeof JobModalTabKey];
