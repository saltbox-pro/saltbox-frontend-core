import type { CreateJobRequest } from "@saltbox/saltbox-core-api-client";

import { getArgAndKwargForRequest } from "saltbox-core/shared/utils/job-modal-utils";

import type { JobConfigurationData } from "./types";

type JobRequestBaseline = {
  arg?: unknown[];
  kwarg?: Record<string, unknown>;
};

export const buildJobCreateRequest = (
  fun: string,
  configuration: JobConfigurationData,
  baseline: JobRequestBaseline = {}
): CreateJobRequest => {
  const { arg: requestArg, kwarg: requestKwarg } = getArgAndKwargForRequest({
    jsonFormValue: configuration.jsonFormValue,
    arg: baseline.arg,
    kwarg: baseline.kwarg,
  });

  return {
    tgt: configuration.tgt,
    fun,
    tgt_type: configuration.tgt_type,
    salt_master: configuration.salt_master,
    arg: requestArg,
    kwarg: requestKwarg,
    ttl: configuration.ttlSeconds,
  };
};

export const getJobOverviewParameters = (
  configuration: JobConfigurationData,
  baseline: JobRequestBaseline = {}
): Record<string, unknown> => {
  const { arg: requestArg, kwarg: requestKwarg } = getArgAndKwargForRequest({
    jsonFormValue: configuration.jsonFormValue,
    ...baseline,
  });

  const parameters: Record<string, unknown> = {};

  if (requestKwarg && Object.keys(requestKwarg).length > 0) {
    parameters.kwargs = requestKwarg;
  }

  if (requestArg && requestArg.length > 0) {
    parameters.args = requestArg;
  }

  return parameters;
};

export const buildSaltCommandPreview = (tgt: string, fun: string): string => {
  const normalizedTarget = tgt?.trim() || "*";
  return `$ salt '${normalizedTarget}' ${fun}`;
};
