import type { JobReturnModel } from "@saltbox/saltbox-core-api-client";

function compareNumericJidStrings(leftJid: string, rightJid: string): number {
  if (leftJid.length !== rightJid.length) {
    return leftJid.length - rightJid.length;
  }
  return leftJid < rightJid ? -1 : leftJid > rightJid ? 1 : 0;
}

function compareJobReturnsChronologically(older: JobReturnModel, newer: JobReturnModel): number {
  const olderJid = older?.jid ?? "";
  const newerJid = newer?.jid ?? "";
  const olderIsNumeric = /^\d+$/.test(olderJid);
  const newerIsNumeric = /^\d+$/.test(newerJid);

  if (olderIsNumeric && newerIsNumeric) {
    const c = compareNumericJidStrings(olderJid, newerJid);
    if (c !== 0) return c;
  } else if (olderIsNumeric !== newerIsNumeric) {
    return olderIsNumeric ? -1 : 1;
  }

  return older.id.localeCompare(newer.id);
}

export function sortJobReturnsChronologically(list: JobReturnModel[]): JobReturnModel[] {
  return [...list].sort((newer, older) => compareJobReturnsChronologically(older, newer));
}
