import { SaltBoxQueryBuilderContainer } from "@saltbox/saltbox-frontend-common";
import { observer } from "mobx-react-lite";
import { useEffect } from "react";

import { CoreJobValueEditor } from "saltbox-core/shared/components/query-builder-salt-box/core-job-value-editor";
import { JobFilterStore, JobsStore } from "saltbox-core/store";

export const JobsQueryBuilder = observer(
  (props: {
    filterStore: JobFilterStore;
    jobsStore?: JobsStore;
    onSearchButtonClick?: () => void;
    onResetButtonClick?: () => void;
    isFilterButton?: boolean;
    onFilterButtonApplied?: () => void;
  }) => {
    useEffect(() => {
      if (props.isFilterButton && props.onFilterButtonApplied) {
        props.onFilterButtonApplied();
      }
    }, [props.isFilterButton, props.onFilterButtonApplied]);

    return (
      <SaltBoxQueryBuilderContainer
        filterStore={props.filterStore}
        onSearchButtonClick={props.onSearchButtonClick}
        onResetButtonClick={props.onResetButtonClick}
        isFilterButton={props.isFilterButton}
        controlElements={{
          valueEditor: CoreJobValueEditor(props.jobsStore),
        }}
      />
    );
  }
);
