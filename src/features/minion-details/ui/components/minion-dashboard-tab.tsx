import { MinionDetailSchema } from "@saltbox/saltbox-core-api-client";
import {
  formatInfoCardTextValue,
  InfoCardsGrid,
  type InfoCardsGridProps,
  InfoDescriptions,
} from "@saltbox/saltbox-frontend-common";
import { Alert, Collapse, Flex, Spin, Typography } from "antd";
import { useMemo, type ReactNode } from "react";
import { useTranslation } from "react-i18next";

import { MasterLink } from "saltbox-core/features/masters";
import { MinionLastActivityCell } from "saltbox-core/shared/components/minion-last-activity";
import {
  getMinionActivityStatus,
  isMinionNeverActive,
} from "saltbox-core/shared/helpers/minion-activity";
import { transformGrainValueToString } from "saltbox-core/shared/utils/transform-grain-value-to-string";

import { MINION_DASHBOARD_SUMMARY_TILES } from "../../constants/dashboard-summary-tiles";
import type { MinionCollectionsTreeStore } from "../../store/minion-collections-tree-store";
import type { OnFilterButtonHandler } from "../../types/minion-details-props";
import {
  minionDetailViewGroupsToCollapseItems,
  minionDetailsViewsToDescriptionItems,
  renderArrayValue,
  type MinionDetailView,
  type MinionDetailViewGroup,
} from "../helpers/minion-dashboard-detail-views";

import { MinionCollectionsSection } from "./minion-collections-section";
import styles from "./minion-dashboard-tab.module.css";

interface MinionDashboardTabProps {
  minion: MinionDetailSchema | null;
  isMinionLoading: boolean;
  isInDrawer?: boolean;
  collectionSlug: string;
  collectionsTreeStore: MinionCollectionsTreeStore;
  onFilterButton?: OnFilterButtonHandler;
  onOpenCollection?: (slug: string) => void;
}

export function MinionDashboardTab({
  minion,
  isMinionLoading,
  isInDrawer = false,
  collectionSlug,
  collectionsTreeStore,
  onFilterButton,
  onOpenCollection,
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
              status={getMinionActivityStatus(minion)}
              fallback={<>{t("minions.never-synced")}</>}
            />
          ),
        };
      }

      if (tile.kind === "minionId") {
        return {
          key: tile.labelKey,
          title,
          value: formatInfoCardTextValue(minion.minion_id),
          copyText: minion.minion_id || undefined,
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
    { key: "host", name: t("minions.hostname") },
    { key: "fqdn", name: t("minions.fqdn") },
    { key: "uuid", name: t("minions.uuid") },
    {
      key: "minion-master",
      name: t("minions.salt-master"),
      value: (schema) => schema.master,
      render: (schema) => <MasterLink masterId={schema.master} />,
      filterField: "master",
    },
    { key: "master", name: t("minions.salt-master-grains") },
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
          value: (s) => {
            const gpus = s.grains.gpus;
            if (!Array.isArray(gpus) || gpus.length === 0) {
              return null;
            }
            return (
              <Flex>
                {gpus.map((gpu) => (
                  <div key={gpu.model} className={styles.interfaceBlock}>
                    <div className={styles.interfaceDetails}>
                      <div>Vendor: {gpu.vendor || ""}</div>
                      <div>Model: {gpu.model || ""}</div>
                    </div>
                  </div>
                ))}
              </Flex>
            );
          },
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
          itemProps: { styles: { label: { verticalAlign: "top" } } },
          value: (schema) => {
            const interfaceNames = Object.keys({
              ...schema.grains.ip4_interfaces,
              ...schema.grains.ip6_interfaces,
              ...schema.grains.hwaddr_interfaces,
            });
            if (interfaceNames.length === 0) {
              return null;
            }
            return (
              <Flex wrap style={{ flexGrow: 1 }}>
                {interfaceNames.map((iface) => (
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
            );
          },
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

  const isNeverActive = isMinionNeverActive(minion);

  return (
    <Flex vertical gap="large">
      {isNeverActive && <Alert type="info" showIcon message={t("minions.never-active-alert")} />}

      <InfoCardsGrid
        items={infoCardItems}
        colProps={isInDrawer ? { span: 12 } : { xs: 12, xl: 6 }}
      />

      <InfoDescriptions
        items={[
          ...minionDetailsViewsToDescriptionItems(minionGeneralDetailViews, {
            schema: minion,
            onFilterButton,
          }),
          {
            key: "minion-collections",
            label: t("minions.minion-collections"),
            styles: { label: { verticalAlign: "top" } },
            children: (
              <MinionCollectionsSection
                minionInnerId={minion.id}
                collectionsTreeStore={collectionsTreeStore}
                activeCollectionSlug={isInDrawer ? collectionSlug : undefined}
                onOpenCollection={onOpenCollection}
              />
            ),
          },
        ]}
      />

      {!isNeverActive && (
        <Collapse
          items={minionDetailViewGroupsToCollapseItems(minionGroupDetailsViews, {
            schema: minion,
            onFilterButton,
          })}
        />
      )}
    </Flex>
  );
}
