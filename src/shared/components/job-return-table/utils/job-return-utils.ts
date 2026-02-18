import { JobReturnModel } from "@saltbox/saltbox-core-api-client";

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
