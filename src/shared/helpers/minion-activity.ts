import type { MinionShortSchema } from "@saltbox/saltbox-core-api-client";

export type MinionActivity = Pick<MinionShortSchema, "last_activity">;

export const isMinionNeverActive = (minion: MinionActivity | null | undefined): boolean =>
  !!minion && minion.last_activity == null;
