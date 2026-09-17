import { ResponseError } from "@saltbox/saltbox-core-api-client";

import { apiCoreStore, appStore } from "saltbox-core/store";

class CsvDownloader {
  async createCsv(endpoint: string, slug: string, query: object) {
    const response = await fetch(`${apiCoreStore.env?.api_base_path}${endpoint}`, {
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

export const csvDownloader = new CsvDownloader();
