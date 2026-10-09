import { MinionDetailSchema } from "@saltbox/saltbox-core-api-client";
import {
  CopyToClipboardButton,
  FilterActionButton,
  formatInfoCardTextValue,
  InfoCardsGrid,
  type InfoCardsGridProps,
  InfoDescriptions,
  type InfoDescriptionsProps,
} from "@saltbox/saltbox-frontend-common";
import { Collapse, type CollapseProps, Flex, Spin, Typography, type FlexProps } from "antd";
import { useMemo, type ReactNode } from "react";
import { useTranslation } from "react-i18next";

import { MinionLastActivityCell } from "saltbox-core/shared/components/minion-last-activity";
import { transformGrainValueToString } from "saltbox-core/shared/utils/transform-grain-value-to-string";

import { MINION_DASHBOARD_SUMMARY_TILES } from "../../constants/dashboard-summary-tiles";
import type { OnFilterButtonHandler } from "../../types/minion-details-props";

import styles from "./minion-dashboard-tab.module.css";

type SimpleGrainKeys = {
  [K in keyof MinionDetailSchema["grains"] as MinionDetailSchema["grains"][K] extends ReactNode
    ? K
    : never]: MinionDetailSchema["grains"][K];
};

interface MinionSimpleDetailView {
  key: keyof SimpleGrainKeys;
  name: string;
  itemProps?: Partial<InfoDescriptionsProps["items"][number]> & {
    grainValueProps?: Partial<FlexProps>;
  };
}

interface MinionExtendDetailView {
  key: string;
  value: (minionDetailSchema: MinionDetailSchema) => ReactNode;
  name: string;
  itemProps?: Partial<InfoDescriptionsProps["items"][number]> & {
    grainValueProps?: Partial<FlexProps>;
  };
}

type MinionDetailView = MinionSimpleDetailView | MinionExtendDetailView;

interface MinionDetailViewGroup {
  name: string;
  details: MinionDetailView[];
}

interface MinionDashboardTabProps {
  minion: MinionDetailSchema | null;
  isMinionLoading: boolean;
  isInDrawer?: boolean;
  onFilterButton?: OnFilterButtonHandler;
}

const transformValueToString = (value: unknown): string => {
  return transformGrainValueToString(value as ReactNode);
};

const renderArrayValue = (value: unknown[], keyPrefix: string): ReactNode => {
  return (
    <Flex vertical>
      {value.map((item, index) => (
        <div key={`${keyPrefix}-${index}`}>{transformValueToString(item)}</div>
      ))}
    </Flex>
  );
};

const minionDetailsViewsToDescriptionItems = (
  minionDetailViews: MinionDetailView[],
  schema: MinionDetailSchema,
  onFilterButton?: OnFilterButtonHandler
): InfoDescriptionsProps["items"] => {
  const grainNameClassName = `minion-details-grain-name ${styles.minionDetailsGrainName}`;

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
            <Flex className={grainNameClassName} {...grainValueProps}>
              {grainValue}
            </Flex>
            <Flex className={styles.minionDetailsGrainButtons}>
              {grainValueString !== "" && <CopyToClipboardButton text={grainValueString} />}
            </Flex>
          </Flex>
        ),
        ...restItemProps,
      };
    }

    const grainValue = schema.grains[minionDetailView.key];
    const isGrainValueArray = Array.isArray(grainValue);
    const grainValueString = isGrainValueArray
      ? grainValue.map((item) => transformValueToString(item)).join("\n")
      : transformValueToString(grainValue);
    const filterFieldName = `grains.${String(minionDetailView.key)}`;
    const canFilter = !!onFilterButton?.canApply(filterFieldName, grainValue);
    const isActive = !!onFilterButton?.isActive(filterFieldName, grainValue);

    return {
      key: minionDetailView.key,
      label: minionDetailView.name,
      children: grainValue ? (
        <Flex justify="space-between" className="minion-details-grain">
          <Flex className={grainNameClassName}>
            {isGrainValueArray
              ? renderArrayValue(grainValue, String(minionDetailView.key))
              : grainValue}
          </Flex>
          <Flex gap={2} className={styles.minionDetailsGrainButtons}>
            <CopyToClipboardButton text={grainValueString} />
            {canFilter && onFilterButton && (
              <FilterActionButton
                active={isActive}
                onClick={() =>
                  onFilterButton({
                    name: filterFieldName,
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
      ...restItemProps,
    };
  });
};

const minionDetailViewGroupsToCollapseItems = (
  minionDetailViewGroups: MinionDetailViewGroup[],
  schema: MinionDetailSchema,
  onFilterButton?: OnFilterButtonHandler
): CollapseProps["items"] => {
  return minionDetailViewGroups.map((minionDetailViewGroup) => {
    return {
      key: minionDetailViewGroup.name,
      label: minionDetailViewGroup.name,
      children: (
        <InfoDescriptions
          items={minionDetailsViewsToDescriptionItems(
            minionDetailViewGroup.details,
            schema,
            onFilterButton
          )}
        />
      ),
    };
  });
};

export function MinionDashboardTab({
  minion,
  isMinionLoading,
  isInDrawer = false,
  onFilterButton,
}: MinionDashboardTabProps) {
  const { t } = useTranslation();

  const infoCardItems = useMemo((): InfoCardsGridProps["items"] => {
    if (!minion) {
      return [];
    }

    return MINION_DASHBOARD_SUMMARY_TILES.map((tile) => {
      const title = t(tile.labelKey);

      if (tile.kind === "lastActivity") {
        return {
          key: tile.labelKey,
          title,
          value: (
            <MinionLastActivityCell
              date={minion.last_activity}
              lastActivitySeconds={minion.last_activity_seconds}
              fallback={<>{t("minions.never-synced")}</>}
            />
          ),
        };
      }

      const grainValue = minion.grains[tile.grainKey];
      const copyText = transformGrainValueToString(grainValue as ReactNode);

      return {
        key: tile.grainKey,
        title,
        value: formatInfoCardTextValue(copyText),
        copyText: copyText.trim() !== "" ? copyText : undefined,
      };
    });
  }, [minion, t]);

  const minionGeneralDetailViews: MinionDetailView[] = [
    { key: "virtual", name: t("minions.virtualization") },
    { key: "localhost", name: t("minions.local-hostname") },
    { key: "master", name: t("minions.salt-master") },
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
                  ? s.grains.gpus.map((gpu) => (
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
            const localeInfo = minionDetailSchema.grains.locale_info;
            return localeInfo?.defaultlanguage ?? "";
          },
        },
        {
          key: "defaultencoding",
          name: t("minions.default-encoding"),
          value: (minionDetailSchema) => {
            const localeInfo = minionDetailSchema.grains.locale_info;
            return localeInfo?.defaultencoding ?? "";
          },
        },
        {
          key: "detectedencoding",
          name: t("minions.detected-encoding"),
          value: (minionDetailSchema) => {
            const localeInfo = minionDetailSchema.grains.locale_info;
            return localeInfo?.detectedencoding ?? "";
          },
        },
        {
          key: "timezone",
          name: t("minions.timezone"),
          value: (minionDetailSchema) => {
            const localeInfo = minionDetailSchema.grains.locale_info;
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
            const disks = s.grains.disks;
            return Array.isArray(disks) ? renderArrayValue(disks, "disks") : "";
          },
        },
        {
          key: "ssds",
          name: t("minions.ssd-drives"),
          value: (s) => {
            const ssds = s.grains.ssds;
            return Array.isArray(ssds) ? renderArrayValue(ssds, "ssds") : "";
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
    <Flex vertical gap="large">
      <InfoCardsGrid
        items={infoCardItems}
        colProps={isInDrawer ? { span: 12 } : { xs: 12, xl: 6 }}
      />

      <InfoDescriptions
        items={minionDetailsViewsToDescriptionItems(
          minionGeneralDetailViews,
          minion,
          onFilterButton
        )}
      />

      <Collapse
        items={minionDetailViewGroupsToCollapseItems(
          minionGroupDetailsViews,
          minion,
          onFilterButton
        )}
      />
    </Flex>
  );
}
