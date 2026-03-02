import { type TgtInfo, PillarTgtType } from "@saltbox/saltbox-core-api-client";
import { Link } from "react-router";

interface PillarTgtNameProps {
  tgtInfo: TgtInfo | undefined;
}

export function PillarTgtName({ tgtInfo }: PillarTgtNameProps) {
  const { id, slug, type, title, minion_id: minionId } = tgtInfo ?? {};

  if (!id) {
    return <span>{id}</span>;
  }

  const label = type === PillarTgtType.Minion ? (minionId ?? id) : (title ?? id);

  if ((type === PillarTgtType.Collection || type === PillarTgtType.Root) && slug) {
    return <Link to={`/minions/${slug}`}>{label}</Link>;
  }

  return <span>{label}</span>;
}
