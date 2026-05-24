import { Flex, Select } from "antd";
import { useTranslation } from "react-i18next";

import {
  DEFAULT_JOB_DATE_RANGE_PRESET,
  getJobDateRangeForPreset,
  JOB_DATE_RANGE_PRESET,
  type JobDateRangePreset,
} from "saltbox-core/shared/constants/job-date-range-presets";

type JobDatetimeRangeSelectorProps = {
  className?: string;
  label?: string;
  disabled?: boolean;
  value?: JobDateRangePreset;
  onChange: (
    range: ReturnType<typeof getJobDateRangeForPreset>,
    preset: JobDateRangePreset
  ) => void;
};

export function JobDatetimeRangeSelector(props: JobDatetimeRangeSelectorProps) {
  const { t } = useTranslation();

  const options: Array<{ value: JobDateRangePreset; label: string }> = [
    { value: JOB_DATE_RANGE_PRESET.ALL_TIME, label: t("jobs.date-range-all-time") },
    { value: JOB_DATE_RANGE_PRESET.TODAY, label: t("jobs.date-range-today") },
    { value: JOB_DATE_RANGE_PRESET.MINUTES_10, label: t("jobs.date-range-10-minutes") },
    { value: JOB_DATE_RANGE_PRESET.MINUTES_30, label: t("jobs.date-range-30-minutes") },
    { value: JOB_DATE_RANGE_PRESET.HOUR_1, label: t("jobs.date-range-1-hour") },
    { value: JOB_DATE_RANGE_PRESET.HOUR_3, label: t("jobs.date-range-3-hours") },
    { value: JOB_DATE_RANGE_PRESET.HOUR_12, label: t("jobs.date-range-12-hours") },
    { value: JOB_DATE_RANGE_PRESET.DAY_1, label: t("jobs.date-range-1-day") },
  ];

  const handleChangeRange = (preset: JobDateRangePreset) => {
    props.onChange(getJobDateRangeForPreset(preset), preset);
  };

  return (
    <Flex className={props?.className} align="center">
      <div style={{ marginRight: "5px" }}>{props?.label}</div>
      <Select
        options={options}
        style={{ minWidth: 125 }}
        optionLabelProp="label"
        value={props.value ?? DEFAULT_JOB_DATE_RANGE_PRESET}
        styles={{
          popup: {
            root: {
              minWidth: 125,
            },
          },
        }}
        onChange={handleChangeRange}
        disabled={props?.disabled}
      />
    </Flex>
  );
}
