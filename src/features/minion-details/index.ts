export { useMinionDetailsDrawerTab } from "./hooks/use-minion-details-drawer-tab";
export { useOnMinionDataRefreshed } from "./hooks/use-on-minion-data-refreshed";
export { useMinionDetailActionsTick } from "./hooks/use-minion-detail-actions-tick";
export { buildMinionDetailsPagePath, buildMasterMinionRedirectPath } from "./model/paths";

export {
  MinionDetailsFullPage,
  type MinionDetailsFullPageProps,
} from "./ui/minion-details-full-page";

export {
  MinionDetailsInDrawer,
  type MinionDetailsInDrawerProps,
} from "./ui/minion-details-in-drawer";

export type {
  MinionDetailActionContext,
  MinionDetailActionPlugin,
  OnFilterButtonHandler,
  OnFilterButtonParams,
} from "./types/minion-details-props";
