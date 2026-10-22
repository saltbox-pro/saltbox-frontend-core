import { Link, useMatch } from "react-router";

import { buildMasterPagePath, MASTER_PAGE_ROUTE } from "../model/paths";

interface MasterLinkProps {
  masterId: string;
}

export function MasterLink({ masterId }: MasterLinkProps) {
  const masterPageMatch = useMatch(MASTER_PAGE_ROUTE);

  if (masterPageMatch?.params.mid === masterId) {
    return <>{masterId}</>;
  }

  return <Link to={buildMasterPagePath(masterId)}>{masterId}</Link>;
}
