import type {
  StaticExtraDataItemRequestSchema,
  StaticExtraDataItemSchema,
} from "@saltbox/saltbox-core-api-client";

import { apiCoreStore } from "saltbox-core/store";

export async function createMinionExtraDataItem(
  body: StaticExtraDataItemRequestSchema
): Promise<StaticExtraDataItemSchema> {
  const api = apiCoreStore.extraDataApi;

  if (!api) {
    throw new Error("minions.extra-data.item-form.error");
  }

  return api.extraDataItemCreate({ StaticExtraDataItemRequestSchema: body });
}
