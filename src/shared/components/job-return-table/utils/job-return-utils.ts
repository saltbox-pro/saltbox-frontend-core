import { JobReturnModel } from "@saltbox/saltbox-core-api-client";

export const getShortJobReturnOutput = (jobReturn: JobReturnModel): unknown => {
  if (jobReturn?.data === undefined || jobReturn?.data === null) {
    return jobReturn;
  }

  return jobReturn.data;
};

export const isSimpleStringData = (data: unknown): boolean => {
  if (typeof data === "string") {
    return true;
  }

  if (typeof data === "object" && data !== null) {
    const keys = Object.keys(data);
    if (keys.length === 1) {
      const value = (data as Record<string, unknown>)[keys[0]];
      return typeof value === "string";
    }
  }

  return false;
};

export const extractStringValue = (data: unknown): string => {
  if (typeof data === "string") {
    return data;
  }

  if (typeof data === "object" && data !== null) {
    const keys = Object.keys(data);
    if (keys.length === 1) {
      const value = (data as Record<string, unknown>)[keys[0]];
      if (typeof value === "string") {
        return value;
      }
    }
  }

  return "";
};
