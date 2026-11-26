import {
  ArrowDownOutlined,
  ArrowUpOutlined,
  CalendarOutlined,
  ClockCircleOutlined,
  MinusOutlined,
} from "@ant-design/icons";
import { Empty } from "antd";
import { observer } from "mobx-react-lite";
import { useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";

import { apiCoreStore } from "saltbox-core/store";

import { getCollectionHistorySummary } from "../../model/collection-history";
import { CollectionHistoryStore } from "../../model/collection-history-store";
import type { DashboardHistoryCardConfig } from "../../model/dashboard-model";
import { CollectionHistoryChart } from "../charts/collection-history-chart";

import styles from "./collection-history.module.css";
import { DashboardCardShell } from "./dashboard-card-shell";

type CollectionHistoryCardProps = {
  card: DashboardHistoryCardConfig;
  slug: string | undefined;
  onEdit: (cardId: string) => void;
  fullscreenContainer?: HTMLElement | null;
};

export const CollectionHistoryCard = observer(
  ({ card, slug, onEdit, fullscreenContainer }: CollectionHistoryCardProps) => {
    const { t, i18n } = useTranslation();
    const [store] = useState(() => new CollectionHistoryStore());
    const { from, to, interval } = card.settings;
    const userTimezone = Intl.DateTimeFormat().resolvedOptions().timeZone;
    const query = useMemo(
      () => ({ from, to, interval, timezone: userTimezone }),
      [from, to, interval, userTimezone]
    );
    const collectionsApi = apiCoreStore.minionCollectionsApi;

    useEffect(() => {
      const controller = new AbortController();
      if (slug && collectionsApi) {
        store.historyLoad.run(slug, query, controller.signal).catch(() => undefined);
      }
      return () => {
        controller.abort();
        store.historyLoad.resetInitial();
      };
    }, [slug, query, store, collectionsApi]);

    const response = store.getResponse(slug, query);
    const formatDate = (value: string) =>
      new Intl.DateTimeFormat(i18n.language, {
        timeZone: userTimezone,
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      }).format(new Date(value));
    const hasData = response?.points.some((point) => point.count !== null);
    const historyFrom = response?.history_from;
    const emptyDescription =
      response && !historyFrom
        ? t("dashboard.history-not-recorded")
        : historyFrom && Date.parse(to) < Date.parse(historyFrom)
          ? t("dashboard.history-empty-before-start", { date: formatDate(historyFrom) })
          : t("dashboard.history-empty");
    const shortDateFormat = new Intl.DateTimeFormat(i18n.language, {
      timeZone: userTimezone,
      day: "2-digit",
      month: "2-digit",
    });
    const periodLabel = `${formatDate(from)} — ${formatDate(to)}`;
    const { startCount, endCount, change, changeRatio } = getCollectionHistorySummary(response);
    const ChangeIcon =
      change > 0 ? ArrowUpOutlined : change < 0 ? ArrowDownOutlined : MinusOutlined;
    const changeFormat = new Intl.NumberFormat(i18n.language, { signDisplay: "exceptZero" });
    const percentFormat = new Intl.NumberFormat(i18n.language, {
      style: "percent",
      maximumFractionDigits: 1,
      signDisplay: "exceptZero",
    });
    const timezoneLabel = new Intl.DateTimeFormat(i18n.language, {
      timeZone: userTimezone,
      timeZoneName: "longOffset",
    })
      .formatToParts(new Date(to))
      .find((part) => part.type === "timeZoneName")
      ?.value.replace(/^GMT/, "UTC");

    const numberFormat = new Intl.NumberFormat(i18n.language);
    const copyText = response?.points
      .map((point) => `${point.timestamp}\t${point.count ?? t("dashboard.history-no-observation")}`)
      .join("\n");

    return (
      <DashboardCardShell
        card={card}
        title={t("dashboard.history-title")}
        subtitle={null}
        className={styles.card}
        headerMeta={
          <dl className={styles.headerMeta}>
            <div
              className={styles.periodBadge}
              title={`${t("dashboard.history-period")}: ${periodLabel}`}
            >
              <dt>
                <CalendarOutlined aria-hidden="true" />
                <span className={styles.metaLabel}>{t("dashboard.history-period")}</span>
              </dt>
              <dd>
                <span className={styles.expanded}>{periodLabel}</span>
                <span className={styles.compact}>
                  {shortDateFormat.format(new Date(from))} — {shortDateFormat.format(new Date(to))}
                </span>
              </dd>
            </div>
            <div
              className={styles.intervalBadge}
              title={`${t("dashboard.history-interval")}: ${t(`dashboard.history-interval-${interval}`)}`}
            >
              <dt>
                <ClockCircleOutlined aria-hidden="true" />
                <span className={styles.metaLabel}>{t("dashboard.history-interval")}</span>
              </dt>
              <dd>{t(`dashboard.history-interval-${interval}`)}</dd>
            </div>
          </dl>
        }
        copyText={hasData ? copyText : undefined}
        loader={store.historyLoad}
        onEdit={onEdit}
        fullscreenContainer={fullscreenContainer}
      >
        {response && (
          <div className={styles.content}>
            <dl className={styles.metrics}>
              <div className={styles.primaryMetric}>
                <dt>
                  <span className={styles.expanded}>{t("dashboard.history-end-count")}</span>
                  <span className={styles.compact}>{t("dashboard.history-end-count-short")}</span>
                </dt>
                <dd>{endCount === null ? "—" : numberFormat.format(endCount)}</dd>
              </div>
              <div>
                <dt>
                  <span className={styles.expanded}>{t("dashboard.history-change")}</span>
                  <span className={styles.compact}>{t("dashboard.history-change-short")}</span>
                </dt>
                <dd title={changeRatio === null ? undefined : percentFormat.format(changeRatio)}>
                  {change !== null && (
                    <ChangeIcon aria-hidden="true" className={styles.changeIcon} />
                  )}
                  {change === null ? "—" : changeFormat.format(change)}
                  {changeRatio !== null && (
                    <span className={styles.changePercent}>
                      {percentFormat.format(changeRatio)}
                    </span>
                  )}
                </dd>
              </div>
              <div className={styles.startMetric}>
                <dt>
                  <span className={styles.expanded}>{t("dashboard.history-start-count")}</span>
                  <span className={styles.compact}>{t("dashboard.history-start-count-short")}</span>
                </dt>
                <dd>{startCount === null ? "—" : numberFormat.format(startCount)}</dd>
              </div>
            </dl>
            {hasData ? (
              <div className={styles.chart}>
                <CollectionHistoryChart response={response} />
              </div>
            ) : (
              <div className={styles.empty}>
                <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description={emptyDescription} />
              </div>
            )}
            <div className={styles.footer}>
              <div className={styles.context}>
                <span title={t("dashboard.history-scope")}>
                  <span className={styles.expanded}>{t("dashboard.history-scope")}</span>
                  <span className={styles.compact}>{t("dashboard.history-scope-short")}</span>
                </span>
                <span title={userTimezone}>{timezoneLabel ?? userTimezone}</span>
              </div>
              {historyFrom && (
                <span
                  className={styles.historyAvailable}
                  title={t("dashboard.history-available", { date: formatDate(historyFrom) })}
                >
                  <span className={styles.expanded}>
                    {t("dashboard.history-available", { date: formatDate(historyFrom) })}
                  </span>
                  <span className={styles.compact}>
                    {t("dashboard.history-available-short", {
                      date: shortDateFormat.format(new Date(historyFrom)),
                    })}
                  </span>
                </span>
              )}
            </div>
          </div>
        )}
      </DashboardCardShell>
    );
  }
);
