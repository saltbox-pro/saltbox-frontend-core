import type { PillarCreateRequestSchema } from "@saltbox/saltbox-core-api-client";

import { apiCoreStore } from "saltbox-core/store";

export async function createPillar(body: PillarCreateRequestSchema): Promise<void> {
  const api = apiCoreStore.pillarsApi;

  if (!api) {
    throw new Error("pillars.create.error");
  }

  await api.pillarCreate({ PillarCreateRequestSchema: body });
}
