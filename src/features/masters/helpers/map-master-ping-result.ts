export const MASTER_PING_SUCCESS = "succeed";

export type MasterAvailability = { status: "available" } | { status: "unavailable"; error: string };

export type MasterAvailabilityById = Record<string, MasterAvailability>;

export function mapMasterPingResults(raw: Record<string, string | null>): MasterAvailabilityById {
  return Object.fromEntries(
    Object.entries(raw).map(([masterId, value]) => [
      masterId,
      value === MASTER_PING_SUCCESS
        ? { status: "available" as const }
        : { status: "unavailable" as const, error: value ?? "" },
    ])
  );
}
