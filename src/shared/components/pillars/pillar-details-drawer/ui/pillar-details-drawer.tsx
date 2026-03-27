import { PillarTgtType, type PillarWithTgtInfoSchema } from "@saltbox/saltbox-core-api-client";
import {
  BooleanDisplay,
  InfoDescriptions,
  type InfoDescriptionsProps,
  InfoDrawer,
  type InfoDrawerProps,
  RelativeTime,
} from "@saltbox/saltbox-frontend-common";
import { Alert, Flex } from "antd";
import { useMemo } from "react";
import { useTranslation } from "react-i18next";

import { PillarDeleteBlock } from "saltbox-core/features/pillar/delete-pillar";
import { PillarEditForm } from "saltbox-core/features/pillar/edit-pillar";

import styles from "./pillar-details-drawer.module.css";

export interface PillarDetailsDrawerProps extends Omit<
  InfoDrawerProps,
  "titleName" | "titleLabel" | "linkTo" | "linkTitle" | "linkComponent" | "children"
> {
  pillar: PillarWithTgtInfoSchema | null;
  onReplacePillar?: (updated: PillarWithTgtInfoSchema) => void;
  onDeleted?: () => void;
}

export function PillarDetailsDrawer({
  pillar,
  onReplacePillar,
  onDeleted,
  ...restProps
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

  const items = useMemo<InfoDescriptionsProps["items"]>(
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

  const deleteBlock = useMemo(
    () => <PillarDeleteBlock pillarId={id} pillarName={name} onDeleted={onDeleted} />,
    [id, name, onDeleted]
  );

  return (
    <InfoDrawer titleName={name} titleLabel={t("pillar.title")} transitionKey={id} {...restProps}>
      <Flex className={styles.pillarDetailsDrawer} vertical gap="large">
        <InfoDescriptions items={items} />

        {isSecret ? (
          <>
            {deleteBlock}
            <Alert message={t("pillar.details.value-secret-message")} type="info" showIcon />
          </>
        ) : (
          <PillarEditForm
            pillar={pillar}
            onReplacePillar={onReplacePillar}
            deleteBlock={deleteBlock}
          />
        )}
      </Flex>
    </InfoDrawer>
  );
}
