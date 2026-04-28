import { JobReturnModel } from "@saltbox/saltbox-core-api-client";

const isNil = (v: unknown): v is null | undefined => v === null || v === undefined;

export const isJobReturnResultMissing = (jobReturn: JobReturnModel): boolean => {
  const jr = jobReturn as unknown as Record<string, unknown> | null | undefined;
  if (!jr || typeof jr !== "object") return true;

  const status = jr.status;
  if (status === "waiting") return true;

  const hasRetcode = !isNil(jr.retcode);
  const hasData = !isNil(jr.data);
  const hasSuccess = !isNil(jr.success);
  const hasStamp = !isNil(jr.stamp);

  return !(hasRetcode || hasData || hasSuccess || hasStamp);
};

export const getShortJobReturnOutput = (jobReturn: JobReturnModel): unknown => {
  if (jobReturn?.data === undefined || jobReturn?.data === null) {
    return jobReturn;
  }

  return jobReturn.data;
};

export const isSimpleStringData = (data: unknown): boolean => {
  return typeof data === "string";
};

export const extractStringValue = (data: unknown): string => {
  if (typeof data === "string") {
    return data;
  }

  return "";
};
