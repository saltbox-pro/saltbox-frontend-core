import type { SaltKeyMinion, SaltKeyUpdateResultSchema } from "@saltbox/saltbox-core-api-client";

import { apiCoreStore } from "saltbox-core/store";

const API_UNAVAILABLE = "Salt keys API is not available";

const requireRequest = <T>(request: Promise<T> | undefined): Promise<T> =>
  request ?? Promise.reject(new Error(API_UNAVAILABLE));

export const acceptSaltKeys = (minions: SaltKeyMinion[]): Promise<SaltKeyUpdateResultSchema> =>
  requireRequest(
    apiCoreStore.saltKeysApi?.saltKeysAccept({
      SaltKeySetStatusRequestBody: { minions },
    })
  );

export const rejectSaltKeys = (minions: SaltKeyMinion[]): Promise<SaltKeyUpdateResultSchema> =>
  requireRequest(
    apiCoreStore.saltKeysApi?.saltKeysReject({
      SaltKeySetStatusRequestBody: { minions },
    })
  );

export const deleteSaltKeys = (minions: SaltKeyMinion[]): Promise<void> =>
  requireRequest(
    apiCoreStore.saltKeysApi?.saltKeysDelete({
      SaltKeySetStatusRequestBody: { minions },
    })
  );

export const acceptAllSaltKeys = (masterId: string): Promise<SaltKeyUpdateResultSchema> =>
  requireRequest(
    apiCoreStore.saltKeysApi?.saltKeysAcceptUnaccepted({
      SaltKeySetStatusToAllRequestBody: { masters: [masterId] },
    })
  );

export const rejectAllSaltKeys = (masterId: string): Promise<SaltKeyUpdateResultSchema> =>
  requireRequest(
    apiCoreStore.saltKeysApi?.saltKeysRejectAllUnaccepted({
      SaltKeySetStatusToAllRequestBody: { masters: [masterId] },
    })
  );

export const deleteAllSaltKeys = (masterId: string): Promise<void> =>
  requireRequest(
    apiCoreStore.saltKeysApi?.saltKeysDeleteAll({
      SaltKeySetStatusToAllRequestBody: { masters: [masterId] },
    })
  );
