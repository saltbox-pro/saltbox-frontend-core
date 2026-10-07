import { SourceType } from "@saltbox/saltbox-core-api-client";
import { runMutation } from "@saltbox/saltbox-frontend-common";
import { makeAutoObservable, observable, runInAction } from "mobx";

import type { SourceActionsPort } from "../../shared/types/source-action";
import {
  type ContentUpdateFailure,
  resolveContentUpdateFailure,
} from "../helpers/resolve-content-update-failure";
import type {
  ContentUpdatableSourceType,
  ContentUpdateApplyResult,
  ContentUpdateCheckRequest,
  ContentUpdateCheckResult,
} from "../types/content-update";

export type ContentUpdateStep =
  | "upload"
  | "checking"
  | "check_failed"
  | "up_to_date"
  | "review"
  | "applying";

type ContentUpdateActions = Pick<
  SourceActionsPort,
  "checkSourceContentUpdate" | "applySourceContentUpdate"
>;

export class SourceContentUpdateStore {
  step: ContentUpdateStep = "upload";
  checkResult: ContentUpdateCheckResult | null = null;
  stopDependents = true;
  failure: ContentUpdateFailure | null = null;
  archiveFile: File | null = null;

  private checkAbortController: AbortController | null = null;

  constructor(
    private readonly sourceId: string,
    private readonly sourceType: ContentUpdatableSourceType,
    private readonly actions: ContentUpdateActions
  ) {
    makeAutoObservable(this, { checkResult: observable.ref, failure: observable.ref });
  }

  get isArchive() {
    return this.sourceType === SourceType.ArchiveBundle;
  }

  get dependantsCount() {
    return this.checkResult?.dependant_tasks.length ?? 0;
  }

  get needsRecheck() {
    return this.failure?.phase === "apply" && this.failure.reason === "conflict";
  }

  start = () => {
    this.cancel();
    this.checkResult = null;
    this.failure = null;
    this.stopDependents = true;
    this.archiveFile = null;

    if (this.isArchive) {
      this.step = "upload";
      return;
    }

    this.check();
  };

  checkArchive = (file: File) => {
    this.archiveFile = file;
    this.check();
  };

  recheck = () => {
    this.check();
  };

  cancel = () => {
    this.checkAbortController?.abort();
    this.checkAbortController = null;
  };

  setStopDependents = (value: boolean) => {
    this.stopDependents = value;
  };

  clearFailure = () => {
    this.failure = null;
  };

  apply = async (): Promise<ContentUpdateApplyResult | null> => {
    if (!this.checkResult || this.step !== "review") return null;

    const request = {
      sourceType: this.sourceType,
      token: this.checkResult.token,
      stopDependents: this.dependantsCount > 0 && this.stopDependents,
    };

    this.step = "applying";
    this.failure = null;

    const result = await runMutation({
      run: () => this.actions.applySourceContentUpdate(this.sourceId, request),
      onError: (error) => {
        runInAction(() => {
          this.failure = resolveContentUpdateFailure("apply", error);
        });
      },
    });

    if (!result.ok) {
      runInAction(() => {
        this.step = "review";
      });
      return null;
    }

    return result.data;
  };

  private check = async () => {
    const request = this.getCheckRequest();
    if (!request) {
      this.step = "upload";
      return;
    }

    this.cancel();
    const abortController = new AbortController();
    this.checkAbortController = abortController;
    this.step = "checking";
    this.failure = null;

    const result = await runMutation({
      run: () =>
        this.actions.checkSourceContentUpdate(this.sourceId, request, abortController.signal),
      onError: (error) => {
        runInAction(() => {
          this.failure = resolveContentUpdateFailure("check", error);
        });
      },
    });

    if (abortController.signal.aborted) return;

    runInAction(() => {
      this.checkAbortController = null;

      if (!result.ok) {
        this.step = this.isArchive ? "upload" : "check_failed";
        return;
      }

      this.checkResult = result.data;
      this.stopDependents = true;
      this.step = result.data.files.length > 0 ? "review" : "up_to_date";
    });
  };

  private getCheckRequest(): ContentUpdateCheckRequest | null {
    if (this.sourceType === SourceType.GitRepo) {
      return { sourceType: SourceType.GitRepo };
    }

    return this.archiveFile
      ? { sourceType: SourceType.ArchiveBundle, file: this.archiveFile }
      : null;
  }
}
