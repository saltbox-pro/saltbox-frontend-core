import type {
  AcceptedMastersRequirement,
  ActionPlugin,
  WithAcceptedMastersCheckCallParams,
} from "@saltbox/saltbox-frontend-common";

export type ActionPluginClickGuard = {
  withAcceptedMastersCheck: (params: WithAcceptedMastersCheckCallParams) => Promise<void>;
  navigate: (to: string) => void;
};

export type ActionPluginBase<TContext> = Pick<
  ActionPlugin<TContext, AcceptedMastersRequirement>,
  "key" | "icon" | "onClick" | "isDisabled" | "isBusy" | "acceptedMasters"
>;
