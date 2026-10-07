import { useCallback, useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";

import { useSaltTargetTypes } from "saltbox-core/shared/conf/salt-target-types";
import { getJobsFilterSchema } from "saltbox-core/shared/constants/filter-schemas";
import { JobFilterStore, JobsStore } from "saltbox-core/store";

export function useMasterJobsTab(masterId: string) {
  const { t } = useTranslation();
  const saltTargetTypes = useSaltTargetTypes();

  const filterSchema = useMemo(
    () => getJobsFilterSchema(t, saltTargetTypes, { includeSaltMaster: false }),
    [saltTargetTypes, t]
  );

  const [jobFilterStore] = useState(() => new JobFilterStore(filterSchema, "masterJobsFilter"));
  const [jobsStore] = useState(() => new JobsStore(jobFilterStore, { saltMaster: masterId }));
  const [isFilterButtonClick, setIsFilterButtonClick] = useState(false);

  useEffect(() => {
    jobFilterStore.updateFilterSchema(filterSchema);
  }, [filterSchema, jobFilterStore]);

  useEffect(() => {
    jobsStore.syncDateRangeWithAppliedFilters();
    jobsStore.mongoDBQuery = jobFilterStore.searchMongoDBQuery;
    jobsStore.loadJobs();
  }, [jobFilterStore, jobsStore]);

  const handleSearchButtonClick = useCallback(() => {
    jobsStore.syncDateRangeWithAppliedFilters();
    jobsStore.mongoDBQuery = jobFilterStore.searchMongoDBQuery;
    jobsStore.handleSearch();
  }, [jobFilterStore, jobsStore]);

  const handleResetButtonClick = useCallback(() => {
    jobFilterStore.handleResetFilters();
    jobsStore.syncDateRangeWithAppliedFilters();
    jobsStore.mongoDBQuery = jobFilterStore.searchMongoDBQuery;
    jobsStore.handleSearch();
  }, [jobFilterStore, jobsStore]);

  const handleCellFilterClick = useCallback(() => {
    setIsFilterButtonClick(true);
  }, []);

  const handleFilterButtonApplied = useCallback(() => {
    setIsFilterButtonClick(false);
  }, []);

  return {
    jobFilterStore,
    jobsStore,
    isFilterButtonClick,
    handleSearchButtonClick,
    handleResetButtonClick,
    handleCellFilterClick,
    handleFilterButtonApplied,
  };
}
