import React from "react";
import { useTranslation } from "react-i18next";
import ReactJson from "react-json-view";
import { createColumnHelper } from "@tanstack/react-table";
import { t } from "i18next";
import {
  Button,
  Collapse,
  CollapseProps,
  Descriptions,
  DescriptionsProps,
  Flex,
  Spin,
  Tabs,
} from "antd";
import { FilterOutlined } from "@ant-design/icons";
import { GrainsSchema, MinionDetailSchema, PillarModel } from "@api/models";
import { CopyToClipboardButton } from "@packages/components/copy-to-clipboard-button/copy-to-clipboard-button";
import styles from "./minion-details.module.css";

type SimpleGrainKeys = {
  [K in keyof GrainsSchema as GrainsSchema[K] extends React.ReactNode
    ? K
    : never]: GrainsSchema[K];
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

const minionDetailsViewsToDescriptionItems = (
  minionDetailViews: MinionDetailView[],
  schema: MinionDetailSchema,
  onFilterButton?: (params: OnFilterButtonParams) => void
): DescriptionsProps["items"] => {
  return minionDetailViews.map((minionDetailView) => {
    if ("value" in minionDetailView) {
      return {
        key: minionDetailView.key,
        label: minionDetailView.name,
        children: minionDetailView.value(schema),
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
                // @ts-ignore
                title={t("dashboard.apply-value-to-filters")}
                onClick={() =>
                  onFilterButton({
                    name: minionDetailView.key,
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

const minionGeneralDetailViews: MinionDetailView[] = [
  // @ts-ignore
  { key: "id", name: t("minions.minion-id") },
  // @ts-ignore
  { key: "virtual", name: t("minions.virtualization") },
  // @ts-ignore
  { key: "osfullname", name: t("minions.os-full-name") },
  // @ts-ignore
  { key: "host", name: t("minions.hostname") },
  // @ts-ignore
  { key: "localhost", name: t("minions.local-hostname") },
  // @ts-ignore
  { key: "master", name: t("minions.salt-master") },
  // @ts-ignore
  { key: "domain", name: t("minions.domain") },
  // @ts-ignore
  { key: "fqdn", name: t("minions.fqdn") },
  // @ts-ignore
  { key: "uuid", name: t("minions.uuid") },
];

const minionGroupDetailsViews: MinionDetailViewGroup[] = [
  {
    // @ts-ignore
    name: t("minions.basic-configuration"),
    details: [
      // @ts-ignore
      { key: "cpu_model", name: t("minions.cpu-model") },
      // @ts-ignore
      { key: "num_cpus", name: t("minions.cpu-cores") },
      // @ts-ignore
      { key: "cpuarch", name: t("minions.cpu-architecture") },
      // @ts-ignore
      { key: "mem_total", name: t("minions.total-memory") },
      // @ts-ignore
      { key: "manufacturer", name: t("minions.manufacturer") },
      // @ts-ignore
      { key: "biosversion", name: t("minions.bios-version") },
      // @ts-ignore
      { key: "productname", name: t("minions.product-name") },
      // @ts-ignore
      { key: "serialnumber", name: t("minions.serial-number") },
      {
        key: "gpus",
        // @ts-ignore
        name: t("minions.gpus"),
        value: (s) =>
          (
            <>
              {s.grains.gpus?.map((gpu) => (
                <div key={gpu.model} className={styles.interfaceBlock}>
                  <div className={styles.interfaceDetails}>
                    <div>Vendor: {gpu.vendor || ""}</div>
                    <div>Model: {gpu.model || ""}</div>
                  </div>
                </div>
              )) || ""}
            </>
          ) || "",
      },
      // @ts-ignore
      { key: "zfs_support", name: t("minions.zfs-support") },
      // @ts-ignore
      { key: "zfs_feature_flags", name: t("minions.zfs-features") },
      // @ts-ignore
      { key: "efi_secure_boot", name: t("minions.efi-secure-boot") },
    ],
  },
  {
    // @ts-ignore
    name: t("minions.operation-system"),
    details: [
      // @ts-ignore
      { key: "os_family", name: t("minions.os-family") },
      // @ts-ignore
      { key: "osfullname", name: t("minions.os-full-name") },
      // @ts-ignore
      { key: "osfinger", name: "OS Fingerprint" },
      // @ts-ignore
      { key: "osrelease", name: t("minions.os-release") },
      // @ts-ignore
      { key: "kernel", name: t("minions.kernel") },
      // @ts-ignore
      { key: "kernelversion", name: t("minions.kernel-version") },
      // @ts-ignore
      { key: "kernelrelease", name: t("minions.kernel-release") },
      {
        key: "kernelparams",
        // @ts-ignore
        name: t("minions.kernel-parameters"),
        value: (s) =>
          s.grains.kernelparams?.map((p) => p.join("=")).join("\n") || "",
      },
    ],
  },
  {
    // @ts-ignore
    name: t("minions.environment"),
    details: [
      // @ts-ignore
      { key: "saltversion", name: t("minions.salt-version") },
      // @ts-ignore
      { key: "cwd", name: t("minions.current-working-directory") },
      // @ts-ignore
      { key: "ps", name: t("minions.process-viewer-path") },
      // @ts-ignore
      { key: "path", name: t("minions.system-path") },
      // @ts-ignore
      { key: "pythonexecutable", name: t("minions.python-executable") },
      // @ts-ignore
      { key: "saltpath", name: t("minions.salt-path") },
      // @ts-ignore
      { key: "zmqversion", name: t("minions.zero-mq-version") },
      // @ts-ignore
      { key: "shell", name: t("minions.shell") },
      // @ts-ignore
      { key: "username", name: t("minions.username") },
      // @ts-ignore
      { key: "pythonpath", name: t("minions.python-path") },
      // @ts-ignore
      { key: "systempath", name: t("minions.system-path-variables") },
      // @ts-ignore
      { key: "pythonversion", name: t("minions.python-version") },
      // @ts-ignore
      { key: "saltversioninfo", name: t("minions.salt-version-details") },
      {
        key: "defaultlanguage",
        // @ts-ignore
        name: t("minions.default-language"),
        value: (minionDetailSchema) => {
          return minionDetailSchema.grains.locale_info?.defaultlanguage ?? "";
        },
      },
      {
        key: "defaultencoding",
        // @ts-ignore
        name: t("minions.default-encoding"),
        value: (minionDetailSchema) => {
          return minionDetailSchema.grains.locale_info?.defaultencoding ?? "";
        },
      },
      {
        key: "detectedencoding",
        // @ts-ignore
        name: t("minions.detected-encoding"),
        value: (minionDetailSchema) => {
          return minionDetailSchema.grains.locale_info?.detectedencoding ?? "";
        },
      },
      {
        key: "timezone",
        // @ts-ignore
        name: t("minions.timezone"),
        value: (minionDetailSchema) => {
          return minionDetailSchema.grains.locale_info?.timezone ?? "";
        },
      },
    ],
  },
  {
    // @ts-ignore
    name: t("minions.storage"),
    details: [
      {
        key: "disks",
        // @ts-ignore
        name: t("minions.disks"),
        value: (s) => s.grains.disks?.join(", ") || "",
      },
      {
        key: "ssds",
        // @ts-ignore
        name: t("minions.ssd-drives"),
        value: (s) => s.grains.ssds?.join(", ") || "",
      },
      // @ts-ignore
      { key: "swap_total", name: t("minions.swap-total") },
    ],
  },
  {
    // @ts-ignore
    name: t("minions.network"),
    details: [
      // @ts-ignore
      { key: "ip4_gw", name: t("minions.ipv4-gateway") },
      // @ts-ignore
      { key: "nodename", name: t("minions.node-name") },
      {
        key: "interfaces",
        // @ts-ignore
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
                  <div>
                    MAC: {schema.grains.hwaddr_interfaces?.[iface] || ""}
                  </div>
                  <div>
                    IPv4:{" "}
                    {schema.grains.ip4_interfaces?.[iface]?.join(", ") || ""}
                  </div>
                  <div>
                    IPv6:{" "}
                    {schema.grains.ip6_interfaces?.[iface]?.join(", ") || ""}
                  </div>
                </div>
              </div>
            ))}
          </>
        ),
      },
    ],
  },
];

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
}) {
  const { t } = useTranslation();
  const combinedGrains = props.minion
    ? {
        ...props.minion.grains,
        ...props.minion.additional_grains,
      }
    : {};

  const items = [
    {
      key: "dashboard",
      label: t("minions.dashboard"),
      children: (() => {
        if (props.isMinionLoading) {
          return (
            <Flex
              justify={"center"}
              align={"center"}
              style={{ height: "100%" }}
            >
              <Spin />
            </Flex>
          );
        }
        if (!props.minion) {
          return (
            <Flex
              justify={"center"}
              align={"center"}
              style={{ height: "100%" }}
            >
              {t("minions.no-minion-data-available")}
            </Flex>
          );
        }
        return (
          <div className={styles.minionDetailsDashboard}>
            <Descriptions
              items={minionDetailsViewsToDescriptionItems(
                minionGeneralDetailViews,
                props.minion,
                props.onFilterButton
              )}
              bordered
            />
            <Collapse
              items={minionDetailViewGroupsToCollapseItems(
                minionGroupDetailsViews,
                props.minion,
                props.onFilterButton
              )}
            />
          </div>
        );
      })(),
    },
    {
      key: "grains",
      label: t("minions.grains"),
      children: (() => {
        if (props.isMinionLoading) {
          return (
            <Flex
              justify={"center"}
              align={"center"}
              style={{ height: "100%" }}
            >
              <Spin />
            </Flex>
          );
        }
        if (!props.minion) {
          return (
            <Flex
              justify={"center"}
              align={"center"}
              style={{ height: "100%" }}
            >
              {t("minions.no-minion-data-available")}
            </Flex>
          );
        }
        return (
          <div>
            <Flex justify="flex-end" style={{ marginBottom: 8 }}>
              <CopyToClipboardButton
                text={JSON.stringify(combinedGrains, null, 2)}
              />
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
    },
    /* {
      key: "pillars",
      label: "Pillars",
      children: (() => {
        if (props.isPillarsLoading) {
          return (
            <Flex
              justify={"center"}
              align={"center"}
              style={{ height: "100%" }}
            >
              <Spin />
            </Flex>
          );
        }
        if (!props.pillars || props.pillars.length === 0) {
          return (
            <Flex
              justify={"center"}
              align={"center"}
              style={{ height: "100%" }}
            >
              No pillars data available
            </Flex>
          );
        }
        return (
          <FastTablePaginated
            columns={pillarsColumns}
            data={props.pillars}
            total={props.pillars.length}
            pagination={{ pageSize: 10, pageIndex: 0 }}
            getRowId={(row) => row.name}
            onLazyLoad={() => {}}
          />
        );
      })(),
    }, */
  ];

  return <Tabs items={items} className={styles.minionsTabs} />;
}
