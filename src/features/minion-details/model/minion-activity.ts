import type { MinionDetailSchema } from "@saltbox/saltbox-core-api-client";

export type MinionActivity = Pick<MinionDetailSchema, "last_activity">;

export const isMinionNeverActive = (minion: MinionActivity | null | undefined): boolean =>
  !!minion && minion.last_activity == null;
