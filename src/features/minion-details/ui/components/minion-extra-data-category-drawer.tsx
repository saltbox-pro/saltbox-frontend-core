import { DeleteOutlined, EditOutlined } from "@ant-design/icons";
import type { ExtraDataCategoryModel } from "@saltbox/saltbox-core-api-client";
import {
  FastTable,
  ErrorZone,
  InfoDrawer,
  type InfoDrawerProps,
} from "@saltbox/saltbox-frontend-common";
import { Button, Skeleton } from "antd";
import { toJS } from "mobx";
import { observer } from "mobx-react-lite";
import { useCallback, useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";

import { ExtraDataExportButton } from "saltbox-core/features/extra-data-export";
import {
  AddExtraDataButton,
  EditExtraDataItemModal,
  ExtraDataItemModal,
  canAddExtraDataManually,
  canChangeExtraDataRecord,
  useDeleteExtraDataItemConfirm,
} from "saltbox-core/features/minion-extra-data-editor";
import { ExtraDataSearchField } from "saltbox-core/shared/components/extra-data-search-field";
import { DRAWER_IDS } from "saltbox-core/shared/constants/drawer-ids";
import { getExtraDataCategoryDisplayName } from "saltbox-core/shared/helpers/extra-data-category-name";
import {
  collectExtraDataFieldNamesFromRecords,
  getDeclaredExtraDataFieldNames,
} from "saltbox-core/shared/helpers/extra-data-value";
import { type ExtraDataRecord, ExtraDataRecordsStore } from "saltbox-core/store";

import type { OnFilterButtonHandler } from "../../types/minion-details-props";

import styles from "./minion-extra-data-category-drawer.module.css";
import { MinionExtraDataRecordList } from "./minion-extra-data-record-list";
import { MinionExtraDataRecordTable } from "./minion-extra-data-record-table";

export type MinionExtraDataCategoryDrawerProps = Omit<
  InfoDrawerProps,
  "drawerId" | "titleName" | "titleLabel" | "children" | "hasData" | "errorMessage"
> & {
  category: ExtraDataCategoryModel | null;
  minionId: string;
  collectionSlug: string;
  onFilterButton?: OnFilterButtonHandler;
};

export const MinionExtraDataCategoryDrawer = observer<MinionExtraDataCategoryDrawerProps>(
  function MinionExtraDataCategoryDrawer({
    category,
    minionId,
    collectionSlug,
    open,
    onFilterButton,
    ...restProps
  }) {
    const { t } = useTranslation();
    const [isCreateItemOpen, setIsCreateItemOpen] = useState(false);
    const [editingRecord, setEditingRecord] = useState<ExtraDataRecord | null>(null);
    const [isEditItemOpen, setIsEditItemOpen] = useState(false);

    const categoryId = category?.id;
    const canAddItem = !!category && canAddExtraDataManually(category);

    const canChangeRecord = useCallback(
      (record: ExtraDataRecord) => !!category && canChangeExtraDataRecord(category, record),
      [category]
    );

    const extraDataRecordsStore = useMemo(() => {
      if (!categoryId) {
        return null;
      }

      return new ExtraDataRecordsStore({
        minionId,
        categoryId,
        collectionSlug,
      });
    }, [categoryId, minionId, collectionSlug]);

    useEffect(() => {
      if (!extraDataRecordsStore) return;

      extraDataRecordsStore.loadRecords();

      return () => {
        extraDataRecordsStore.abortLoading();
      };
    }, [extraDataRecordsStore]);

    const openEditItem = useCallback((record: ExtraDataRecord) => {
      setEditingRecord(record);
      setIsEditItemOpen(true);
    }, []);

    const handleItemDeleted = useCallback(() => {
      extraDataRecordsStore?.reloadAfterRecordDeleted();
    }, [extraDataRecordsStore]);

    const records = extraDataRecordsStore?.records;

    const declaredFields = useMemo(
      () => (category ? getDeclaredExtraDataFieldNames(category) : []),
      [category]
    );

    const fields = useMemo(() => {
      if (declaredFields.length > 0) {
        return declaredFields;
      }

      return collectExtraDataFieldNamesFromRecords(records ?? []);
    }, [declaredFields, records]);

    const itemDeletion = useDeleteExtraDataItemConfirm({
      category,
      fields,
      minionId,
      onDeleted: handleItemDeleted,
    });

    const handleSearch = (value: string) => {
      extraDataRecordsStore?.setSearch(value);
    };

    const recordsLoad = extraDataRecordsStore?.recordsLoad;
    const loadStatus = recordsLoad?.status;
    const isLoaded = !!recordsLoad && !recordsLoad.isInitialLoad;
    const showSkeleton = !!recordsLoad && recordsLoad.isInitialLoad && loadStatus !== "error";
    const singleRecord =
      isLoaded && extraDataRecordsStore?.isSingleRecord && records && records.length > 0
        ? toJS(records[0])
        : null;
    const canChangeSingleRecord = !!singleRecord && canChangeRecord(singleRecord);

    const exportButton = category ? (
      <ExtraDataExportButton
        category={category}
        minionId={minionId}
        collectionSlug={collectionSlug}
        search={extraDataRecordsStore?.search ?? ""}
      />
    ) : null;

    return (
      <InfoDrawer
        open={open}
        drawerId={DRAWER_IDS.extraDataCategoryDetails}
        titleName={category ? getExtraDataCategoryDisplayName(t, category.name) : undefined}
        transitionKey={open ? (category?.id ?? "opened") : "closed"}
        {...restProps}
        titleCopyable={false}
      >
        {!!extraDataRecordsStore && (
          <ErrorZone level="block" loaders={[extraDataRecordsStore.recordsLoad]}>
            <FastTable.Provider>
              {isLoaded && category && (
                <div className="page-actions-buttons">
                  {canAddItem && <AddExtraDataButton onClick={() => setIsCreateItemOpen(true)} />}
                  <div className={styles.toolbarActions}>
                    {singleRecord ? (
                      <>
                        {exportButton}
                        {canChangeSingleRecord && (
                          <>
                            <Button
                              icon={<EditOutlined />}
                              onClick={() => openEditItem(singleRecord)}
                            >
                              {t("common.edit")}
                            </Button>
                            <Button
                              danger
                              icon={<DeleteOutlined />}
                              onClick={() => itemDeletion.openConfirm(singleRecord)}
                            >
                              {t("common.delete")}
                            </Button>
                          </>
                        )}
                      </>
                    ) : (
                      <>
                        <ExtraDataSearchField key={category.name} onSearch={handleSearch} />
                        {exportButton}
                        <FastTable.Toolbar />
                      </>
                    )}
                  </div>
                </div>
              )}

              {showSkeleton && <Skeleton active />}

              {isLoaded && singleRecord && category && (
                <MinionExtraDataRecordList
                  record={singleRecord}
                  fields={fields}
                  category={category}
                  onFilterButton={onFilterButton}
                />
              )}

              {isLoaded && !singleRecord && category && (
                <MinionExtraDataRecordTable
                  store={extraDataRecordsStore}
                  fields={fields}
                  category={category}
                  onFilterButton={onFilterButton}
                  canChangeRecord={canChangeRecord}
                  onEditRecord={openEditItem}
                  onDeleteRecord={itemDeletion.openConfirm}
                />
              )}
            </FastTable.Provider>
          </ErrorZone>
        )}

        {itemDeletion.modalContextHolder}

        {canAddItem && (
          <ExtraDataItemModal
            open={isCreateItemOpen}
            minionId={minionId}
            category={category}
            onCancel={() => setIsCreateItemOpen(false)}
            onSuccess={() => extraDataRecordsStore?.loadRecords()}
          />
        )}

        {canAddItem && (
          <EditExtraDataItemModal
            open={isEditItemOpen}
            record={editingRecord}
            minionId={minionId}
            category={category}
            onCancel={() => setIsEditItemOpen(false)}
            onSuccess={() => extraDataRecordsStore?.loadRecords()}
          />
        )}
      </InfoDrawer>
    );
  }
);
