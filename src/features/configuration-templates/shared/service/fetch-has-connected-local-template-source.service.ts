import { apiCoreStore } from "saltbox-core/store";

import { connectedLocalSourcesQuery } from "../helpers/connected-local-sources-query";

export async function fetchHasConnectedLocalTemplateSource(): Promise<boolean | null> {
  try {
    const response = await apiCoreStore.taskTemplateSourcesApi?.templateSourceList({
      TemplateSourceListBody: {
        query: connectedLocalSourcesQuery,
        limit: 1,
      },
    });

    return (response?.total ?? 0) > 0;
  } catch (reason) {
    console.error("Failed to fetch connected local template sources:", reason);
    return null;
  }
}
