import { SourceType, type TaskiqTaskIdResponse } from "@saltbox/saltbox-core-api-client";

import { rethrowIfAborted } from "saltbox-core/shared/errors/bg-task-poll-aborted.error";
import { extractTaskId } from "saltbox-core/shared/helpers/extract-task-id";
import { apiCoreStore } from "saltbox-core/store";

import { waitForBgTaskWithResult } from "../../shared/helpers/wait-for-bg-task";
import {
  parseContentUpdateApplyResult,
  parseContentUpdateCheckResult,
} from "../helpers/parse-content-update-result";
import type {
  ContentUpdateApplyRequest,
  ContentUpdateApplyResult,
  ContentUpdateCheckRequest,
  ContentUpdateCheckResult,
} from "../types/content-update";

const getTaskTemplateSourcesApi = () => {
  const api = apiCoreStore.taskTemplateSourcesApi;
  if (!api) throw new Error("API is not configured");
  return api;
};

const startContentUpdateCheck = (
  sourceId: string,
  request: ContentUpdateCheckRequest,
  signal?: AbortSignal
): Promise<TaskiqTaskIdResponse> => {
  const api = getTaskTemplateSourcesApi();
  const init = signal ? { signal } : undefined;

  if (request.sourceType === SourceType.ArchiveBundle) {
    return api.templateSourceActionUpdateCheckArchive(
      { source_id: sourceId, file: request.file },
      init
    );
  }

  return api.templateSourceActionUpdateCheckGit({ source_id: sourceId }, init);
};

const startContentUpdateApply = (
  sourceId: string,
  request: ContentUpdateApplyRequest
): Promise<TaskiqTaskIdResponse> => {
  const api = getTaskTemplateSourcesApi();
  const body = { token: request.token, stop_dependents: request.stopDependents };

  if (request.sourceType === SourceType.ArchiveBundle) {
    return api.templateSourceActionUpdateApplyArchive({
      source_id: sourceId,
      BodyTemplateSourceActionUpdateApplyArchive: body,
    });
  }

  return api.templateSourceActionUpdateApplyGit({
    source_id: sourceId,
    BodyTemplateSourceActionUpdateApplyGit: body,
  });
};

export async function requestContentUpdateCheck(
  sourceId: string,
  request: ContentUpdateCheckRequest,
  signal?: AbortSignal
): Promise<ContentUpdateCheckResult> {
  let response: TaskiqTaskIdResponse;

  try {
    response = await startContentUpdateCheck(sourceId, request, signal);
  } catch (error) {
    rethrowIfAborted(error, signal);
    throw error;
  }

  const result = await waitForBgTaskWithResult(extractTaskId(response), signal);
  return parseContentUpdateCheckResult(result.return_value);
}

export async function requestContentUpdateApply(
  sourceId: string,
  request: ContentUpdateApplyRequest
): Promise<ContentUpdateApplyResult> {
  const response = await startContentUpdateApply(sourceId, request);
  const result = await waitForBgTaskWithResult(extractTaskId(response));
  return parseContentUpdateApplyResult(result.return_value);
}
