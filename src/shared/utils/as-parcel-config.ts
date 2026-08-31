import type { ComponentProps } from "react";
import type Parcel from "single-spa-react/parcel";

export function asParcelConfig(parcel: unknown): ComponentProps<typeof Parcel>["config"] {
  return parcel as ComponentProps<typeof Parcel>["config"];
}
