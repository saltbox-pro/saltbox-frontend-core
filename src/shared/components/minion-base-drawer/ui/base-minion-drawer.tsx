import { InfoDrawer, type InfoDrawerProps } from "@saltbox/saltbox-frontend-common";
import { useTranslation } from "react-i18next";
import { Link } from "react-router";

import { DRAWER_IDS } from "saltbox-core/shared/constants/drawer-ids";

export interface BaseMinionDrawerProps extends Omit<
  InfoDrawerProps,
  "drawerId" | "titleName" | "titleLabel" | "linkTo" | "linkTitle" | "linkComponent"
> {
  innerId: string;
  id: string;
  slug: string | null | undefined;
}

export function BaseMinionDrawer({
  innerId,
  id,
  slug,
  children,
  ...restProps
}: BaseMinionDrawerProps) {
  const { t } = useTranslation();

  return (
    <InfoDrawer
      drawerId={DRAWER_IDS.minionDetails}
      titleName={id}
      titleLabel={t("minions.minion")}
      linkTo={innerId && slug ? `/core/minions/${slug}/${innerId}` : undefined}
      linkTitle={t("minions.open-minion-details-page")}
      linkComponent={Link}
      {...restProps}
    >
      {children}
    </InfoDrawer>
  );
}
