import { PillarTgtType, type PillarWithTgtInfoSchema } from "@saltbox/saltbox-core-api-client";
import { BooleanDisplay, RelativeTime } from "@saltbox/saltbox-frontend-common";
import { Alert, Flex } from "antd";
import { useMemo } from "react";
import { useTranslation } from "react-i18next";

import { PillarEditForm } from "saltbox-core/features/pillar/edit-pillar";
import { InfoDescriptions } from "saltbox-core/shared/ui/info-descriptions";
import { InfoDrawer } from "saltbox-core/shared/ui/info-drawer";

import styles from "./pillar-details-drawer.module.css";

export interface PillarDetailsDrawerProps {
  open: boolean;
  pillar: PillarWithTgtInfoSchema | null;
  onClose: () => void;
  onReplacePillar?: (updated: PillarWithTgtInfoSchema) => void;
}

export function PillarDetailsDrawer({
  open,
  pillar,
  onClose,
  onReplacePillar,
}: PillarDetailsDrawerProps) {
  const { t } = useTranslation();

  const {
    id,
    name,
    is_secret: isSecret,
    is_personal: isPersonal,
    tgt_info: tgtInfo,
    created,
    modified,
  } = pillar ?? {};

  const items = useMemo(
    () => [
      {
        key: "id",
        label: "ID",
        children: id,
      },
      {
        key: "name",
        label: t("pillar.details.name"),
        children: name,
      },
      {
        key: "target_type",
        label: t("pillar.details.target-type"),
        children: tgtInfo?.type,
      },
      {
        key: "target_id",
        label: t("pillar.details.target-id"),
        children: tgtInfo?.id,
      },
      {
        key: "target_name",
        label: t("pillar.details.target-name"),
        children:
          tgtInfo?.type === PillarTgtType.Minion
            ? (tgtInfo?.minion_id ?? tgtInfo?.id)
            : (tgtInfo?.title ?? tgtInfo?.id),
      },
      {
        key: "is_secret",
        label: t("pillar.details.secret"),
        children: <BooleanDisplay value={isSecret} />,
      },
      {
        key: "is_personal",
        label: t("pillar.details.personal"),
        children: <BooleanDisplay value={isPersonal} />,
      },
      {
        key: "created",
        label: t("pillar.details.created"),
        children: <RelativeTime date={created} />,
      },
      {
        key: "modified",
        label: t("pillar.details.modified"),
        children: <RelativeTime date={modified} />,
      },
    ],
    [created, id, isSecret, isPersonal, modified, name, t, tgtInfo]
  );

  return (
    <InfoDrawer open={open} onClose={onClose} titleName={name} titleLabel={t("pillar.title")}>
      <Flex className={styles.pillarDetailsDrawer} vertical gap="large">
        <InfoDescriptions items={items} />

        {isSecret ? (
          <Alert message={t("pillar.details.value-secret-message")} type="info" showIcon />
        ) : (
          <PillarEditForm pillar={pillar} onReplacePillar={onReplacePillar} />
        )}
      </Flex>
    </InfoDrawer>
  );
}
