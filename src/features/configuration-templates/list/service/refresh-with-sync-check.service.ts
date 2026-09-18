import { isBgTaskPollAborted } from "saltbox-core/shared/errors/bg-task-poll-aborted.error";

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
  load: (signal?: AbortSignal) => Promise<void>;
  finish: (generation: number) => void;
};

export async function refreshWithSyncCheck(deps: RefreshWithSyncCheckDeps): Promise<void> {
  if (deps.isAlreadyChecking()) return;

  deps.start();

  const generation = deps.cancel();
  const abortController = new AbortController();
  deps.setAbortController(abortController);

  const isCancelled = () => deps.isStale(generation);

  try {
    await deps.sync({ signal: abortController.signal, isCancelled });

    if (isCancelled()) return;

    await deps.load(abortController.signal);
  } catch (reason) {
    if (isBgTaskPollAborted(reason) || isCancelled()) return;
    throw reason;
  } finally {
    deps.finish(generation);
  }
}
