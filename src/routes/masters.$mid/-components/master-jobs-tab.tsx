import { FastTable } from "@saltbox/saltbox-frontend-common";
import { Flex } from "antd";
import { observer } from "mobx-react-lite";
import { useTranslation } from "react-i18next";

import { CreateJobButton } from "saltbox-core/features/job-modal";
import { JobDatetimeRangeSelector } from "saltbox-core/shared/components/jobs/job-datetime-range-selector";
import { JobsQueryBuilder } from "saltbox-core/shared/components/jobs/jobs-query-builder";
import { JobsTable } from "saltbox-core/shared/components/jobs/table";

import styles from "./master-jobs-tab.module.css";
import { useMasterJobsTab } from "./use-master-jobs-tab";

type MasterJobsTabProps = {
  masterId: string;
};

export const MasterJobsTab = observer(function MasterJobsTab({ masterId }: MasterJobsTabProps) {
  const { t } = useTranslation();
  const {
    jobFilterStore,
    jobsStore,
    isFilterButtonClick,
    handleSearchButtonClick,
    handleResetButtonClick,
    handleCellFilterClick,
    handleFilterButtonApplied,
  } = useMasterJobsTab(masterId);

  return (
    <Flex className={styles.tabWrapper} vertical>
      <JobsQueryBuilder
        filterStore={jobFilterStore}
        jobsStore={jobsStore}
        onSearchButtonClick={handleSearchButtonClick}
        onResetButtonClick={handleResetButtonClick}
        isFilterButton={isFilterButtonClick}
        onFilterButtonApplied={handleFilterButtonApplied}
      />

      <FastTable.Provider>
        <div className="page-actions-buttons">
          <div className={styles.leftGroup}>
            <CreateJobButton fixedMaster={masterId} />
          </div>
          <div className={styles.rightGroup}>
            <JobDatetimeRangeSelector
              label={t("jobs.date-range-label")}
              value={jobsStore.dateRangePreset}
              disabled={jobsStore.isJobsLoading}
              onChange={(createdSince, preset) => {
                jobsStore.handleDateRangeChange(createdSince, preset);
              }}
            />
            <FastTable.Toolbar />
          </div>
        </div>

        <JobsTable
          store={jobsStore}
          tableId="core-master-jobs"
          hideMasterColumn
          onCellFilterClick={handleCellFilterClick}
        />
      </FastTable.Provider>
    </Flex>
  );
});
