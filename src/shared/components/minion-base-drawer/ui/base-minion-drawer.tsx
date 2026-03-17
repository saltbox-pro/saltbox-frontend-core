import type { PropsWithChildren } from "react";
import { useTranslation } from "react-i18next";

import { InfoDrawer } from "saltbox-core/shared/ui/info-drawer";

interface BaseMinionDrawerProps extends PropsWithChildren {
  innerId: string;
  id: string;
  slug: string | null | undefined;
  open: boolean;
  error?: string;
  isLoading?: boolean;
  hasData?: boolean;
  onClose: () => void;
  onAfterClose?: () => void;
}

export function BaseMinionDrawer({
  innerId,
  id,
  slug,
  open,
  error,
  isLoading,
  hasData = true,
  onClose,
  onAfterClose,
  children,
}: BaseMinionDrawerProps) {
  const { t } = useTranslation();

  return (
    <InfoDrawer
      open={open}
      onClose={onClose}
      onAfterClose={onAfterClose}
      titleName={id}
      titleLabel={t("minions.minion")}
      linkTo={innerId && slug ? `core/minions/${slug}/${innerId}` : undefined}
      linkTitle={t("minions.open-minion-details-page")}
      isLoading={isLoading}
      hasData={hasData}
      errorMessage={error}
    >
      {children}
    </InfoDrawer>
  );
}
