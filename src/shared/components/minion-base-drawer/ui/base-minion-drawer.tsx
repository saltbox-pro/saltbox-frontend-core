import { InfoDrawer, type InfoDrawerProps } from "@saltbox/saltbox-frontend-common";
import { useTranslation } from "react-i18next";
import { Link } from "react-router";

import { buildMinionDetailsPagePath } from "saltbox-core/features/minion-details";
import type { MinionDetailsTabKey } from "saltbox-core/features/minion-details/model/tabs";
import { DRAWER_IDS, type MinionDrawerId } from "saltbox-core/shared/constants/drawer-ids";

export interface BaseMinionDrawerProps extends Omit<
  InfoDrawerProps,
  "drawerId" | "titleName" | "titleLabel" | "linkTo" | "linkTitle" | "linkComponent"
> {
  drawerId?: MinionDrawerId;
  innerId: string;
  id: string;
  slug: string | null | undefined;
  activeTab?: MinionDetailsTabKey;
}

export function BaseMinionDrawer({
  innerId,
  id,
  slug,
  activeTab,
  children,
  drawerId = DRAWER_IDS.minionDetails,
  width = 820,
  linkPlacement = "extra",
  ...restProps
}: BaseMinionDrawerProps) {
  const { t } = useTranslation();

  return (
    <InfoDrawer
      drawerId={drawerId}
      titleName={id}
      titleLabel={t("minions.minion")}
      linkTo={innerId && slug ? buildMinionDetailsPagePath(slug, innerId, activeTab) : undefined}
      linkTitle={t("minions.open-minion-details-page")}
      linkComponent={Link}
      linkPlacement={linkPlacement}
      width={width}
      {...restProps}
    >
      {children}
    </InfoDrawer>
  );
}
