export function isValidExtraDataCategoryFieldName(name: string): boolean {
  return !name.includes(".") && !name.startsWith("$");
}
