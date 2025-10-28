import { SaltBoxMinionValueSelector, SaltBoxQueryBuilderContainer } from "@saltbox/saltbox-frontend-common";
import { observer } from "mobx-react-lite";
import { CoreMinionValueEditor } from "saltbox-core/shared/components/query-builder-salt-box/core-minion-value-editor";
import { MinionFilterStore } from "saltbox-core/store";

export const MinionsQueryBuilder = observer(
  (props: { slug: string; filterStore: MinionFilterStore }) => {
    return (
      <SaltBoxQueryBuilderContainer
        filterStore={props.filterStore}
        additionalButtons={null}
        controlElements={{
          valueEditor: CoreMinionValueEditor(props.slug),
          valueSelector: SaltBoxMinionValueSelector,
        }}
      />
    );
  }
);
