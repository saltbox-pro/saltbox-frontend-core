import { extractDataFromGrainValue } from "./extract-data-from-grain-value";

export function transformGrainValueToString(grainValue: React.ReactNode): string {
  const extractedGrainValue = extractDataFromGrainValue(grainValue);

  if (typeof extractedGrainValue === "string") {
    return extractedGrainValue;
  }
  return JSON.stringify(extractedGrainValue)
    .replace(/[\[\]\"\,]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}
