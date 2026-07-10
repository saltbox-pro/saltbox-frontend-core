import type { UnpackAs } from "@saltbox/saltbox-core-api-client";

export type AddSourceFilePayload = {
  file: File;
  unpack_as?: UnpackAs | null;
};
