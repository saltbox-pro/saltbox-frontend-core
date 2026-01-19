import React from "react";

type ExtractedGrainValue = string | ExtractedGrainValue[];

export function extractDataFromGrainValue(grainValue: React.ReactNode): ExtractedGrainValue {
  if (
    typeof grainValue === "string" ||
    typeof grainValue === "number" ||
    typeof grainValue === "boolean"
  ) {
    return String(grainValue);
  }
  if (Array.isArray(grainValue)) {
    return grainValue.map((value) => extractDataFromGrainValue(value));
  }
  if (React.isValidElement(grainValue)) {
    const props = (grainValue as React.ReactElement<{ children?: React.ReactNode }>).props || {};

    if (props?.children) {
      const grainValueChildExtract = extractDataFromGrainValue(props.children);
      if (grainValueChildExtract?.[0]) {
        if (!grainValueChildExtract?.[1]) {
          return grainValueChildExtract[0];
        }
        return grainValueChildExtract;
      }
    }
  }
  return "";
}
