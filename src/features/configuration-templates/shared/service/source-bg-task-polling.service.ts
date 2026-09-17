import type { SourceListWithExtrasSchema } from "@saltbox/saltbox-core-api-client";

import {
  resolveSourceBgTaskOutcome,
  shouldTrackSourceBgTask,
  type SourceBgTaskOutcome,
} from "../helpers/source-bg-task";
import { createBgTaskPollFailedResult, type BgTaskPollResult } from "../types/bg-task-poll-result";

import { isBgTaskFailed, pollBgTaskResult } from "./poll-bg-task-result.service";

type InFlightPoll = {
  taskId: string;
  promise: Promise<BgTaskPollResult>;
};

export type SourceBgTaskPollingCallbacks = {
  isSourcePresent: (sourceId: string) => boolean;
  removeSource: (sourceId: string) => void;
  reloadSource: (sourceId: string) => Promise<void>;
};

export class SourceBgTaskPollingService {
  private pollGeneration = new Map<string, number>();
  private inFlightPolls = new Map<string, InFlightPoll>();

  constructor(private readonly callbacks: SourceBgTaskPollingCallbacks) {}

  reset = () => {
    this.pollGeneration.clear();
    this.inFlightPolls.clear();
  };

  cancel = (sourceId: string) => {
    this.bumpPollGeneration(sourceId);
    this.inFlightPolls.delete(sourceId);
  };

  syncForSources = (sources: SourceListWithExtrasSchema[]) => {
    for (const source of sources) {
      this.scheduleForSource(source);
    }
  };

  scheduleForSource = (source: SourceListWithExtrasSchema) => {
    if (!shouldTrackSourceBgTask(source)) return;

    const taskId = source.current_task_id;
    if (!taskId) return;

    const inFlight = this.inFlightPolls.get(source.id);
    if (inFlight?.taskId === taskId) {
      return;
    }

    this.schedule(source.id, taskId, resolveSourceBgTaskOutcome(source), false);
  };

  schedule = (
    sourceId: string,
    taskId: string,
    outcome: SourceBgTaskOutcome,
    wait = false
  ): Promise<BgTaskPollResult> => {
    const inFlight = this.inFlightPolls.get(sourceId);
    if (inFlight?.taskId === taskId) {
      return inFlight.promise;
    }

    const generation = this.bumpPollGeneration(sourceId);
    const pollPromise = this.pollBgTaskUntilSettled(sourceId, taskId, outcome, generation);

    this.inFlightPolls.set(sourceId, { taskId, promise: pollPromise });

    pollPromise.finally(() => {
      const current = this.inFlightPolls.get(sourceId);
      if (current?.promise === pollPromise) {
        this.inFlightPolls.delete(sourceId);
      }
    });

    if (wait) return pollPromise;

    pollPromise.catch((error) => {
      console.error("Failed to poll template source background task:", error);
    });

    return pollPromise;
  };

  private bumpPollGeneration = (sourceId: string): number => {
    const nextGeneration = (this.pollGeneration.get(sourceId) ?? 0) + 1;
    this.pollGeneration.set(sourceId, nextGeneration);
    return nextGeneration;
  };

  private isPollCancelled = (sourceId: string, generation: number): boolean =>
    this.pollGeneration.get(sourceId) !== generation;

  private async pollBgTaskUntilSettled(
    sourceId: string,
    taskId: string,
    outcome: SourceBgTaskOutcome,
    generation: number
  ): Promise<BgTaskPollResult> {
    if (this.isPollCancelled(sourceId, generation)) return "aborted";
    if (!this.callbacks.isSourcePresent(sourceId)) return "aborted";

    const result = await pollBgTaskResult(taskId);

    if (this.isPollCancelled(sourceId, generation)) return "aborted";
    if (!this.callbacks.isSourcePresent(sourceId)) return "aborted";

    if (isBgTaskFailed(result)) {
      await this.callbacks.reloadSource(sourceId);
      return createBgTaskPollFailedResult(result.error, result.progress_meta);
    }

    if (outcome === "remove") {
      this.callbacks.removeSource(sourceId);
      return "ok";
    }

    await this.callbacks.reloadSource(sourceId);
    return "ok";
  }
}
