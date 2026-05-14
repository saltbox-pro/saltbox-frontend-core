export const cleanNullsFromKwargs = (kwargs?: Record<string, any>): Record<string, any> => {
  if (!kwargs) {
    return {};
  }

  const cleaned: Record<string, any> = {};
  Object.entries(kwargs).forEach(([key, value]) => {
    if (value !== null) {
      cleaned[key] = value;
    }
  });

  return cleaned;
};

interface GetArgAndKwargForRequestParams {
  fun?: string;
  saltFunctionName?: string;
  jsonFormValue?: any;
  arg?: unknown[];
  kwarg?: Record<string, unknown>;
}

export const getArgAndKwargForRequest = ({
  fun,
  saltFunctionName,
  jsonFormValue,
  arg,
  kwarg,
}: GetArgAndKwargForRequestParams): {
  arg: any[] | undefined;
  kwarg: Record<string, any> | undefined;
} => {
  const isOriginalFunctionSelected = !!fun && saltFunctionName === fun;
  return {
    arg:
      jsonFormValue?.args ?? jsonFormValue?.arg ?? (isOriginalFunctionSelected ? arg : undefined),
    kwarg:
      jsonFormValue?.kwargs ??
      jsonFormValue?.kwarg ??
      (isOriginalFunctionSelected ? cleanNullsFromKwargs(kwarg) : undefined),
  };
};
