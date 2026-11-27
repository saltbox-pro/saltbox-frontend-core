import { DatePicker, Select, Typography } from "antd";
import dayjs from "dayjs";
import { useTranslation } from "react-i18next";

import {
  HISTORY_INTERVALS,
  HISTORY_MAX_POINTS,
  type CollectionHistorySettings,
  type HistoryInterval,
  type HistorySettingsError,
} from "../../model/collection-history";

import styles from "./collection-history.module.css";

type CollectionHistorySettingsProps = {
  error: HistorySettingsError | null;
  timezone?: string;
  value: CollectionHistorySettings;
  onChange: (value: CollectionHistorySettings) => void;
};

export const CollectionHistorySettingsEditor = ({
  error,
  timezone,
  value,
  onChange,
}: CollectionHistorySettingsProps) => {
  const { t } = useTranslation();

  return (
    <div className={styles.settings}>
      <div className={styles.periodControl}>
        <label htmlFor="collection-history-period">{t("dashboard.history-period")}</label>
        <DatePicker.RangePicker
          id={{ start: "collection-history-period", end: "collection-history-period-end" }}
          allowClear={false}
          showTime={{ format: "HH:mm" }}
          format="DD.MM.YYYY HH:mm"
          value={[dayjs(value.from), dayjs(value.to)]}
          maxDate={dayjs()}
          status={error ? "error" : undefined}
          className={styles.rangePicker}
          presets={[7, 30, 90].map((days) => ({
            label: t("dashboard.history-last-days", { count: days }),
            value: () => [dayjs().subtract(days, "day").startOf("hour"), dayjs().startOf("hour")],
          }))}
          onChange={(dates) => {
            if (dates?.[0] && dates[1]) {
              onChange({ ...value, from: dates[0].toISOString(), to: dates[1].toISOString() });
            }
          }}
        />
      </div>
      <div className={styles.intervalControl}>
        <label htmlFor="collection-history-interval">{t("dashboard.history-interval")}</label>
        <Select<HistoryInterval>
          id="collection-history-interval"
          value={value.interval}
          options={HISTORY_INTERVALS.map((interval) => ({
            value: interval,
            label: t(`dashboard.history-interval-${interval}`),
          }))}
          onChange={(interval) => onChange({ ...value, interval })}
        />
      </div>
      {error && (
        <Typography.Text type="danger" role="alert" className={styles.settingsError}>
          {t(`dashboard.history-${error}`, { limit: HISTORY_MAX_POINTS })}
        </Typography.Text>
      )}
      <Typography.Text type="secondary" className={styles.settingsHint}>
        {t("dashboard.history-settings-hint", { timezone })}
      </Typography.Text>
    </div>
  );
};
