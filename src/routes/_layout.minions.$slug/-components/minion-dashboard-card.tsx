import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { generateID } from "react-querybuilder";
import { SortingState, createColumnHelper } from "@tanstack/react-table";
import { observer } from "mobx-react-lite";
import { Cell, Pie, PieChart, ResponsiveContainer, Sector } from "recharts";
import { Button, Card, Dropdown, Flex, MenuProps, Spin } from "antd";
import {
  DashOutlined,
  DeleteOutlined,
  EditOutlined,
  FilterOutlined,
  FullscreenOutlined,
} from "@ant-design/icons";
import { GrainValue } from "@api/models";
import { FastTableListed } from "@packages/components/fast-table-listed/fast-table-listed";
import { HeaderSelect } from "@packages/components/header-select/header-select";
import { DashboardCardStore } from "@store/dashboard-card-store";
import { dashboardStore } from "@store/dashboard-store";
import { MinionFilterStore } from "@store/minion-filter-store";
import styles from "./minion-dashboard-card.module.css";

const columnHelper = createColumnHelper<GrainValue>();

const grainsOptions = [
  {
    value: "cpu_model",
    label: "cpu_model",
  },
  {
    value: "osfullname",
    label: "osfullname",
  },
  {
    value: "boardname",
    label: "boardname",
  },
  {
    value: "kernel",
    label: "kernel",
  },
  {
    value: "saltversion",
    label: "saltversion",
  },
  {
    value: "pythonversion",
    label: "pythonversion",
  },
  {
    value: "host",
    label: "host",
  },
  {
    value: "fqdn",
    label: "fqdn",
  },
  {
    value: "master",
    label: "master",
  },
  {
    value: "cpuarch",
    label: "cpuarch",
  },
  {
    value: "os",
    label: "os",
  },
  {
    value: "osfinger",
    label: "osfinger",
  },
  {
    value: "osrelease",
    label: "osrelease",
  },
  {
    value: "oscodename",
    label: "oscodename",
  },
  {
    value: "os_family",
    label: "os_family",
  },
  {
    value: "osarch",
    label: "osarch",
  },
  {
    value: "cwd",
    label: "cwd",
  },
  {
    value: "localhost",
    label: "localhost",
  },
  {
    value: "hwaddr_interfaces",
    label: "hwaddr_interfaces",
  },
  {
    value: "nodename",
    label: "nodename",
  },
  {
    value: "kernelrelease",
    label: "kernelrelease",
  },
  {
    value: "kernelversion",
    label: "kernelversion",
  },
  {
    value: "init",
    label: "init",
  },
  {
    value: "lsb_distrib_id",
    label: "lsb_distrib_id",
  },
  {
    value: "lsb_distrib_release",
    label: "lsb_distrib_release",
  },
  {
    value: "lsb_distrib_codename",
    label: "lsb_distrib_codename",
  },
  {
    value: "biosversion",
    label: "biosversion",
  },
  {
    value: "biosvendor",
    label: "biosvendor",
  },
  {
    value: "productname",
    label: "productname",
  },
  {
    value: "manufacturer",
    label: "manufacturer",
  },
  {
    value: "biosreleasedate",
    label: "biosreleasedate",
  },
  {
    value: "serialnumber",
    label: "serialnumber",
  },
  {
    value: "virtual",
    label: "virtual",
  },
  {
    value: "ps",
    label: "ps",
  },
  {
    value: "pythonexecutable",
    label: "pythonexecutable",
  },
  {
    value: "saltpath",
    label: "saltpath",
  },
  {
    value: "zmqversion",
    label: "zmqversion",
  },
  {
    value: "shell",
    label: "shell",
  },
  {
    value: "username",
    label: "username",
  },
  {
    value: "groupname",
    label: "groupname",
  },
];

const renderActiveShape = (props: any) => {
  const RADIAN = Math.PI / 180;
  const {
    cx,
    cy,
    midAngle,
    innerRadius,
    outerRadius,
    startAngle,
    endAngle,
    fill,
    payload,
    percent,
    value,
  } = props;
  const sin = Math.sin(-RADIAN * midAngle);
  const cos = Math.cos(-RADIAN * midAngle);
  const sx = cx + (outerRadius + 10) * cos;
  const sy = cy + (outerRadius + 10) * sin;
  const mx = cx + (outerRadius + 30) * cos;
  const my = cy + (outerRadius + 30) * sin;
  const ex = mx + (cos >= 0 ? 1 : -1) * 22;
  const ey = my;
  const textAnchor = cos >= 0 ? "start" : "end";

  return (
    <g>
      <text x={cx} y={cy - 135} dy={8} textAnchor="middle" fill={fill}>
        {payload.value}
      </text>
      <Sector
        cx={cx}
        cy={cy}
        innerRadius={innerRadius}
        outerRadius={outerRadius}
        startAngle={startAngle}
        endAngle={endAngle}
        fill={fill}
      />
      <Sector
        cx={cx}
        cy={cy}
        startAngle={startAngle}
        endAngle={endAngle}
        innerRadius={outerRadius + 6}
        outerRadius={outerRadius + 10}
        fill={fill}
      />
      <path
        d={`M${sx},${sy}L${mx},${my}L${ex},${ey}`}
        stroke={fill}
        fill="none"
      />
      <circle cx={ex} cy={ey} r={2} fill={fill} stroke="none" />
      <text
        x={ex + (cos >= 0 ? 1 : -1) * 12}
        y={ey}
        textAnchor={textAnchor}
        fill="#333"
      >{`${value}`}</text>
      <text
        x={ex + (cos >= 0 ? 1 : -1) * 12}
        y={ey}
        dy={18}
        textAnchor={textAnchor}
        fill="#999"
      >
        {`(${(percent * 100).toFixed(2)}%)`}
      </text>
    </g>
  );
};

type MinionDashboardCardProps = {
  grains: string;
  view: string;
  onRemove?: () => void;
  onUpdateGrains: (newGrains: string) => void;
  onChangeView: (newView: string) => void;
  slug: string | undefined;
  filterStore: MinionFilterStore;
};

export const MinionDashboardCard = observer(
  ({
    grains,
    view,
    onRemove,
    onUpdateGrains,
    onChangeView,
    slug,
    filterStore,
  }: MinionDashboardCardProps) => {
    const { t } = useTranslation();
    const [sorting, setSorting] = useState<SortingState>([
      {
        id: "count",
        desc: true,
      },
    ]);
    const [currentGrains, setCurrentGrains] =
      useState<(typeof grainsOptions)[number]["value"]>(grains);
    const [activeIndex, setActiveIndex] = useState(0);
    const [viewMode, setViewMode] = useState<string>(view);
    const [dashboardCardStore] = useState(new DashboardCardStore());
    const [isFullScreen, setIsFullScreen] = useState<boolean>(false);

    useEffect(() => {
      updateCard();
    }, [filterStore.searchMongoDBQuery]);

    const columns = [
      columnHelper.accessor("value", {
        header: t("dashboard.table-value"),
        enableSorting: false,
        meta: {
          tdClassName: styles.minionDashboardCardGrainCol,
        },
        cell: (data) => {
          let fieldName = data.getValue() as string | null | undefined;
          if (fieldName === null || fieldName === undefined) {
            fieldName = "Emtpy Name";
          }
          return (
            <Flex justify="space-between">
              <Flex className={styles.minionDashboardCardGrainTitle}>
                {fieldName}
              </Flex>
              <Flex className={styles.minionDashboardCardGrainFilter}>
                <Button
                  shape="circle"
                  type="primary"
                  title={t("dashboard.apply-value-to-filters")}
                  size="small"
                  icon={<FilterOutlined />}
                  onClick={() => {
                    filterStore.currentFilters = {
                      ...filterStore.currentFilters,
                      rules: [
                        ...filterStore.currentFilters.rules,
                        {
                          field: `grains.${grains}`,
                          operator: "=",
                          valueSource: "value",
                          value: data.getValue()?.toString(),
                          id: generateID(),
                        },
                      ],
                    };
                    filterStore.handelSearch();
                  }}
                ></Button>
              </Flex>
            </Flex>
          );
        },
      }),
      columnHelper.accessor("count", {
        header: t("dashboard.table-count"),
        enableColumnFilter: false,
      }),
    ];

    const onPieEnter = (_: any, index: any) => {
      setActiveIndex(index);
    };

    const updateCard = () => {
      if (!slug) return;
      dashboardCardStore.loadGrain(
        currentGrains,
        slug,
        filterStore?.searchMongoDBQuery
      );
    };

    useEffect(() => {
      updateCard();
    }, [currentGrains, slug]);

    const handleGrainsChange = (newGrains: string) => {
      setCurrentGrains(newGrains);
      onUpdateGrains(newGrains);
    };

    const toggleFullscreen = () => {
      setIsFullScreen(!isFullScreen);
      dashboardStore.isCardFullScreen = !dashboardStore.isCardFullScreen;
    };

    const toggleView = () => {
      const nextViewMode = viewMode === "table" ? "graph" : "table";
      setViewMode(nextViewMode);
      onChangeView(nextViewMode);
    };

    const items: MenuProps["items"] = [
      {
        icon: <EditOutlined />,
        label: t("dashboard.change-view"),
        key: "0",
        onClick: toggleView,
        disabled: isFullScreen,
      },
      {
        icon: <FullscreenOutlined />,
        label: isFullScreen
          ? t("dashboard.windowed")
          : t("dashboard.fullscreen"),
        onClick: toggleFullscreen,
        key: "1",
        disabled: !isFullScreen && view === "graph",
      },
      {
        icon: <DeleteOutlined />,
        label: t("dashboard.remove"),
        onClick: onRemove,
        key: "2",
        disabled: isFullScreen,
      },
    ];

    const COLORS = [
      "#0088FE",
      "#AED581",
      "#F1948B",
      "#FFA726",
      "#CA3433",
      "#993333",
      "#CC6671",
      "#996666",
    ];

    return (
      <>
        <Card
          size="small"
          className={`${styles.dashboardTableBlock} ${
            isFullScreen && styles.fullscreen
          }`}
        >
          <Spin spinning={dashboardCardStore.isFilterLoading}>
            <div className={styles.dashboardTableBlockHeader}>
              <HeaderSelect
                value={currentGrains}
                onChange={handleGrainsChange}
                options={grainsOptions}
                className={styles.dashboardTableBlockHeaderSelect}
                placeholder={t("dashboard.change-grains")}
              />
              <div className={styles.dashboardTableBlockHeaderSettings}>
                <Dropdown menu={{ items }} trigger={["click"]}>
                  <DashOutlined />
                </Dropdown>
              </div>
            </div>
            {view === "graph" ? (
              <ResponsiveContainer minHeight={400}>
                <PieChart>
                  <Pie
                    activeIndex={activeIndex}
                    activeShape={renderActiveShape}
                    data={dashboardCardStore.roundedGrainValues}
                    innerRadius={60}
                    outerRadius={80}
                    fill="#1677ff"
                    dataKey="count"
                    onMouseEnter={onPieEnter}
                  >
                    {dashboardCardStore.roundedGrainValues.map(
                      (entry, index) => (
                        <Cell
                          key={`cell-${index}`}
                          fill={COLORS[index % COLORS.length]}
                        />
                      )
                    )}
                  </Pie>
                </PieChart>
              </ResponsiveContainer>
            ) : dashboardCardStore.grainValues.length > 0 ? (
              <FastTableListed
                columns={columns}
                data={dashboardCardStore.grainValues}
                sorting={sorting}
                onSortingChange={setSorting}
              />
            ) : (
              <div>{t("dashboard.no-information")}</div>
            )}
          </Spin>
        </Card>
      </>
    );
  }
);
