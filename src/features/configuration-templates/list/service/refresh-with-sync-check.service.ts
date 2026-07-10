import { isGlobalServerError } from "@saltbox/saltbox-frontend-common";

import { isBgTaskPollAborted } from "saltbox-core/shared/errors/bg-task-poll-aborted.error";

type LoadOptions = {
  signal?: AbortSignal;
  isCancelled?: () => boolean;
};

type SyncSourcesDeps = {
  signal?: AbortSignal;
  isCancelled: () => boolean;
};

export type RefreshWithSyncCheckDeps = {
  isAlreadyChecking: () => boolean;
  start: () => void;
  cancel: () => number;
  setAbortController: (controller: AbortController | null) => void;
  isStale: (generation: number) => boolean;
  sync: (deps: SyncSourcesDeps) => Promise<void>;
  load: (options: LoadOptions) => Promise<void>;
  onSyncError: (reason: unknown) => Promise<void>;
  finish: (generation: number) => void;
  logMessage: string;
};

export async function refreshWithSyncCheck(deps: RefreshWithSyncCheckDeps): Promise<boolean> {
  if (deps.isAlreadyChecking()) return false;

  deps.start();

  const generation = deps.cancel();
  const abortController = new AbortController();
  deps.setAbortController(abortController);

  const isCancelled = () => deps.isStale(generation);
  const syncDeps: SyncSourcesDeps = {
    signal: abortController.signal,
    isCancelled,
  };

  try {
    await deps.sync(syncDeps);

    if (isCancelled()) return false;

    await deps.load({
      signal: abortController.signal,
      isCancelled,
    });

    if (isCancelled()) return false;

    return true;
  } catch (reason) {
    if (isBgTaskPollAborted(reason) || isCancelled()) return false;

    console.error(deps.logMessage, reason);
    if (isGlobalServerError(reason)) return false;

    await deps.onSyncError(reason);

    return false;
  } finally {
    deps.finish(generation);
  }
}
