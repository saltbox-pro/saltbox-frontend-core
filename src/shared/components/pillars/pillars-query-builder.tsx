import {
  SaltBoxOptionsValueEditor,
  SaltBoxQueryBuilderContainer,
} from "@saltbox/saltbox-frontend-common";
import { observer } from "mobx-react-lite";

import type { PillarsFilterStore } from "saltbox-core/store";

export const PillarsQueryBuilder = observer(
  (props: {
    filterStore: PillarsFilterStore;
    onSearchButtonClick?: () => void;
    onResetButtonClick?: () => void;
  }) => {
    return (
      <SaltBoxQueryBuilderContainer
        filterStore={props.filterStore}
        onSearchButtonClick={props.onSearchButtonClick}
        onResetButtonClick={props.onResetButtonClick}
        controlElements={{
          valueEditor: SaltBoxOptionsValueEditor,
        }}
      />
    );
  }
);
