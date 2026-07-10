import { rethrowIfAborted } from "saltbox-core/shared/errors/bg-task-poll-aborted.error";
import { apiCoreStore } from "saltbox-core/store";

export type SyncMountedSourcesDeps = {
  signal?: AbortSignal;
  isCancelled: () => boolean;
};

export async function syncMountedSources(deps: SyncMountedSourcesDeps): Promise<void> {
  const api = apiCoreStore.taskTemplateSourcesApi;
  if (!api) {
    throw new Error("API is not configured");
  }

  try {
    await api.templateSourceCheckMountedList(deps.signal ? { signal: deps.signal } : undefined);
  } catch (error) {
    rethrowIfAborted(error, deps.signal);
    throw error;
  }

  if (deps.isCancelled()) return;
}
