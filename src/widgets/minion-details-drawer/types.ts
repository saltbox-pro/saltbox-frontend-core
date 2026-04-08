export type MinionDetailsDrawerOpenParams =
  | { slug: string; minionId: string; innerId: string; drawerId?: string }
  | { masterId: string; minionId: string; drawerId?: string };
