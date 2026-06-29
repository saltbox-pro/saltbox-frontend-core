import { getTopLevelRunNumBlocks, isRecord } from "./job-return-utils";

export type SaltStepStatus = "success" | "skipped" | "error";

export type SaltStepSkipReason = "requisite" | "onlyif" | "unless" | "creates" | "generic";

export interface SaltStateResult {
  name?: string;
  result?: boolean | null;
  comment?: string;
  changes?: Record<string, unknown> | null;
  __id__?: string;
  __sls__?: string;
  __run_num__?: number;
  start_time?: string;
  duration?: number;
  [key: string]: unknown;
}

export interface SaltStepError {
  text: string;
  retcode?: number;
}

const SKIP_REASON_PATTERNS: Array<{ reason: SaltStepSkipReason; patterns: RegExp[] }> = [
  {
    reason: "requisite",
    patterns: [/one or more requisite/i, /requisite (failed|was not met|not met)/i],
  },
  {
    reason: "onlyif",
    patterns: [/onlyif condition (is|was) false/i, /onlyif condition not met/i],
  },
  {
    reason: "unless",
    patterns: [/unless condition (is|was) true/i],
  },
  {
    reason: "creates",
    patterns: [/creates.*(exist|present)/i, /already exist/i],
  },
];

const isNonEmptyString = (v: unknown): v is string => typeof v === "string" && v.trim().length > 0;

export const matchSaltSkipReason = (state: SaltStateResult): SaltStepSkipReason | null => {
  const comment = state?.comment;
  if (!isNonEmptyString(comment)) {
    return null;
  }

  for (const { reason, patterns } of SKIP_REASON_PATTERNS) {
    if (patterns.some((pattern) => pattern.test(comment))) {
      return reason;
    }
  }

  return null;
};

export const getSaltStepStatus = (state: SaltStateResult): SaltStepStatus => {
  if (matchSaltSkipReason(state)) {
    return "skipped";
  }

  const result = state?.result;
  if (result === true) {
    return "success";
  }
  if (result === false) {
    return "error";
  }

  return "skipped";
};

export const getSaltStepTitle = (state: SaltStateResult): string => {
  const id = state?.__id__;
  if (isNonEmptyString(id)) {
    return id;
  }

  const name = state?.name;
  if (isNonEmptyString(name)) {
    return name;
  }

  return "";
};

export const getSaltStepComment = (state: SaltStateResult): string => {
  return isNonEmptyString(state?.comment) ? state.comment.trim() : "";
};

export const getSaltStepError = (state: SaltStateResult): SaltStepError => {
  const changes = isRecord(state?.changes) ? state.changes : {};
  const stderr = changes.stderr;
  const stdout = changes.stdout;

  let errorText = "";
  if (isNonEmptyString(stderr)) {
    errorText = stderr.trim();
  } else if (isNonEmptyString(stdout)) {
    errorText = stdout.trim();
  } else {
    errorText = getSaltStepComment(state);
  }

  const retcode = typeof changes.retcode === "number" ? changes.retcode : undefined;

  return { text: errorText, retcode };
};

const looksLikeStateResult = (value: unknown): value is SaltStateResult => {
  if (!isRecord(value)) {
    return false;
  }

  return (
    "result" in value ||
    "comment" in value ||
    "changes" in value ||
    "__id__" in value ||
    "__run_num__" in value
  );
};

const getRunNum = (state: SaltStateResult): number => {
  const rn = state?.__run_num__;
  return typeof rn === "number" && Number.isFinite(rn) ? rn : Number.POSITIVE_INFINITY;
};

export const parseSaltStates = (data: unknown): SaltStateResult[] | null => {
  const blocks = getTopLevelRunNumBlocks(data);
  if (!blocks) {
    return null;
  }

  const states = blocks
    .map((block) => block.value)
    .filter(looksLikeStateResult) as SaltStateResult[];

  if (states.length === 0) {
    return null;
  }

  return [...states].sort((a, b) => getRunNum(a) - getRunNum(b));
};

export const getAttemptStatus = (states: SaltStateResult[]): "success" | "failed" => {
  return states.some((state) => getSaltStepStatus(state) === "error") ? "failed" : "success";
};
