import { InfoDrawer, type InfoDrawerProps } from "@saltbox/saltbox-frontend-common";
import { useTranslation } from "react-i18next";

import { DRAWER_IDS } from "saltbox-core/shared/constants/drawer-ids";

import {
  PillarDetailsDrawerContent,
  type PillarDetailsDrawerContentProps,
} from "./pillar-details-drawer-content";

export type PillarDetailsDrawerProps = Omit<
  InfoDrawerProps,
  "drawerId" | "titleName" | "titleLabel" | "linkTo" | "linkTitle" | "linkComponent" | "children"
> &
  PillarDetailsDrawerContentProps;

export function PillarDetailsDrawer({
  open,
  pillar,
  onReplacePillar,
  onDeleted,
  ...restProps
}: PillarDetailsDrawerProps) {
  const { t } = useTranslation();

  const { name } = pillar ?? {};

  return (
    <InfoDrawer
      open={open}
      drawerId={DRAWER_IDS.pillarDetails}
      titleName={name}
      titleLabel={t("pillar.title")}
      transitionKey={open ? "opened" : "closed"}
      {...restProps}
    >
      <PillarDetailsDrawerContent
        pillar={pillar}
        onReplacePillar={onReplacePillar}
        onDeleted={onDeleted}
      />
    </InfoDrawer>
  );
}
