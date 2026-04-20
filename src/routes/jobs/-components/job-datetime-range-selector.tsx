import { Flex, Select } from "antd";
import dayjs from "dayjs";
import { useTranslation } from "react-i18next";

type JobDatetimeRangeSelectorProps = {
  className?: string;
  label?: string;
  disabled?: boolean;
  onChange: (range: [dayjs.Dayjs, dayjs.Dayjs]) => void;
};

interface JobDatetimeRangeSelectorOption {
  value: number;
  label: string;
  dtValue: number;
  unut: dayjs.ManipulateType;
}

const optionsDefaultValue = 4;

export function JobDatetimeRangeSelector(props: JobDatetimeRangeSelectorProps) {
  const { t } = useTranslation();
  const options: Array<JobDatetimeRangeSelectorOption> = [
    { value: 1, label: t("jobs.date-range-today"), dtValue: -1, unut: "d" },
    {
      value: 2,
      label: t("jobs.date-range-10-minutes"),
      dtValue: -10,
      unut: "m",
    },
    {
      value: 3,
      label: t("jobs.date-range-30-minutes"),
      dtValue: -30,
      unut: "m",
    },
    { value: 4, label: t("jobs.date-range-1-hour"), dtValue: -1, unut: "h" },
    { value: 5, label: t("jobs.date-range-3-hours"), dtValue: -3, unut: "h" },
    { value: 6, label: t("jobs.date-range-12-hours"), dtValue: -12, unut: "h" },
    { value: 7, label: t("jobs.date-range-1-day"), dtValue: -1, unut: "d" },
  ];
  const handleChangeRange = (value: number) => {
    if (value === optionsDefaultValue) {
      const range: [dayjs.Dayjs, dayjs.Dayjs] = [dayjs().startOf("day"), dayjs()];
      props.onChange(range);
    } else {
      const option = options.find((option) => option.value === value);
      if (option) {
        const range: [dayjs.Dayjs, dayjs.Dayjs] = [
          dayjs().add(option.dtValue, option.unut),
          dayjs(),
        ];
        props.onChange(range);
      }
    }
  };

  return (
    <Flex className={props?.className} align="center">
      <div style={{ marginRight: "5px" }}>{props?.label}</div>
      <Select
        options={options}
        style={{ minWidth: 125 }}
        optionLabelProp="label"
        defaultValue={optionsDefaultValue}
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
