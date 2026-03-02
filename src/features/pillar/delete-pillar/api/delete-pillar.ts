import { apiCoreStore } from "saltbox-core/store";

export interface DeletePillarParams {
  pillarId: string;
}

export async function deletePillar({ pillarId }: DeletePillarParams): Promise<void> {
  const api = apiCoreStore.pillarsApi;

  if (!api) {
    throw new Error("pillars.delete.error");
  }

  await api.pillarDelete({ pid: pillarId });
}
