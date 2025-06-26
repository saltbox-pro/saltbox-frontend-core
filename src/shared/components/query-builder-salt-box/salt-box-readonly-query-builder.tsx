import { useTranslation } from "react-i18next";
import QueryBuilder from "react-querybuilder";
import { toJS } from "mobx";
import { observer } from "mobx-react-lite";
import { Spin } from "antd";
import { FilterStore } from "saltbox-core/store";
import { QueryBuilderSaltBox } from "./query-builder-salt-box";
import styles from "./salt-box-readonly-query-builder.module.css";
import { SaltBoxReadonlyValueEditor } from "./salt-box-readonly-value-editor";
import { SaltBoxReadonlyValueSelector } from "./salt-box-readonly-value-selector";

type SaltBoxReadonlyQueryBuilderProps = {
  filterStore: FilterStore;
};

const EmptyActionElement = () => null;

export const SaltBoxReadonlyQueryBuilder = observer(
  (props: SaltBoxReadonlyQueryBuilderProps) => {
    const { t } = useTranslation();
    return (
      <div className={styles.queryBuilderContainer}>
        <Spin spinning={props.filterStore.isLoading}>
          <QueryBuilderSaltBox>
            <QueryBuilderSaltBox>
              <QueryBuilder
                fields={toJS(props.filterStore.filterSchema)}
                query={toJS(props.filterStore.currentFilters)}
                controlClassnames={{
                  queryBuilder: `${styles.queryBuilder} queryBuilder-branches`,
                  ruleGroup: "readonly-rule-group",
                  rule: "readonly-rule",
                }}
                controlElements={{
                  valueEditor: SaltBoxReadonlyValueEditor,
                  valueSelector: SaltBoxReadonlyValueSelector,
                  addGroupAction: EmptyActionElement,
                  addRuleAction: EmptyActionElement,
                  removeRuleAction: EmptyActionElement,
                  removeGroupAction: EmptyActionElement,
                }}
              />
            </QueryBuilderSaltBox>
          </QueryBuilderSaltBox>
        </Spin>
      </div>
    );
  }
);
