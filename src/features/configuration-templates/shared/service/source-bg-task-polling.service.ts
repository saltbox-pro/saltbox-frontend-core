import type { SourceListWithExtrasSchema } from "@saltbox/saltbox-core-api-client";
import { isGlobalServerError } from "@saltbox/saltbox-frontend-common";

import { BgTaskFailedError } from "../errors/bg-task-failed.error";
import { BgTaskPollAbortedError } from "../errors/bg-task-poll-aborted.error";
import {
  resolveSourceBgTaskOutcome,
  shouldTrackSourceBgTask,
  type SourceBgTaskOutcome,
} from "../helpers/source-bg-task";

import { isBgTaskFailed, pollBgTaskResult } from "./poll-bg-task-result.service";

type InFlightPoll = {
  taskId: string;
  promise: Promise<void>;
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
  ): Promise<void> => {
    const inFlight = this.inFlightPolls.get(sourceId);
    if (inFlight?.taskId === taskId) {
      return inFlight.promise;
    }

    const generation = this.bumpPollGeneration(sourceId);
    const pollPromise = this.pollBgTaskUntilSettled(sourceId, taskId, outcome, generation, wait);

    this.inFlightPolls.set(sourceId, { taskId, promise: pollPromise });

    pollPromise.finally(() => {
      const current = this.inFlightPolls.get(sourceId);
      if (current?.promise === pollPromise) {
        this.inFlightPolls.delete(sourceId);
      }
    });

    if (wait) return pollPromise;

    pollPromise.catch((error) => {
      if (isGlobalServerError(error) || error instanceof BgTaskPollAbortedError) return;
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

  private ensureNotCancelled = (sourceId: string, generation: number, wait: boolean): void => {
    if (!wait || !this.isPollCancelled(sourceId, generation)) return;

    throw new BgTaskPollAbortedError();
  };

  private async pollBgTaskUntilSettled(
    sourceId: string,
    taskId: string,
    outcome: SourceBgTaskOutcome,
    generation: number,
    wait: boolean
  ): Promise<void> {
    this.ensureNotCancelled(sourceId, generation, wait);
    if (!this.callbacks.isSourcePresent(sourceId)) return;

    const result = await pollBgTaskResult(taskId);

    this.ensureNotCancelled(sourceId, generation, wait);
    if (!this.callbacks.isSourcePresent(sourceId)) return;

    if (isBgTaskFailed(result)) {
      await this.callbacks.reloadSource(sourceId);
      throw new BgTaskFailedError(result.error);
    }

    if (outcome === "remove") {
      this.callbacks.removeSource(sourceId);
      return;
    }

    await this.callbacks.reloadSource(sourceId);
  }
}
