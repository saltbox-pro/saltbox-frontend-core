import { useTranslation } from "react-i18next";

import {
  getEntitySourceLinkTarget,
  getEntitySourceTypeLabel,
} from "saltbox-core/shared/entity-source";

import { EntitySourceLink } from "./entity-source-link";

interface EntitySourceTypeProps {
  type: string | null | undefined;
  sourceId?: string | null;
}

export function EntitySourceType({ type, sourceId }: EntitySourceTypeProps) {
  const { t } = useTranslation();
  const label = getEntitySourceTypeLabel(type, t);

  if (!type || !sourceId) {
    return label;
  }

  const linkTarget = getEntitySourceLinkTarget(type, sourceId);
  if (!linkTarget) {
    return label;
  }

  return (
    <EntitySourceLink to={linkTarget.to} state={linkTarget.state}>
      {label}
    </EntitySourceLink>
  );
}
