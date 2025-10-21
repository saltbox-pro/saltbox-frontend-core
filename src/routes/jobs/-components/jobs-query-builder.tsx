import { observer } from "mobx-react-lite";
import { SaltBoxJobValueEditor } from "saltbox-core/shared/components/query-builder-salt-box/salt-box-job-value-editor";
import { SaltBoxQueryBuilderContainer } from "saltbox-core/shared/components/query-builder-salt-box/salt-box-query-builder-container";
import { JobFilterStore } from "saltbox-core/store";

export const JobsQueryBuilder = observer(
  (props: { filterStore: JobFilterStore, onSearchButtonClick?: () => void, onResetButtonClick?: () => void }) => {
    return (
      <SaltBoxQueryBuilderContainer
        filterStore={props.filterStore}
        onSearchButtonClick={props.onSearchButtonClick}
        onResetButtonClick={props.onResetButtonClick}
        controlElements={{
          valueEditor: SaltBoxJobValueEditor,
        }}
      />
    );
  },
);
