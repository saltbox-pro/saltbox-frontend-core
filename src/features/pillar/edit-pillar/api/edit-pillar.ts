import type { PillarWithTgtInfoSchema } from "@saltbox/saltbox-core-api-client";

import { apiCoreStore } from "saltbox-core/store";

export interface EditPillarParams {
  pillarId: string;
  value: unknown;
  tgtInfo: PillarWithTgtInfoSchema["tgt_info"];
}

export async function editPillar({
  pillarId,
  value,
  tgtInfo,
}: EditPillarParams): Promise<PillarWithTgtInfoSchema> {
  const api = apiCoreStore.pillarsApi;

  if (!api) {
    throw new Error("pillars.edit.error");
  }

  const response = await api.pillarUpdate({
    pid: pillarId,
    PillarUpdateSchema: { value },
  });

  return {
    ...response,
    tgt_info: tgtInfo,
  };
}
