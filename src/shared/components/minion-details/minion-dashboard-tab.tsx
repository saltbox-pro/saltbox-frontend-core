import { FilterOutlined } from "@ant-design/icons";
import { MinionDetailSchema } from "@saltbox/saltbox-core-api-client";
import { CopyToClipboardButton } from "@saltbox/saltbox-frontend-common";
import {
  Button,
  Collapse,
  CollapseProps,
  Descriptions,
  DescriptionsProps,
  Flex,
  Spin,
  Typography,
  type FlexProps,
} from "antd";
import React from "react";
import { useTranslation } from "react-i18next";

import { transformGrainValueToString } from "saltbox-core/shared/utils/transform-grain-value-to-string";

import styles from "./minion-dashboard-tab.module.css";

type SimpleGrainKeys = {
  [K in keyof MinionDetailSchema["grains"] as MinionDetailSchema["grains"][K] extends React.ReactNode
    ? K
    : never]: MinionDetailSchema["grains"][K];
};

interface MinionSimpleDetailView {
  key: keyof SimpleGrainKeys;
  name: string;
  itemProps?: Partial<DescriptionsProps["items"][number]> & {
    grainValueProps?: Partial<FlexProps>;
  };
}

interface MinionExtendDetailView {
  key: string;
  value: (minionDetailSchema: MinionDetailSchema) => React.ReactNode;
  name: string;
  itemProps?: Partial<DescriptionsProps["items"][number]> & {
    grainValueProps?: Partial<FlexProps>;
  };
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

interface MinionDashboardTabProps {
  minion: MinionDetailSchema | null;
  isMinionLoading: boolean;
  onFilterButton?: (params: OnFilterButtonParams) => void;
}

const minionDetailsViewsToDescriptionItems = (
  t: any,
  minionDetailViews: MinionDetailView[],
  schema: MinionDetailSchema,
  onFilterButton?: (params: OnFilterButtonParams) => void
): DescriptionsProps["items"] => {
  return minionDetailViews.map((minionDetailView) => {
    const { grainValueProps, ...restItemProps } = minionDetailView.itemProps ?? {};

    if ("value" in minionDetailView) {
      const grainValue = minionDetailView.value(schema);
      const grainValueString = transformGrainValueToString(grainValue);

      return {
        key: minionDetailView.key,
        label: minionDetailView.name,
        children: (
          <Flex justify="space-between" className="minion-details-grain">
            <Flex className="minion-details-grain-name" {...grainValueProps}>
              {grainValue}
            </Flex>
            <Flex className={styles.minionDetailsGrainButtons}>
              {grainValueString !== "" && <CopyToClipboardButton text={grainValueString} />}
            </Flex>
          </Flex>
        ),
        span: 3,
        ...restItemProps,
      };
    }

    const grainValue = schema.grains[minionDetailView.key];
    return {
      key: minionDetailView.key,
      label: minionDetailView.name,
      children: grainValue ? (
        <Flex justify="space-between" className="minion-details-grain">
          <Flex className="minion-details-grain-name">{grainValue}</Flex>
          <Flex gap={2} className={styles.minionDetailsGrainButtons}>
            <CopyToClipboardButton text={grainValue} />
            {onFilterButton && (
              <Button
                size="small"
                icon={<FilterOutlined />}
                color="default"
                variant="outlined"
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
      ...restItemProps,
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

export function MinionDashboardTab({
  minion,
  isMinionLoading,
  onFilterButton,
}: MinionDashboardTabProps) {
  const { t } = useTranslation();

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
          itemProps: { styles: { label: { verticalAlign: "top" } }, grainValueProps: { flex: 1 } },
          value: (schema) => (
            <Flex wrap style={{ flexGrow: 1 }}>
              {Object.entries({
                ...schema.grains.ip4_interfaces,
                ...schema.grains.ip6_interfaces,
                ...schema.grains.hwaddr_interfaces,
              }).map(([iface]) => (
                <Flex vertical key={iface} className={styles.interfaceBlock} flex="0 1 330px">
                  <Typography.Text italic>{iface}</Typography.Text>

                  <ul className={styles.interfaceDetails}>
                    <li>MAC: {schema.grains.hwaddr_interfaces?.[iface] || ""}</li>
                    <li>IPv4: {schema.grains.ip4_interfaces?.[iface]?.join(", ") || ""}</li>
                    <li>IPv6: {schema.grains.ip6_interfaces?.[iface]?.join(", ") || ""}</li>
                  </ul>
                </Flex>
              ))}
            </Flex>
          ),
        },
      ],
    },
  ];

  if (isMinionLoading) {
    return (
      <Flex justify="center" align="center" style={{ height: "100%" }}>
        <Spin />
      </Flex>
    );
  }

  if (!minion) {
    return (
      <Flex justify="center" align="center" style={{ height: "100%" }}>
        {t("minions.no-minion-data-available")}
      </Flex>
    );
  }

  return (
    <Flex vertical gap={10} className={styles.minionDetailsDashboard}>
      <Descriptions
        items={minionDetailsViewsToDescriptionItems(
          t,
          minionGeneralDetailViews,
          minion,
          onFilterButton
        )}
        bordered
      />
      <Collapse
        items={minionDetailViewGroupsToCollapseItems(
          t,
          minionGroupDetailsViews,
          minion,
          onFilterButton
        )}
      />
    </Flex>
  );
}
