import { ResponseError } from "@saltbox/saltbox-core-api-client";

import { apiCoreStore, appStore } from "saltbox-core/store";

class MinionsCsvExporter {
  async createCsv(slug: string, query: object) {
    const response = await fetch(`${apiCoreStore.env?.api_base_path}/minions/export`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${appStore.authStore.user?.access_token}`,
      },
      body: JSON.stringify({
        query,
        collection_slug: slug,
      }),
    });

    if (!response.ok) throw new ResponseError(response, "Response returned an error code");

    return response;
  }
}

export const minionsCsvExporter = new MinionsCsvExporter();
