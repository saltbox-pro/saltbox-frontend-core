import { type TgtInfo, PillarTgtType } from "@saltbox/saltbox-core-api-client";
import { Link } from "react-router";

interface PillarTgtIdCellProps {
  tgtInfo: TgtInfo | undefined;
}

export function PillarTgtIdCell({ tgtInfo }: PillarTgtIdCellProps) {
  const { id, slug, type, title, minion_id: minionId } = tgtInfo;

  if (!id) {
    return <span>{id}</span>;
  }

  const label = type === PillarTgtType.Minion ? (minionId ?? id) : (title ?? id);

  if ((type === PillarTgtType.Collection || type === PillarTgtType.Root) && slug) {
    return <Link to={`/minions/${slug}`}>{label}</Link>;
  }

  return <span>{label}</span>;
}
