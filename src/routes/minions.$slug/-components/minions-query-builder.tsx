import { observer } from "mobx-react-lite";
import { SaltBoxMinionValueEditor } from "saltbox-core/shared/components/query-builder-salt-box/salt-box-minion-value-editor";
import { SaltBoxMinionValueSelector } from "saltbox-core/shared/components/query-builder-salt-box/salt-box-minion-value-selector";
import { SaltBoxQueryBuilderContainer } from "saltbox-core/shared/components/query-builder-salt-box/salt-box-query-builder-container";
import { MinionFilterStore } from "saltbox-core/store";

export const MinionsQueryBuilder = observer(
  (props: { slug: string; filterStore: MinionFilterStore }) => {
    return (
      <SaltBoxQueryBuilderContainer
        filterStore={props.filterStore}
        additionalButtons={null}
        controlElements={{
          valueEditor: SaltBoxMinionValueEditor(props.slug),
          valueSelector: SaltBoxMinionValueSelector,
        }}
      />
    );
  }
);
