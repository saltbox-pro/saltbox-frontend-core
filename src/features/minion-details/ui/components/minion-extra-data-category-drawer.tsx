import type { ExtraDataCategoryModel } from "@saltbox/saltbox-core-api-client";
import {
  FastTablePaginated,
  InfoDrawer,
  type InfoDrawerProps,
} from "@saltbox/saltbox-frontend-common";
import { createColumnHelper } from "@tanstack/react-table";
import { message } from "antd";
import { toJS } from "mobx";
import { observer } from "mobx-react-lite";
import { useEffect, useMemo } from "react";
import { useTranslation } from "react-i18next";

import { DRAWER_IDS } from "saltbox-core/shared/constants/drawer-ids";
import { type ExtraDataRecord, ExtraDataRecordsStore } from "saltbox-core/store";

import { ExtraDataCell } from "./extra-data-cell";
import { ExtraDataSearchField } from "./extra-data-search-field";
import styles from "./minion-extra-data-category-drawer.module.css";

const columnHelper = createColumnHelper<ExtraDataRecord>();

const ExtraDataRecordsTable = FastTablePaginated<ExtraDataRecord>;

function collectFieldsFromRecords(records: Array<ExtraDataRecord>): string[] {
  const seen = new Set<string>();
  const fields: string[] = [];

  for (const record of records) {
    for (const key of Object.keys(record)) {
      if (!seen.has(key)) {
        seen.add(key);
        fields.push(key);
      }
    }
  }

  return fields;
}

export type MinionExtraDataCategoryDrawerProps = Omit<
  InfoDrawerProps,
  "drawerId" | "titleName" | "titleLabel" | "children" | "hasData" | "errorMessage"
> & {
  category: ExtraDataCategoryModel | null;
  minionId: string;
};

export const MinionExtraDataCategoryDrawer = observer<MinionExtraDataCategoryDrawerProps>(
  function MinionExtraDataCategoryDrawer({ category, minionId, open, ...restProps }) {
    const { t } = useTranslation();

    const extraDataRecordsStore = useMemo(
      () =>
        category
          ? new ExtraDataRecordsStore({
              minionId,
              categoryName: category.name,
              categorySource: category.source,
            })
          : null,
      [category, minionId]
    );

    useEffect(() => {
      if (!extraDataRecordsStore) return;

      extraDataRecordsStore.loadRecords();

      return () => {
        extraDataRecordsStore.reset();
      };
    }, [extraDataRecordsStore]);

    useEffect(() => {
      if (extraDataRecordsStore?.error) {
        message.error(t(extraDataRecordsStore.error));
      }
    }, [extraDataRecordsStore?.error, t]);

    const records = extraDataRecordsStore?.records;

    const fields = useMemo(() => {
      const declared = category?.category_fields ?? [];

      if (declared.length > 0) return declared;

      return records ? collectFieldsFromRecords(records) : [];
    }, [category, records]);

    const columns = useMemo(
      () =>
        fields.map((field) =>
          columnHelper.accessor((row) => row[field], {
            id: field,
            header: field,
            cell: ({ getValue }) => (
              <ExtraDataCell value={getValue()} field={field} onCopy={() => {}} />
            ),
            meta: {
              minWidth: 160,
            },
          })
        ),
      [fields]
    );

    const handleSearch = (value: string) => {
      extraDataRecordsStore?.setSearch(value);
    };

    return (
      <InfoDrawer
        open={open}
        drawerId={DRAWER_IDS.extraDataCategoryDetails}
        titleName={
          category
            ? t(`minions.extra-data.categories.${category.name}`, {
                defaultValue: category.name,
              })
            : undefined
        }
        transitionKey={open ? "opened" : "closed"}
        {...restProps}
        titleCopyable={false}
      >
        <div className="page-actions-buttons">
          <div className={styles.rightGroup}>
            <ExtraDataSearchField key={category?.name} onSearch={handleSearch} />
          </div>
        </div>

        {extraDataRecordsStore && (
          <ExtraDataRecordsTable
            columns={columns}
            data={toJS(extraDataRecordsStore.records)}
            total={extraDataRecordsStore.totalRecords}
            isLoading={extraDataRecordsStore.isLoading}
            pagination={extraDataRecordsStore.pagination}
            sorting={extraDataRecordsStore.sorting}
            onLazyLoad={(pagination, sorting) =>
              extraDataRecordsStore.handleLazyLoad(pagination, sorting)
            }
            locale={{ empty: t("minions.extra-data.empty") }}
          />
        )}
      </InfoDrawer>
    );
  }
);
