import type { UnpackAs } from "@saltbox/saltbox-core-api-client";

export type AddSourceFilePayload = {
  rel_path: string;
  file?: File | null;
  url?: string | null;
  unpack_as?: UnpackAs | null;
};

export function isAsyncSourceFileAdd(payload: AddSourceFilePayload): boolean {
  return payload.file == null && !!payload.url?.trim();
}
