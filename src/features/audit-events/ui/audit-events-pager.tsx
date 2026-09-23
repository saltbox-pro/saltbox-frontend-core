import { LeftOutlined, RightOutlined } from "@ant-design/icons";
import { Button, Flex, Select } from "antd";
import { observer } from "mobx-react-lite";
import { useTranslation } from "react-i18next";

import { AUDIT_EVENTS_PAGE_SIZES } from "../constants/audit-events";
import type { AuditEventsStore } from "../model/audit-events-store";

import styles from "./audit-events-pager.module.css";

type AuditEventsPagerProps = {
  store: AuditEventsStore;
};

export const AuditEventsPager = observer(({ store }: AuditEventsPagerProps) => {
  const { t } = useTranslation();

  const pageSizeOptions = AUDIT_EVENTS_PAGE_SIZES.map((size) => ({
    value: size,
    label: t("audit.events.pager.page-size", { size }),
  }));

  return (
    <Flex className={styles.pager} justify="flex-end" align="center" gap={8}>
      <Button
        size="small"
        icon={<LeftOutlined />}
        disabled={!store.hasPreviousPage || store.isLoading}
        onClick={store.loadPreviousPage}
      >
        {t("audit.events.pager.previous")}
      </Button>
      <Button
        size="small"
        icon={<RightOutlined />}
        iconPosition="end"
        disabled={!store.hasNextPage || store.isLoading}
        onClick={store.loadNextPage}
      >
        {t("audit.events.pager.next")}
      </Button>
      <Select
        size="small"
        value={store.pageSize}
        options={pageSizeOptions}
        disabled={store.isLoading}
        popupMatchSelectWidth={false}
        onChange={store.setPageSize}
      />
    </Flex>
  );
});
