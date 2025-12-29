import {
  FilterOutlined,
  MinusSquareOutlined,
  PlusSquareOutlined,
  SettingOutlined,
  CopyOutlined,
  CloseOutlined,
  ReloadOutlined,
} from "@ant-design/icons";
import {
  GrainsSchema,
  JobReturnModel,
  MinionDetailSchema,
  PillarModel,
} from "@saltbox/saltbox-core-api-client";
import {
  CopyToClipboardButton,
  FastTablePaginated,
  MatIcon,
  Popover,
  formatTimeByUserTZ,
} from "@saltbox/saltbox-frontend-common";
import {
  ColumnDef,
  PaginationState,
  Row,
  SortingState,
  createColumnHelper,
} from "@tanstack/react-table";
import {
  Button,
  Collapse,
  CollapseProps,
  Descriptions,
  DescriptionsProps,
  Dropdown,
  Flex,
  Spin,
  Tabs,
  Tag,
  message,
  type MenuProps,
  type TabsProps,
} from "antd";
import React, { useCallback, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import ReactJson from "react-json-view";
import { useNavigate } from "react-router";

import { JobModal } from "saltbox-core/shared/components/job-modal/job-modal";

import {
  extractStringValue,
  getShortJobReturnOutput,
  isSimpleStringData,
} from "../job-return-table/utils/job-return-utils";

import styles from "./minion-details.module.css";

type SimpleGrainKeys = {
  [K in keyof GrainsSchema as GrainsSchema[K] extends React.ReactNode ? K : never]: GrainsSchema[K];
};

interface MinionSimpleDetailView {
  key: keyof SimpleGrainKeys;
  name: string;
}

interface MinionExtendDetailView {
  key: string;
  value: (minionDetailSchema: MinionDetailSchema) => React.ReactNode;
  name: string;
}

type MinionDetailView = MinionSimpleDetailView | MinionExtendDetailView;

interface MinionDetailViewGroup {
  name: string;
  details: MinionDetailView[];
}

interface OnFilterButtonParams {
  name: string;
  value: any;
}

type JobReturnsConfig = {
  jobReturns: JobReturnModel[];
  isLoading: boolean;
  pagination: PaginationState;
  sorting: SortingState;
  total: number;
  onLazyLoad: (pagination: PaginationState, sorting: SortingState) => void;
};

const jobReturnsColumnHelper = createColumnHelper<JobReturnModel>();
const JobReturnsTable = FastTablePaginated<JobReturnModel>;

const KwargsPopoverButton = ({
  data,
  title,
  copySuccessMessage,
}: {
  data: Record<string, unknown>;
  title: string;
  copySuccessMessage: string;
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [messageApi, contextHolder] = message.useMessage();

  const handleCopy = useCallback(() => {
    navigator.clipboard.writeText(JSON.stringify(data, null, 2));
    messageApi.success(copySuccessMessage);
  }, [copySuccessMessage, data, messageApi]);

  return (
    <>
      {contextHolder}
      <Popover
        content={
          <div className={styles.kwargsPopoverContent}>
            <ReactJson
              displayDataTypes={false}
              enableClipboard={false}
              name={false}
              displayObjectSize={false}
              src={data}
              collapsed={1}
            />
          </div>
        }
        title={
          <Flex justify="space-between" align="center">
            <span>{title}</span>
            <Flex gap={8}>
              <Button type="link" icon={<CopyOutlined />} onClick={handleCopy} />
              <Button type="link" icon={<CloseOutlined />} onClick={() => setIsOpen(false)} />
            </Flex>
          </Flex>
        }
        trigger="click"
        overlayStyle={{ maxWidth: 700 }}
        placement="bottomRight"
        open={isOpen}
        onOpenChange={setIsOpen}
      >
        <Button
          type="link"
          size="small"
          icon={<MatIcon icon="search" />}
          className={styles.kwargsPopoverButton}
        />
      </Popover>
    </>
  );
};

const MinionJobReturnsTable = (props: JobReturnsConfig) => {
  const { t } = useTranslation();
  const navigate = useNavigate();

  const handleNavigateToJob = useCallback(
    (jobId: string | null | undefined) => {
      if (!jobId) {
        return;
      }
      navigate(`/job/${jobId}`);
    },
    [navigate]
  );

  const columns = useMemo<ColumnDef<JobReturnModel>[]>(
    () => [
      {
        id: "expander",
        header: () => null,
        cell: ({ row }: { row: Row<JobReturnModel> }) => {
          if (!row.getCanExpand()) {
            return null;
          }
          return (
            <Button
              icon={row.getIsExpanded() ? <MinusSquareOutlined /> : <PlusSquareOutlined />}
              size="small"
              type="link"
              onClick={row.getToggleExpandedHandler()}
            />
          );
        },
      },
      jobReturnsColumnHelper.accessor("jid", {
        header: t("jobs.table-jid"),
        cell: (data) => {
          const jid = data.getValue();
          if (!jid) {
            return "";
          }

          const jobReturn = data.row.original;

          return (
            <Flex gap={4} align="center">
              <Button type="link" size="small" onClick={() => handleNavigateToJob(jid)}>
                {jid}
              </Button>
              <CopyToClipboardButton text={jid} />
              <JobModal
                target={jobReturn.minion_id}
                targetType="glob"
                fun={jobReturn.fun}
                arg={jobReturn.fun_args || undefined}
                kwarg={jobReturn.fun_kwarg || undefined}
                defaultMaster={jobReturn.salt_master}
                buttonProps={{
                  type: "link",
                  size: "small",
                  icon: <ReloadOutlined />,
                  showText: false,
                  title: t("jobs.replay-job"),
                }}
              />
            </Flex>
          );
        },
      }),
      jobReturnsColumnHelper.accessor("retcode", {
        header: t("task.job-returns-table.table-success"),
        cell: (data) => (
          <Tag color={data.getValue() === 0 ? "green" : "red"}>
            {data.getValue() === 0
              ? t("task.job-returns-table.table-yes")
              : t("task.job-returns-table.table-no")}
          </Tag>
        ),
      }),
      jobReturnsColumnHelper.accessor("fun", {
        header: t("task.job-returns-table.table-fun"),
        cell: (data) => {
          const fun = data.getValue();
          if (!fun) {
            return "";
          }
          return fun;
        },
      }),
      jobReturnsColumnHelper.display({
        id: "kwargs",
        header: t("jobs.key-value-arguments"),
        cell: ({ row }) => {
          const rawKwargs = row.original.fun_kwarg;

          const isObjectKwargs =
            rawKwargs && typeof rawKwargs === "object" && !Array.isArray(rawKwargs);

          const kwargs = isObjectKwargs ? (rawKwargs as Record<string, unknown>) : undefined;
          const entries = kwargs ? Object.entries(kwargs) : [];
          const previewEntries = entries.slice(0, 3);
          const hasMore = entries.length > 3;

          const formatValue = (value: unknown) => {
            if (value === null || typeof value === "number" || typeof value === "boolean") {
              return String(value);
            }

            if (typeof value === "string") {
              return value.length > 24 ? `${value.slice(0, 21)}…` : value;
            }

            if (Array.isArray(value)) {
              const items = value.slice(0, 3).map((item) => {
                if (typeof item === "string") {
                  return item.length > 12 ? `${item.slice(0, 9)}…` : item;
                }
                if (typeof item === "number" || typeof item === "boolean") {
                  return String(item);
                }
                return "…";
              });
              return `[${items.join(", ")}${value.length > 3 ? ", …" : ""}]`;
            }

            if (typeof value === "object") {
              return "{…}";
            }

            return "";
          };

          return (
            <Flex align="center" gap={8} wrap className={styles.kwargsCell}>
              <Flex align="center" gap={4} wrap className={styles.kwargsPreview}>
                <Tag className={styles.kwargsTag}>
                  <span className={styles.kwargsBrace}>{"{"}</span>
                  {previewEntries.length > 0 ? (
                    previewEntries.map(([key, value], index) => (
                      <React.Fragment key={key}>
                        <span className={styles.kwargsKey}>{key}</span>
                        <span className={styles.kwargsSeparator}>: </span>
                        <span className={styles.kwargsValue}>{formatValue(value)}</span>
                        {index < previewEntries.length - 1 && (
                          <span className={styles.kwargsSeparator}>, </span>
                        )}
                      </React.Fragment>
                    ))
                  ) : (
                    <span className={styles.kwargsEmpty}>{t("jobs.no-key-value-arguments")}</span>
                  )}
                  {hasMore ? <span className={styles.kwargsEllipsis}>…</span> : null}
                  <span className={styles.kwargsBrace}>{"}"}</span>
                </Tag>
              </Flex>
              {entries.length > 0 ? (
                <KwargsPopoverButton
                  data={kwargs as Record<string, unknown>}
                  title={t("jobs.key-value-arguments")}
                  copySuccessMessage={t("jobs.table-copy-success")}
                />
              ) : null}
            </Flex>
          );
        },
      }),
      jobReturnsColumnHelper.accessor("stamp", {
        header: t("task.job-returns-table.table-timestamp"),
        cell: (data) => {
          const stamp = data.getValue();
          if (!stamp) {
            return "";
          }
          return formatTimeByUserTZ(stamp);
        },
      }),
    ],
    [handleNavigateToJob, t]
  );

  const renderJobResult = useCallback(({ row }: { row: Row<JobReturnModel> }) => {
    const dataToShow = getShortJobReturnOutput(row.original);

    // Режим JSON (по умолчанию)
    if (isSimpleStringData(dataToShow)) {
      const stringValue = extractStringValue(dataToShow);
      return <div className={styles.stringDataContainer}>{stringValue}</div>;
    }

    if (typeof dataToShow === "boolean") {
      return <div className={styles.stringDataContainer}>{dataToShow ? "True" : "False"}</div>;
    }

    const jsonValue =
      typeof dataToShow === "object" && dataToShow !== null ? dataToShow : { result: dataToShow };

    return (
      <div className={styles.reactJsonContainer}>
        <ReactJson
          displayDataTypes={false}
          enableClipboard={false}
          name={false}
          displayObjectSize={false}
          src={jsonValue as Record<string, unknown>}
          collapsed={1}
        />
      </div>
    );
  }, []);

  return (
    <div className={styles.jobReturnsTableWrapper}>
      <JobReturnsTable
        columns={columns}
        data={props.jobReturns}
        total={props.total}
        isLoading={props.isLoading}
        pagination={props.pagination}
        sorting={props.sorting}
        onLazyLoad={props.onLazyLoad}
        getRowId={(row) => row.id}
        useVirtualScroll={false}
        renderSubComponent={renderJobResult}
        getRowCanExpand={() => true}
      />
    </div>
  );
};

const minionDetailsViewsToDescriptionItems = (
  t: any,
  minionDetailViews: MinionDetailView[],
  schema: MinionDetailSchema,
  onFilterButton?: (params: OnFilterButtonParams) => void
): DescriptionsProps["items"] => {
  return minionDetailViews.map((minionDetailView) => {
    if ("value" in minionDetailView) {
      const grainValue = minionDetailView.value(schema);

      if (typeof grainValue === "object") {
        return {
          key: minionDetailView.key,
          label: minionDetailView.name,
          children: grainValue,
          span: 3,
        };
      }

      return {
        key: minionDetailView.key,
        label: minionDetailView.name,
        children: (
          <Flex justify="space-between" className="minion-details-grain">
            <Flex className="minion-details-grain-name">{grainValue}</Flex>
            {grainValue && (
              <Flex className={styles.minionDetailsGrainButtons}>
                <CopyToClipboardButton text={String(grainValue)} />
              </Flex>
            )}
          </Flex>
        ),
        span: 3,
      };
    }
    const grainValue = schema.grains[minionDetailView.key];
    return {
      key: minionDetailView.key,
      label: minionDetailView.name,
      children: grainValue ? (
        <Flex justify="space-between" className="minion-details-grain">
          <Flex className="minion-details-grain-name">{grainValue}</Flex>
          <Flex gap={8} className={styles.minionDetailsGrainButtons}>
            <CopyToClipboardButton text={String(grainValue)} />
            {onFilterButton && (
              <Button
                size="small"
                icon={<FilterOutlined />}
                shape="circle"
                type="primary"
                title={t("dashboard.apply-value-to-filters")}
                onClick={() =>
                  onFilterButton({
                    name: String(minionDetailView.key),
                    value: grainValue,
                  })
                }
              />
            )}
          </Flex>
        </Flex>
      ) : (
        ""
      ),
      span: 3,
    };
  });
};

const minionDetailViewGroupsToCollapseItems = (
  t: any,
  minionDetailViewGroups: MinionDetailViewGroup[],
  schema: MinionDetailSchema,
  onFilterButton?: (params: OnFilterButtonParams) => void
): CollapseProps["items"] => {
  return minionDetailViewGroups.map((minionDetailViewGroup) => {
    return {
      key: minionDetailViewGroup.name,
      label: minionDetailViewGroup.name,
      children: (
        <Descriptions
          items={minionDetailsViewsToDescriptionItems(
            t,
            minionDetailViewGroup.details,
            schema,
            onFilterButton
          )}
          bordered
        />
      ),
    };
  });
};

const columnHelper = createColumnHelper<PillarModel>();

const pillarsColumns = [
  columnHelper.accessor("name", {
    header: "Name",
  }),
  columnHelper.accessor("value", {
    header: "Value",
  }),
];

export function MinionDetails(props: {
  minion: MinionDetailSchema | null;
  isMinionLoading: boolean;
  pillars: PillarModel[] | null;
  isPillarsLoading: boolean;
  onFilterButton?: (params: OnFilterButtonParams) => void;
  jobReturnsConfig?: JobReturnsConfig;
  isFullView?: boolean;
  pillarsTabActions?: React.ReactNode;
  jobReturnsTabActions?: React.ReactNode;
  fullViewActionsMenuItems?: MenuProps["items"];
  onFullViewActionsMenuClick?: MenuProps["onClick"];
  jobReturnsFilter?: React.ReactNode;
  jobReturnsFilterButton?: React.ReactNode;
}) {
  const { t } = useTranslation();
  const [activeTab, setActiveTab] = useState<string>("dashboard");
  const combinedGrains = props.minion
    ? {
        ...props.minion.grains,
        ...props.minion.additional_grains,
      }
    : {};

  const minionGeneralDetailViews: MinionDetailView[] = [
    { key: "id", name: t("minions.minion-id") },
    { key: "virtual", name: t("minions.virtualization") },
    { key: "osfullname", name: t("minions.os-full-name") },
    { key: "host", name: t("minions.hostname") },
    { key: "localhost", name: t("minions.local-hostname") },
    { key: "master", name: t("minions.salt-master") },
    { key: "domain", name: t("minions.domain") },
    { key: "fqdn", name: t("minions.fqdn") },
    { key: "uuid", name: t("minions.uuid") },
  ];

  const minionGroupDetailsViews: MinionDetailViewGroup[] = [
    {
      name: t("minions.basic-configuration"),
      details: [
        { key: "cpu_model", name: t("minions.cpu-model") },
        { key: "num_cpus", name: t("minions.cpu-cores") },
        { key: "cpuarch", name: t("minions.cpu-architecture") },
        { key: "mem_total", name: t("minions.total-memory") },
        { key: "manufacturer", name: t("minions.manufacturer") },
        { key: "biosversion", name: t("minions.bios-version") },
        { key: "productname", name: t("minions.product-name") },
        { key: "serialnumber", name: t("minions.serial-number") },
        {
          key: "gpus",
          name: t("minions.gpus"),
          value: (s) =>
            (
              <>
                {Array.isArray(s.grains.gpus)
                  ? s.grains.gpus.map((gpu: any) => (
                      <div key={gpu.model} className={styles.interfaceBlock}>
                        <div className={styles.interfaceDetails}>
                          <div>Vendor: {gpu.vendor || ""}</div>
                          <div>Model: {gpu.model || ""}</div>
                        </div>
                      </div>
                    ))
                  : ""}
              </>
            ) || "",
        },
        { key: "zfs_support", name: t("minions.zfs-support") },
        { key: "zfs_feature_flags", name: t("minions.zfs-features") },
        { key: "efi_secure_boot", name: t("minions.efi-secure-boot") },
      ],
    },
    {
      name: t("minions.operation-system"),
      details: [
        { key: "os_family", name: t("minions.os-family") },
        { key: "osfullname", name: t("minions.os-full-name") },
        { key: "osfinger", name: "OS Fingerprint" },
        { key: "osrelease", name: t("minions.os-release") },
        { key: "kernel", name: t("minions.kernel") },
        { key: "kernelversion", name: t("minions.kernel-version") },
        { key: "kernelrelease", name: t("minions.kernel-release") },
        {
          key: "kernelparams",
          name: t("minions.kernel-parameters"),
          value: (s) =>
            Object.entries(s.grains.kernelparams || {})
              .map(([key, value]) => `${key}=${value}`)
              .join("\n") || "",
        },
      ],
    },
    {
      name: t("minions.environment"),
      details: [
        { key: "saltversion", name: t("minions.salt-version") },
        { key: "cwd", name: t("minions.current-working-directory") },
        { key: "ps", name: t("minions.process-viewer-path") },
        { key: "path", name: t("minions.system-path") },
        { key: "pythonexecutable", name: t("minions.python-executable") },
        { key: "saltpath", name: t("minions.salt-path") },
        { key: "zmqversion", name: t("minions.zero-mq-version") },
        { key: "shell", name: t("minions.shell") },
        { key: "username", name: t("minions.username") },
        { key: "pythonpath", name: t("minions.python-path") },
        { key: "systempath", name: t("minions.system-path-variables") },
        { key: "pythonversion", name: t("minions.python-version") },
        { key: "saltversioninfo", name: t("minions.salt-version-details") },
        {
          key: "defaultlanguage",
          name: t("minions.default-language"),
          value: (minionDetailSchema) => {
            const localeInfo = minionDetailSchema.grains.locale_info as any;
            return localeInfo?.defaultlanguage ?? "";
          },
        },
        {
          key: "defaultencoding",
          name: t("minions.default-encoding"),
          value: (minionDetailSchema) => {
            const localeInfo = minionDetailSchema.grains.locale_info as any;
            return localeInfo?.defaultencoding ?? "";
          },
        },
        {
          key: "detectedencoding",
          name: t("minions.detected-encoding"),
          value: (minionDetailSchema) => {
            const localeInfo = minionDetailSchema.grains.locale_info as any;
            return localeInfo?.detectedencoding ?? "";
          },
        },
        {
          key: "timezone",
          name: t("minions.timezone"),
          value: (minionDetailSchema) => {
            const localeInfo = minionDetailSchema.grains.locale_info as any;
            return localeInfo?.timezone ?? "";
          },
        },
      ],
    },
    {
      name: t("minions.storage"),
      details: [
        {
          key: "disks",
          name: t("minions.disks"),
          value: (s) => {
            const disks = s.grains.disks as any;
            return Array.isArray(disks) ? disks.join(", ") : "";
          },
        },
        {
          key: "ssds",
          name: t("minions.ssd-drives"),
          value: (s) => {
            const ssds = s.grains.ssds as any;
            return Array.isArray(ssds) ? ssds.join(", ") : "";
          },
        },
        { key: "swap_total", name: t("minions.swap-total") },
      ],
    },
    {
      name: t("minions.network"),
      details: [
        { key: "ip4_gw", name: t("minions.ipv4-gateway") },
        { key: "nodename", name: t("minions.node-name") },
        {
          key: "interfaces",
          name: t("minions.network-interfaces"),
          value: (schema) => (
            <>
              {Object.entries({
                ...schema.grains.ip4_interfaces,
                ...schema.grains.ip6_interfaces,
                ...schema.grains.hwaddr_interfaces,
              }).map(([iface]) => (
                <div key={iface} className={styles.interfaceBlock}>
                  <div>{iface}</div>
                  <div className={styles.interfaceDetails}>
                    <div>MAC: {schema.grains.hwaddr_interfaces?.[iface] || ""}</div>
                    <div>IPv4: {schema.grains.ip4_interfaces?.[iface]?.join(", ") || ""}</div>
                    <div>IPv6: {schema.grains.ip6_interfaces?.[iface]?.join(", ") || ""}</div>
                  </div>
                </div>
              ))}
            </>
          ),
        },
      ],
    },
  ];

  const isFullView = props.isFullView ?? false;
  const pillarsData = props.pillars ?? [];
  const pillarsTotal = props.pillars?.length ?? 0;

  const fullViewActions = isFullView
    ? {
        right: (
          <div className={styles.tabExtraActions}>
            <Flex gap={8}>
              {activeTab === "job-returns" && props.jobReturnsFilterButton}
              {props.fullViewActionsMenuItems && (
                <Dropdown
                  menu={{
                    items: props.fullViewActionsMenuItems,
                    onClick: props.onFullViewActionsMenuClick,
                  }}
                  trigger={["click"]}
                >
                  <Button>
                    <Flex gap={8} align="center">
                      <SettingOutlined />
                    </Flex>
                  </Button>
                </Dropdown>
              )}
            </Flex>
          </div>
        ),
      }
    : undefined;

  const items: TabsProps["items"] = [];

  items.push({
    key: "dashboard",
    label: t("minions.dashboard"),
    children: (() => {
      if (props.isMinionLoading) {
        return (
          <Flex justify={"center"} align={"center"} style={{ height: "100%" }}>
            <Spin />
          </Flex>
        );
      }
      if (!props.minion) {
        return (
          <Flex justify={"center"} align={"center"} style={{ height: "100%" }}>
            {t("minions.no-minion-data-available")}
          </Flex>
        );
      }
      return (
        <div className={styles.minionDetailsDashboard}>
          <Descriptions
            items={minionDetailsViewsToDescriptionItems(
              t,
              minionGeneralDetailViews,
              props.minion,
              props.onFilterButton
            )}
            bordered
          />
          <Collapse
            items={minionDetailViewGroupsToCollapseItems(
              t,
              minionGroupDetailsViews,
              props.minion,
              props.onFilterButton
            )}
          />
        </div>
      );
    })(),
  });

  if (props.jobReturnsConfig) {
    items.push({
      key: "job-returns",
      label: t("minions.job-returns"),
      children: (
        <div className={styles.jobReturnsWrapper}>
          {props.jobReturnsFilter && (
            <div className={styles.jobReturnsFilterWrapper}>{props.jobReturnsFilter}</div>
          )}
          {isFullView && props.jobReturnsTabActions ? (
            <div className="page-actions-buttons">{props.jobReturnsTabActions}</div>
          ) : null}
          <MinionJobReturnsTable {...props.jobReturnsConfig} />
        </div>
      ),
    });
  }

  items.push({
    key: "pillars",
    label: "Pillars",
    className: styles.pillarsTab,
    children: (() => {
      return (
        <div className={styles.pillarsTabContent}>
          {isFullView && props.pillarsTabActions ? (
            <div className="page-actions-buttons">{props.pillarsTabActions}</div>
          ) : null}
          <FastTablePaginated
            isLoading={props.isPillarsLoading}
            columns={pillarsColumns}
            data={pillarsData}
            total={pillarsTotal}
            pagination={{ pageSize: 10, pageIndex: 0 }}
            getRowId={(row) => row.name}
            onLazyLoad={() => {}}
          />
        </div>
      );
    })(),
  });

  items.push({
    key: "grains",
    label: t("minions.grains"),
    children: (() => {
      if (props.isMinionLoading) {
        return (
          <Flex justify={"center"} align={"center"} style={{ height: "100%" }}>
            <Spin />
          </Flex>
        );
      }
      if (!props.minion) {
        return (
          <Flex justify={"center"} align={"center"} style={{ height: "100%" }}>
            {t("minions.no-minion-data-available")}
          </Flex>
        );
      }
      return (
        <div>
          <Flex justify="flex-end" style={{ marginBottom: 8 }}>
            <CopyToClipboardButton text={JSON.stringify(combinedGrains, null, 2)} />
          </Flex>
          <ReactJson
            displayDataTypes={false}
            enableClipboard={false}
            name={false}
            displayObjectSize={false}
            src={combinedGrains}
            collapsed={1}
          />
        </div>
      );
    })(),
  });

  return (
    <Tabs
      items={items}
      className={styles.minionsTabs}
      tabBarExtraContent={fullViewActions}
      onChange={(key) => setActiveTab(key)}
      activeKey={activeTab}
    />
  );
}
