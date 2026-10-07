import { FastTable, PageHeader } from "@saltbox/saltbox-frontend-common";
import type { TFunction } from "i18next";
import { observer } from "mobx-react-lite";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { useLocation, useNavigate } from "react-router";

import { CreateJobButton } from "saltbox-core/features/job-modal";
import { JobDatetimeRangeSelector } from "saltbox-core/shared/components/jobs/job-datetime-range-selector";
import { JobsQueryBuilder } from "saltbox-core/shared/components/jobs/jobs-query-builder";
import { JobsTable } from "saltbox-core/shared/components/jobs/table";
import { useSaltTargetTypes } from "saltbox-core/shared/conf/salt-target-types";
import { getJobsFilterSchema } from "saltbox-core/shared/constants/filter-schemas";
import { JobFilterStore, JobsStore } from "saltbox-core/store";

import styles from "./index.module.css";

function isPlainObject(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function isEmptyObject(value: unknown): boolean {
  return isPlainObject(value) && Object.keys(value).length === 0;
}

const useJobFilters = (t: TFunction) => {
  const saltTargetTypes = useSaltTargetTypes();
  const location = useLocation();

  const filterSchema = useMemo(() => getJobsFilterSchema(t, saltTargetTypes), [saltTargetTypes, t]);

  const storageKey = `jobsFilter:${location.pathname}`;

  const [jobFilterStore] = useState(new JobFilterStore(filterSchema, storageKey));

  useEffect(() => {
    jobFilterStore.updateFilterSchema(filterSchema);
  }, [filterSchema, jobFilterStore]);

  return {
    jobFilterStore,
  };
};

const JobsPage = observer(() => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const location = useLocation();

  const { jobFilterStore } = useJobFilters(t);
  const [jobsStore] = useState(new JobsStore(jobFilterStore));
  const didInitFromLocationRef = useRef(false);
  const [isFilterButtonClick, setIsFilterButtonClick] = useState(false);

  const handleCellFilterClick = useCallback(() => {
    setIsFilterButtonClick(true);
  }, []);

  useEffect(() => {
    if (didInitFromLocationRef.current) {
      return;
    }

    const stateQuery = location.state;
    if (isPlainObject(stateQuery)) {
      jobFilterStore.initializeByQuery(stateQuery);
      navigate(location.pathname, { replace: true, state: null });
    }

    jobsStore.syncDateRangeWithAppliedFilters();

    const parsedQuery = jobFilterStore.searchMongoDBQuery;
    jobsStore.mongoDBQuery =
      isPlainObject(stateQuery) && !isEmptyObject(stateQuery) && isEmptyObject(parsedQuery)
        ? stateQuery
        : parsedQuery;
    jobsStore.loadJobs();
    didInitFromLocationRef.current = true;
  }, [jobFilterStore, jobsStore, location.pathname, location.state, navigate]);

  const handleSearchButtonClick = () => {
    jobsStore.syncDateRangeWithAppliedFilters();
    jobsStore.mongoDBQuery = jobFilterStore.searchMongoDBQuery;
    jobsStore.handleSearch();
  };

  const handleResetButtonClick = () => {
    jobFilterStore.handleResetFilters();
    jobsStore.syncDateRangeWithAppliedFilters();
    jobsStore.mongoDBQuery = jobFilterStore.searchMongoDBQuery;
    jobsStore.handleSearch();
  };

  return (
    <>
      <PageHeader title={t("jobs.title")} />

      <JobsQueryBuilder
        filterStore={jobFilterStore}
        jobsStore={jobsStore}
        onSearchButtonClick={handleSearchButtonClick}
        onResetButtonClick={handleResetButtonClick}
        isFilterButton={isFilterButtonClick}
        onFilterButtonApplied={() => setIsFilterButtonClick(false)}
      />

      <FastTable.Provider>
        <div className="page-actions-buttons">
          <div className={styles.leftGroup}>
            <CreateJobButton />
          </div>
          <div className={styles.rightGroup}>
            <JobDatetimeRangeSelector
              label={t("jobs.date-range-label")}
              value={jobsStore.dateRangePreset}
              disabled={jobsStore.isJobsLoading}
              onChange={jobsStore.handleDateRangeChange}
            />
            <FastTable.Toolbar />
          </div>
        </div>

        <JobsTable
          store={jobsStore}
          tableId="core-jobs"
          onCellFilterClick={handleCellFilterClick}
        />
      </FastTable.Provider>
    </>
  );
});

export default JobsPage;
