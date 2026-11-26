import { useId, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

import type { CollectionHistoryResponse } from "../../model/collection-history";

import styles from "./chart-tooltip-content.module.css";

type HistoryDatum = { timestamp: number; count: number | null };

const PRIMARY_COLOR = "var(--ant-color-primary, #1677ff)";
const DOT_BACKGROUND = "var(--ant-color-bg-container, #fff)";

export const CollectionHistoryChart = ({ response }: { response: CollectionHistoryResponse }) => {
  const { t, i18n } = useTranslation();
  const [isCompact, setIsCompact] = useState(false);
  const gradientId = `collection-history-${useId().replace(/:/g, "")}`;
  const data = useMemo(
    () =>
      response.points.map(({ timestamp, count }) => ({ timestamp: Date.parse(timestamp), count })),
    [response.points]
  );
  const numberFormat = new Intl.NumberFormat(i18n.language);
  const dateFormat = new Intl.DateTimeFormat(i18n.language, {
    timeZone: response.timezone,
    timeZoneName: "shortOffset",
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
  const axisFormat = new Intl.DateTimeFormat(i18n.language, {
    timeZone: response.timezone,
    month: response.interval === "month" ? "short" : "2-digit",
    ...(response.interval === "month" ? { year: "numeric" } : { day: "2-digit" }),
    ...(response.interval === "hour" ? { hour: "2-digit", minute: "2-digit" } : {}),
  });
  const domain: [number, number] = [data[0].timestamp, data[data.length - 1].timestamp];

  const axisProps = {
    tick: { fontSize: isCompact ? 10 : 12, fill: "var(--ant-color-text-secondary, #667085)" },
    axisLine: false,
    tickLine: false,
  };
  const margin = isCompact
    ? { top: 6, right: 8, bottom: 0, left: 0 }
    : { top: 12, right: 12, bottom: 4, left: 0 };

  return (
    <ResponsiveContainer
      debounce={60}
      onResize={(width, height) => setIsCompact(width < 420 || height < 150)}
    >
      <AreaChart
        data={data}
        accessibilityLayer
        title={t("dashboard.history-title")}
        margin={margin}
      >
        <defs>
          <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={PRIMARY_COLOR} stopOpacity={0.2} />
            <stop offset="100%" stopColor={PRIMARY_COLOR} stopOpacity={0.02} />
          </linearGradient>
        </defs>
        <CartesianGrid
          vertical={false}
          stroke="var(--ant-color-border-secondary, #edf0f5)"
          strokeDasharray="3 4"
        />
        <XAxis
          dataKey="timestamp"
          type="number"
          scale="time"
          domain={domain}
          tickFormatter={axisFormat.format}
          {...axisProps}
          tickMargin={isCompact ? 6 : 12}
          minTickGap={isCompact ? 32 : 48}
          interval="preserveStartEnd"
          height={isCompact ? 26 : 38}
        />
        <YAxis
          domain={[0, "auto"]}
          allowDecimals={false}
          width={isCompact ? 44 : 58}
          tickCount={isCompact ? 3 : 5}
          tickFormatter={numberFormat.format}
          {...axisProps}
          tickMargin={8}
        />
        <Tooltip
          filterNull={false}
          isAnimationActive={false}
          cursor={{
            stroke: PRIMARY_COLOR,
            strokeDasharray: "4 4",
            strokeOpacity: 0.4,
          }}
          content={({ active, payload }) => {
            const point: HistoryDatum | undefined = payload?.[0]?.payload;
            if (!active || !point) {
              return null;
            }
            return (
              <div className={`${styles.chartTooltip} ${styles.historyTooltip}`}>
                <div className={styles.historyTooltipDate}>
                  {dateFormat.format(point.timestamp)}
                </div>
                <div className={styles.historyTooltipMetric}>
                  {point.count === null ? (
                    t("dashboard.history-no-observation")
                  ) : (
                    <>
                      <span>{t("dashboard.history-clients")}</span>
                      <strong>{numberFormat.format(point.count)}</strong>
                    </>
                  )}
                </div>
              </div>
            );
          }}
        />
        <Area
          dataKey="count"
          stroke={PRIMARY_COLOR}
          strokeWidth={2.25}
          fill={`url(#${gradientId})`}
          fillOpacity={1}
          dot={
            data.length <= 40 || data.filter((point) => point.count !== null).length === 1
              ? { r: 2.5, fill: DOT_BACKGROUND, strokeWidth: 1.5 }
              : false
          }
          activeDot={{ r: 4, stroke: DOT_BACKGROUND, strokeWidth: 2 }}
          isAnimationActive={false}
        />
      </AreaChart>
    </ResponsiveContainer>
  );
};
