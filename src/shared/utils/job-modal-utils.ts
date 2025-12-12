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
