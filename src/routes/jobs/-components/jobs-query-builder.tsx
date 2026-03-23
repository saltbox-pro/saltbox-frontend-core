import { SaltBoxQueryBuilderContainer } from "@saltbox/saltbox-frontend-common";
import { observer } from "mobx-react-lite";

import { CoreJobValueEditor } from "saltbox-core/shared/components/query-builder-salt-box/core-job-value-editor";
import { JobFilterStore, JobsStore } from "saltbox-core/store";

export const JobsQueryBuilder = observer(
  (props: {
    filterStore: JobFilterStore;
    jobsStore?: JobsStore;
    onSearchButtonClick?: () => void;
    onResetButtonClick?: () => void;
  }) => {
    return (
      <SaltBoxQueryBuilderContainer
        filterStore={props.filterStore}
        onSearchButtonClick={props.onSearchButtonClick}
        onResetButtonClick={props.onResetButtonClick}
        controlElements={{
          valueEditor: CoreJobValueEditor(props.jobsStore),
        }}
      />
    );
  }
);
