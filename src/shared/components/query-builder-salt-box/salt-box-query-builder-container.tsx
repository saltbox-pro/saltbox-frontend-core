import { ReactElement } from "react";
import * as ReactDnD from "react-dnd";
import * as ReactDndHtml5Backend from "react-dnd-html5-backend";
import { useTranslation } from "react-i18next";
import QueryBuilder, {
  ValueEditorProps,
  ValueSelectorProps,
} from "react-querybuilder";
import { QueryBuilderDnD } from "@react-querybuilder/dnd";
import { toJS } from "mobx";
import { observer } from "mobx-react-lite";
import { Button, Flex, Spin } from "antd";
import { SearchOutlined } from "@ant-design/icons";
import { FilterStore } from "saltbox-core/store";
import { QueryBuilderSaltBox } from "./query-builder-salt-box";
import styles from "./salt-box-query-builder-container.module.css";
import { MatIcon } from "saltbox-core/shared/components/mat-icon/mat-icon";

type SaltBoxQueryBuilderContainerProps = {
  filterStore: FilterStore;
  additionalButtons?: ReactElement;
  controlElements?: {
    valueEditor?: (props: ValueEditorProps) => JSX.Element;
    valueSelector?: (props: ValueSelectorProps) => JSX.Element;
  };
};

export const SaltBoxQueryBuilderContainer = observer(
  (props: SaltBoxQueryBuilderContainerProps) => {
    const { t } = useTranslation();
    return (
      <div className={styles.queryBuilderContainer}>
        <Spin spinning={props.filterStore.isLoading}>
          <QueryBuilderDnD dnd={{ ...ReactDnD, ...ReactDndHtml5Backend }}>
            <QueryBuilderSaltBox>
              <QueryBuilderSaltBox>
                <QueryBuilder
                  fields={toJS(props.filterStore.filterSchema)}
                  query={toJS(props.filterStore.currentFilters)}
                  onQueryChange={props.filterStore.handleFiltersChange}
                  controlClassnames={{
                    queryBuilder: `${styles.queryBuilder} queryBuilder-branches`,
                  }}
                  controlElements={props.controlElements}
                  translations={{
                    addGroup: {
                      label: t("querybuilder-filters.add-group"),
                      title: t("querybuilder-filters.add-group-title"),
                    },
                    addRule: {
                      label: t("querybuilder-filters.add-rule"),
                      title: t("querybuilder-filters.add-rule-title"),
                    },
                    removeRule: {
                      label: t("querybuilder-filters.remove-rule"),
                      title: t("querybuilder-filters.remove-rule-title"),
                    },
                    removeGroup: {
                      label: t("querybuilder-filters.remove-group"),
                      title: t("querybuilder-filters.remove-group-title"),
                    },
                  }}
                />
              </QueryBuilderSaltBox>
            </QueryBuilderSaltBox>
          </QueryBuilderDnD>
        </Spin>
        <Flex justify="space-between" style={{ padding: "8px" }}>
          <Button
            disabled={!props.filterStore.isSearchEnable}
            onClick={() => props.filterStore.handelSearch()}
            icon={<SearchOutlined />}
            type="primary"
          >
            {t("filters.search")}
          </Button>
          <div className={styles.buttons}>
            <Button
              color="danger"
              variant="link"
              disabled={props.filterStore.currentFilters.rules.length === 0}
              onClick={() => props.filterStore.handleResetFilters()}
              icon={<MatIcon icon="filter_alt_off" />}
            />
            {props?.additionalButtons}
          </div>
        </Flex>
      </div>
    );
  }
);
