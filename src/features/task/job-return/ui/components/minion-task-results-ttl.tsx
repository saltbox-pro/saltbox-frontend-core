import type { JobReturnModel } from "@saltbox/saltbox-core-api-client";
import { Flex, Typography } from "antd";
import { type SyntheticEvent, useCallback } from "react";
import { useTranslation } from "react-i18next";

import { EditableTtl, setMinionsTtl, useJobTtlSource } from "saltbox-core/features/job-ttl";
import {
  isJobReturnTtlEditable,
  resolveEffectiveTtl,
} from "saltbox-core/shared/utils/job-ttl-utils";

export interface MinionTaskResultsTtlProps {
  jobReturn: JobReturnModel;
  onTtlApplied: (jobReturnId: string, ttl: number | null) => void;
}

const stopPropagation = (event: SyntheticEvent) => {
  event.stopPropagation();
};

export function MinionTaskResultsTtl({ jobReturn, onTtlApplied }: MinionTaskResultsTtlProps) {
  const { t } = useTranslation();
  const { job } = useJobTtlSource(jobReturn.job_id);
  const { seconds, isInherited } = resolveEffectiveTtl(jobReturn.ttl, job?.ttl);

  const handleSubmit = useCallback(
    async (ttlSeconds: number | null) => {
      const result = await setMinionsTtl({
        jobId: jobReturn.job_id,
        minions: [jobReturn.minion_id],
        ttl: ttlSeconds,
        errorMessage: t("jobs.ttl-update-error"),
      });

      if (result.ok) {
        onTtlApplied(jobReturn.id, ttlSeconds);
      }

      return result.ok;
    },
    [jobReturn.id, jobReturn.job_id, jobReturn.minion_id, onTtlApplied, t]
  );

  return (
    <Flex
      align="center"
      gap={4}
      role="presentation"
      onClick={stopPropagation}
      onKeyDown={stopPropagation}
    >
      <Typography.Text type="secondary">{t("task.job-returns-table.table-ttl")}:</Typography.Text>
      <EditableTtl
        value={seconds}
        isInherited={isInherited}
        allowInherit
        disabled={!isJobReturnTtlEditable(jobReturn)}
        editButtonAlwaysVisible
        onSubmit={handleSubmit}
      />
    </Flex>
  );
}
