import { SaltBoxQueryBuilderContainer } from "@saltbox/saltbox-frontend-common";
import { observer } from "mobx-react-lite";

import { CoreJobReturnValueEditor } from "saltbox-core/shared/components/query-builder-salt-box/core-job-return-value-editor";
import { JobFilterStore, JobStore } from "saltbox-core/store";

export const JobReturnsQueryBuilder = observer(
  (props: {
    filterStore: JobFilterStore;
    jobStore?: JobStore;
    onSearchButtonClick?: () => void;
    onResetButtonClick?: () => void;
  }) => {
    return (
      <SaltBoxQueryBuilderContainer
        filterStore={props.filterStore}
        onSearchButtonClick={props.onSearchButtonClick}
        onResetButtonClick={props.onResetButtonClick}
        controlElements={{
          valueEditor: CoreJobReturnValueEditor(props.jobStore),
        }}
      />
    );
  }
);
