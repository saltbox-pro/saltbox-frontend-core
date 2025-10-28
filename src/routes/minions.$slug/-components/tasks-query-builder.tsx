import { observer } from "mobx-react-lite";
import { SaltBoxQueryBuilderContainer, SaltBoxJobValueEditor } from "@saltbox/saltbox-frontend-common";
import { TasksFilterStore } from "saltbox-core/store";

export const TasksQueryBuilder = observer(
  (props: { filterStore: TasksFilterStore, onSearchButtonClick?: () => void, onResetButtonClick?: () => void }) => {

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
