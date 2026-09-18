import type { JobSetTtlResponse } from "@saltbox/saltbox-core-api-client";
import { runMutation, type MutationResult } from "@saltbox/saltbox-frontend-common";

import { apiCoreStore } from "saltbox-core/store";

const callSetTtl = (
  jobId: string,
  ttl: number | null,
  minions: string[]
): Promise<JobSetTtlResponse> => {
  const jobsApi = apiCoreStore.jobsApi;
  if (!jobsApi) {
    throw new Error("Core API client is not initialized");
  }
  return jobsApi.jobSetTtl({ JobSetTtlBody: { job_id: jobId, ttl, minions } });
};

interface SetTtlParams {
  jobId: string;
  minions: string[];
  ttl: number | null;
  errorMessage: string;
}

export const setMinionsTtl = ({
  jobId,
  minions,
  ttl,
  errorMessage,
}: SetTtlParams): Promise<MutationResult<JobSetTtlResponse>> =>
  runMutation({
    run: () => callSetTtl(jobId, ttl, minions),
    errorMessage,
  });

export const setJobTtlForAll = ({
  jobId,
  minions,
  ttl,
  errorMessage,
}: SetTtlParams): Promise<MutationResult<JobSetTtlResponse>> =>
  runMutation({
    run: async () => {
      const response = await callSetTtl(jobId, ttl, []);
      if (minions.length > 0) {
        await callSetTtl(jobId, null, minions);
      }
      return response;
    },
    errorMessage,
  });
