import { useState } from "react";
import { useTranslation } from "react-i18next";
import ReactJson from "react-json-view";
import { Row, SortingState, createColumnHelper } from "@tanstack/react-table";
import { Button, Tag } from "antd";
import { MinusSquareOutlined, PlusSquareOutlined } from "@ant-design/icons";
import { JobResult } from "@saltbox/saltbox-core-api-client";
import { FastTableListed, formatTimeByUserTZ } from "@saltbox/saltbox-frontend-common";
import { calculateStatistics, getExecutionTimeColor, formatExecutionTime, TimeUnits } from "../../../utils/execution-time-utils";

const columnHelper = createColumnHelper<JobResult>();

const JobReturnsTable = FastTableListed<JobResult>;


export const DefaultJobReturnTable = ({
  jobReturns,
  isFullOutput = false,
  isLoading = false,
  jobStartTimestamp,
}: {
  jobReturns: JobResult[];
  isFullOutput?: boolean;
  isLoading?: boolean;
  jobStartTimestamp?: string | null;
}) => {
  const { t } = useTranslation();
  const [sorting, setSorting] = useState<SortingState>([]);

  const jobReturnsWithExecutionTime = jobReturns.map(row => {
    const startDate = new Date(jobStartTimestamp || 0);
    const endDate = new Date(row._stamp || 0);

    const executionTimeMs = endDate.getTime() - startDate.getTime();
    const executionTimeSeconds = executionTimeMs / 1000;

    return { ...row, executionTimeSeconds };
  });

  // Вычисляем статистические показатели execution time для цветовой градации
  const executionTimes = jobReturnsWithExecutionTime
    .map(row => row.executionTimeSeconds)
    .filter(time => time > 0); // Исключаем отрицательные значения

  const statistics = calculateStatistics(executionTimes);

  // Функция для отображения некорректного времени выполнения
  const renderInvalidExecutionTime = (jobResult: JobResult) => {
    const startDate = new Date(jobStartTimestamp || 0);
    const endDate = new Date(jobResult._stamp || 0);

    const startTime = startDate.toLocaleString('ru-RU', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    });
    const endTime = endDate.toLocaleString('ru-RU', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    });

    return (
      <div style={{ fontSize: '12px', color: '#ff4d4f' }}>
        {startTime} - {endTime}
      </div>
    );
  };

  const columns = [
    {
      id: "expander",
      header: () => null,
      cell: ({ row }: { row: Row<JobResult> }) => {
        if (!row.getCanExpand()) {
          return <></>;
        }

        return (
          <Button
            icon={
              row.getIsExpanded() ? (
                <MinusSquareOutlined />
              ) : (
                <PlusSquareOutlined />
              )
            }
            size="small"
            type="link"
            onClick={row.getToggleExpandedHandler()}
          ></Button>
        );
      },
    },
    columnHelper.accessor("id", {
      header: t("task.job-returns-table.table-mid"),
    }),
    columnHelper.accessor("success", {
      header: t("task.job-returns-table.table-success"),
      cell: (data) => (
        <Tag color={data.getValue() ? "green" : "red"}>
          {data.getValue()
            ? t("task.job-returns-table.table-yes")
            : t("task.job-returns-table.table-no")}
        </Tag>
      ),
    }),
    columnHelper.accessor("retcode", {
      header: t("task.job-returns-table.table-return-code"),
    }),
    columnHelper.accessor("_stamp", {
      header: t("task.job-returns-table.table-timestamp"),
      cell: (data) => {
        if (!data.getValue()) {
          return <></>;
        }
        const timestamp: string = formatTimeByUserTZ(data.getValue());
        return <div>{timestamp}</div>;
      },
    }),
    columnHelper.accessor("executionTimeSeconds", {
      header: t("task.job-returns-table.table-execution-time"),
      cell: ({ getValue, row }) => {
        const executionTimeSeconds = getValue();
        const jobResult = row.original;

        // Обработка случая с отрицательным или нулевым временем выполнения
        if (executionTimeSeconds <= 0) {
          return renderInvalidExecutionTime(jobResult);
        }

        // Получаем единицы времени для локализации
        const timeUnits: TimeUnits = {
          milliseconds: t("task.job-returns-table.time-units.milliseconds"),
          seconds: t("task.job-returns-table.time-units.seconds"),
          minutes: t("task.job-returns-table.time-units.minutes"),
          hours: t("task.job-returns-table.time-units.hours"),
        };

        // Форматируем время с локализацией
        const formattedTime = formatExecutionTime(executionTimeSeconds, timeUnits);

        // Получаем цвет на основе статистики
        const textColor = getExecutionTimeColor(
          executionTimeSeconds,
          statistics.mean,
          statistics.stdDev,
          statistics.min,
          statistics.max
        );

        return (
          <div style={{ color: textColor, fontWeight: 'bold' }}>
            {formattedTime}
          </div>
        );
      },
    }),
  ];

  const getShortOutput = (data: JobResult) => {
    if (data.return !== undefined) {
      return { return: data.return };
    }
    if (data._return !== undefined) {
      return { _return: data._return };
    }
    return data;
  };

  const renderJobResult = ({ row }: { row: Row<JobResult> }) => {
    const dataToShow = isFullOutput ? row.original : getShortOutput(row.original);

    return (
      <div>
        <ReactJson
          displayDataTypes={false}
          enableClipboard={false}
          name={false}
          displayObjectSize={false}
          src={dataToShow}
          collapsed={isFullOutput ? 1 : 2}
        />
      </div>
    );
  };

  return (
    <JobReturnsTable
      getRowId={(row) => `${row.jid}-${row.id}`}
      columns={columns}
      data={jobReturnsWithExecutionTime}
      isLoading={isLoading && !jobReturns.length}
      isEmpty={!isLoading && !jobReturns.length}
      getRowCanExpand={() => true}
      renderSubComponent={renderJobResult}
      sorting={sorting}
      onSortingChange={setSorting}
    />
  );
};
