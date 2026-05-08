import type { JobReturnModel } from "@saltbox/saltbox-core-api-client";

import type { JobReturnContentStatus } from "../types/status";

const isNil = (v: unknown): v is null | undefined => v === null || v === undefined;

export const isRecord = (v: unknown): v is Record<string, unknown> => {
  return typeof v === "object" && v !== null && !Array.isArray(v);
};

const isEmptyObject = (v: unknown): boolean => isRecord(v) && Object.keys(v).length === 0;
const isEmptyArray = (v: unknown): boolean => Array.isArray(v) && v.length === 0;
const isEmptyString = (v: unknown): boolean => typeof v === "string" && v.trim().length === 0;

const getRunNum = (v: unknown): number | undefined => {
  if (!isRecord(v)) return undefined;
  const rn = v.__run_num__;
  return typeof rn === "number" && Number.isFinite(rn) ? rn : undefined;
};

export const sortJobReturnOutputByRunNumIfPresent = (data: unknown): unknown => {
  if (!data) return data;

  if (Array.isArray(data)) {
    const hasRunNums = data.some((item) => getRunNum(item) !== undefined);
    if (!hasRunNums) return data;

    return [...data].sort((a, b) => (getRunNum(b) ?? -Infinity) - (getRunNum(a) ?? -Infinity));
  }

  if (isRecord(data)) {
    const entries = Object.entries(data);
    const hasRunNums = entries.some(([, value]) => getRunNum(value) !== undefined);
    if (!hasRunNums) return data;

    return Object.fromEntries(
      [...entries].sort(
        ([, av], [, bv]) => (getRunNum(bv) ?? -Infinity) - (getRunNum(av) ?? -Infinity)
      )
    );
  }

  return data;
};

export const hasTopLevelRunNums = (data: unknown): boolean => {
  if (!data) return false;
  if (Array.isArray(data)) return data.some((item) => getRunNum(item) !== undefined);
  if (isRecord(data)) return Object.values(data).some((v) => getRunNum(v) !== undefined);
  return false;
};

export const resolveJobReturnContentStatus = (
  value: unknown,
  fallback: JobReturnContentStatus,
  fallbackRawStatus: unknown
): JobReturnContentStatus => {
  if (isRecord(value)) {
    const result = value.result;
    if (typeof result === "boolean") return result ? "success" : "failed";

    const status = value.status;
    if (typeof status === "string") {
      const s = status.toLowerCase();
      if (s.includes("success")) return "success";
      if (s.includes("fail") || s.includes("error") || s.includes("timeout")) return "failed";
      return "unknown";
    }
  }

  if (typeof fallbackRawStatus === "string") {
    const s = fallbackRawStatus.toLowerCase();
    if (s.includes("success")) return "success";
    if (s.includes("fail") || s.includes("error") || s.includes("timeout")) return "failed";
    return "unknown";
  }

  return fallback;
};

export type JobReturnRunNumBlock = { title?: string; value: unknown; runNum?: number };

export const getTopLevelRunNumBlocks = (data: unknown): JobReturnRunNumBlock[] | null => {
  if (!hasTopLevelRunNums(data)) return null;
  if (Array.isArray(data)) {
    return data.map((value) => ({ value, runNum: getRunNum(value) }));
  }
  if (isRecord(data)) {
    return Object.entries(data).map(([title, value]) => ({
      title,
      value,
      runNum: getRunNum(value),
    }));
  }
  return null;
};

export const isJobReturnResultMissing = (jobReturn: JobReturnModel): boolean => {
  const jr = jobReturn as unknown as Record<string, unknown> | null | undefined;
  if (!jr || typeof jr !== "object") return true;

  const status = jr.status;
  if (status === "waiting") return true;
  if (isJobReturnDataExplicitlyEmpty(jobReturn)) return true;

  const hasRetcode = !isNil(jr.retcode);
  const hasData = !isNil(jr.data);
  const hasSuccess = !isNil(jr.success);
  const hasStamp = !isNil(jr.stamp);

  return !(hasRetcode || hasData || hasSuccess || hasStamp);
};

export const isJobReturnDataExplicitlyEmpty = (
  jobReturn: JobReturnModel | null | undefined
): boolean => {
  const data = jobReturn?.data;
  return data === null || isEmptyArray(data) || isEmptyObject(data) || isEmptyString(data);
};

export const getShortJobReturnOutput = (jobReturn: JobReturnModel): unknown => {
  if (jobReturn?.data === undefined) {
    return jobReturn;
  }

  return jobReturn.data;
};

export const isSimpleBooleanData = (data: unknown): data is boolean => {
  return typeof data === "boolean";
};

export const isSimpleStringData = (data: unknown): data is string => {
  return typeof data === "string";
};

export const extractStringValue = (data: unknown): string => {
  if (isSimpleStringData(data)) {
    return data;
  }

  return "";
};
