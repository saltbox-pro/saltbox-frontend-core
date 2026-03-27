import { InfoDrawer, type InfoDrawerProps } from "@saltbox/saltbox-frontend-common";
import { useTranslation } from "react-i18next";
import { Link } from "react-router";

export interface BaseMinionDrawerProps extends Omit<
  InfoDrawerProps,
  "titleName" | "titleLabel" | "linkTo" | "linkTitle" | "linkComponent"
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
