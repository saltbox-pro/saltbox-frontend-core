import type { ExtraDataCategoryModel } from "@saltbox/saltbox-core-api-client";
import { InfoDrawer, type InfoDrawerProps } from "@saltbox/saltbox-frontend-common";
import { Skeleton } from "antd";
import { toJS } from "mobx";
import { observer } from "mobx-react-lite";
import { useEffect, useMemo } from "react";
import { useTranslation } from "react-i18next";

import { DRAWER_IDS } from "saltbox-core/shared/constants/drawer-ids";
import { type ExtraDataRecord, ExtraDataRecordsStore } from "saltbox-core/store";

import type { OnFilterButtonHandler } from "../../types/minion-details-props";

import { ExtraDataSearchField } from "./extra-data-search-field";
import styles from "./minion-extra-data-category-drawer.module.css";
import { MinionExtraDataRecordList } from "./minion-extra-data-record-list";
import { MinionExtraDataRecordTable } from "./minion-extra-data-record-table";

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
  onFilterButton?: OnFilterButtonHandler;
};

export const MinionExtraDataCategoryDrawer = observer<MinionExtraDataCategoryDrawerProps>(
  function MinionExtraDataCategoryDrawer({
    category,
    minionId,
    open,
    onFilterButton,
    ...restProps
  }) {
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

    const records = extraDataRecordsStore?.records;

    const fields = useMemo(() => {
      const declared = category?.fields?.map((field) => field.name) ?? [];

      if (declared.length > 0) return declared;

      return records ? collectFieldsFromRecords(records) : [];
    }, [category, records]);

    const handleSearch = (value: string) => {
      extraDataRecordsStore?.setSearch(value);
    };

    const hasLoaded = extraDataRecordsStore?.hasLoaded ?? false;
    const singleRecord =
      extraDataRecordsStore?.isSingleRecord && records && records.length > 0
        ? toJS(records[0])
        : null;
    const viewKey = !hasLoaded ? "loading" : singleRecord ? "list" : "table";

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
        transitionKey={open ? viewKey : "closed"}
        {...restProps}
        titleCopyable={false}
      >
        {hasLoaded && !singleRecord && (
          <div className="page-actions-buttons">
            <div className={styles.rightGroup}>
              <ExtraDataSearchField key={category?.name} onSearch={handleSearch} />
            </div>
          </div>
        )}

        {!hasLoaded && <Skeleton active />}

        {hasLoaded && singleRecord && category && (
          <MinionExtraDataRecordList
            record={singleRecord}
            fields={fields}
            category={category}
            onFilterButton={onFilterButton}
          />
        )}

        {hasLoaded && !singleRecord && extraDataRecordsStore && category && (
          <MinionExtraDataRecordTable
            store={extraDataRecordsStore}
            fields={fields}
            category={category}
            onFilterButton={onFilterButton}
          />
        )}
      </InfoDrawer>
    );
  }
);
