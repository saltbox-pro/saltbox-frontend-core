import type { JobModel } from "@saltbox/saltbox-core-api-client";
import { useEffect, useState } from "react";

import { apiCoreStore } from "saltbox-core/store";

export interface JobTtlSource {
  job: JobModel | null;
  isLoading: boolean;
}

export function useJobTtlSource(jobId: string | null | undefined): JobTtlSource {
  const [job, setJob] = useState<JobModel | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    setJob(null);

    const jobsApi = apiCoreStore.jobsApi;
    if (!jobId || !jobsApi) {
      return;
    }

    const controller = new AbortController();
    setIsLoading(true);

    jobsApi
      .jobRetrieve({ job_id: jobId }, { signal: controller.signal })
      .then((loadedJob) => {
        if (!controller.signal.aborted) {
          setJob(loadedJob);
        }
      })
      .catch((error) => {
        if (!controller.signal.aborted) {
          console.error("useJobTtlSource:", error);
        }
      })
      .finally(() => {
        if (!controller.signal.aborted) {
          setIsLoading(false);
        }
      });

    return () => controller.abort();
  }, [jobId]);

  return { job, isLoading };
}
