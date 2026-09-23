import { ErrorZone, FastTable, PageHeader, RefreshButton } from "@saltbox/saltbox-frontend-common";
import { Alert } from "antd";
import { observer } from "mobx-react-lite";
import { useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { useLocation } from "react-router";

import {
  AuditEventsFilterStore,
  AuditEventsQueryBuilder,
  AuditEventsStore,
  AuditEventsTable,
  localizeAuditFilterSchema,
} from "saltbox-core/features/audit-events";
import { apiAuditStore } from "saltbox-core/store";

import styles from "./index.module.css";

const AuditEventsPage = observer(() => {
  const { t } = useTranslation();
  const location = useLocation();

  const [filterStore] = useState(
    () => new AuditEventsFilterStore(`auditEventsFilter:${location.pathname}`)
  );
  const [eventsStore] = useState(() => new AuditEventsStore());

  const filterSchema = useMemo(
    () => localizeAuditFilterSchema(filterStore.rawFilterSchema, t),
    [filterStore.rawFilterSchema, t]
  );

  useEffect(() => {
    filterStore.updateFilterSchema(filterSchema);
  }, [filterSchema, filterStore]);

  useEffect(() => {
    if (!apiAuditStore.isAvailable) {
      return;
    }
    filterStore.loadFilterSchema().finally(() => {
      eventsStore.applyQuery(filterStore.searchMongoDBQuery);
    });
  }, [eventsStore, filterStore]);

  const handleSearch = () => {
    eventsStore.applyQuery(filterStore.searchMongoDBQuery);
  };

  if (!apiAuditStore.isAvailable) {
    return (
      <>
        <PageHeader title={t("audit.events.title")} />
        <Alert type="warning" showIcon message={t("audit.events.service-unavailable")} />
      </>
    );
  }

  return (
    <>
      <PageHeader title={t("audit.events.title")} />

      <ErrorZone level="block" keepContentOnError loaders={[filterStore.filterSchemaLoad]}>
        <AuditEventsQueryBuilder
          filterStore={filterStore}
          onSearch={handleSearch}
          onReset={handleSearch}
        />
      </ErrorZone>

      <FastTable.Provider>
        <div className="page-actions-buttons">
          <div className={styles.tableActions}>
            <RefreshButton
              loading={eventsStore.isLoading}
              disabled={eventsStore.isLoading}
              onClick={eventsStore.reload}
            />
            <FastTable.Toolbar />
          </div>
        </div>

        <AuditEventsTable store={eventsStore} />
      </FastTable.Provider>
    </>
  );
});

export default AuditEventsPage;
