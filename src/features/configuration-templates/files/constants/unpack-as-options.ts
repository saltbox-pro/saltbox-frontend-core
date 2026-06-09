import { UnpackAs } from "@saltbox/saltbox-core-api-client";

export const UNPACK_AS_SELECT_OPTIONS: { value: UnpackAs; label: string }[] = [
  { value: UnpackAs.Zip, label: "ZIP" },
  { value: UnpackAs.Gztar, label: "TAR.GZ" },
  { value: UnpackAs.Bztar, label: "TAR.BZ2" },
  { value: UnpackAs.Xztar, label: "TAR.XZ" },
  { value: UnpackAs.Tar, label: "TAR" },
];
