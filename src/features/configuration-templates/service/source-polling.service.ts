import { SourceState, type TemplateSourcePublicSchema } from "@saltbox/saltbox-core-api-client";

import { isSourceOperationInProgress } from "../shared/helpers/source-action-progress";

export const SOURCE_POLL_INTERVAL_MS = 2000;

export type SourcePollMode =
  | { type: "untilStateChange"; initialState: SourceState }
  | { type: "untilOperationEnd" };

const sleep = (ms: number) => new Promise<void>((resolve) => setTimeout(resolve, ms));

export type SourcePollingCallbacks = {
  refreshSource: (sourceId: string) => Promise<TemplateSourcePublicSchema | null>;
  applySourceUpdate: (source: TemplateSourcePublicSchema) => void;
  isSourcePresent: (sourceId: string) => boolean;
};

export class SourcePollingService {
  private sourcePollGeneration = new Map<string, number>();

  constructor(private readonly callbacks: SourcePollingCallbacks) {}

  reset = () => {
    this.sourcePollGeneration.clear();
  };

  cancel = (sourceId: string) => {
    this.bumpSourcePollGeneration(sourceId);
  };

  syncForSources = (sources: TemplateSourcePublicSchema[]) => {
    for (const source of sources) {
      if (!this.shouldPollSource(source)) continue;

      this.schedule(source.id, this.resolvePollMode(source));
    }
  };

  scheduleForSource = (source: TemplateSourcePublicSchema, wait = false) => {
    if (!this.shouldPollSource(source)) return Promise.resolve();

    return this.schedule(source.id, this.resolvePollMode(source), wait);
  };

  scheduleUntilOperationEnd = (sourceId: string, wait = false) =>
    this.schedule(sourceId, { type: "untilOperationEnd" }, wait);

  private schedule = (sourceId: string, mode: SourcePollMode, wait = false): Promise<void> => {
    const generation = this.bumpSourcePollGeneration(sourceId);
    const pollPromise = this.pollSourceUntilSettled(sourceId, generation, mode);

    if (wait) return pollPromise;

    pollPromise.catch((error) => {
      console.error("Failed to poll template source state:", error);
    });

    return pollPromise;
  };

  private bumpSourcePollGeneration = (sourceId: string): number => {
    const nextGeneration = (this.sourcePollGeneration.get(sourceId) ?? 0) + 1;
    this.sourcePollGeneration.set(sourceId, nextGeneration);
    return nextGeneration;
  };

  private isPollCancelled = (sourceId: string, generation: number): boolean =>
    this.sourcePollGeneration.get(sourceId) !== generation;

  private resolvePollMode = (source: TemplateSourcePublicSchema): SourcePollMode => {
    if (source.state === SourceState.Pending) {
      return { type: "untilStateChange", initialState: SourceState.Pending };
    }

    return { type: "untilOperationEnd" };
  };

  private shouldPollSource = (source: TemplateSourcePublicSchema): boolean => {
    if (source.state === SourceState.Broken) return false;
    if (source.state === SourceState.Pending) return true;

    return isSourceOperationInProgress(source);
  };

  private isPollingComplete = (
    source: TemplateSourcePublicSchema,
    mode: SourcePollMode
  ): boolean => {
    if (source.state === SourceState.Broken) return true;

    const operationInProgress = isSourceOperationInProgress(source);

    if (mode.type === "untilStateChange") {
      return !operationInProgress && source.state !== mode.initialState;
    }

    return !operationInProgress;
  };

  private pollSourceUntilSettled = async (
    sourceId: string,
    generation: number,
    mode: SourcePollMode
  ): Promise<void> => {
    while (true) {
      if (this.isPollCancelled(sourceId, generation)) return;
      if (!this.callbacks.isSourcePresent(sourceId)) return;

      const updated = await this.callbacks.refreshSource(sourceId);
      if (this.isPollCancelled(sourceId, generation)) return;
      if (!updated) return;

      this.callbacks.applySourceUpdate(updated);

      if (this.isPollingComplete(updated, mode)) return;

      await sleep(SOURCE_POLL_INTERVAL_MS);
    }
  };
}
