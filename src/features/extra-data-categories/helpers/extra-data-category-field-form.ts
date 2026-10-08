import type {
  MinionExtraDataCategoryField,
  MinionExtraDataCategoryFieldType,
} from "@saltbox/saltbox-core-api-client";

export type ExtraDataCategoryFieldFormValue = {
  name: string;
  type?: MinionExtraDataCategoryFieldType;
};

export function createEmptyExtraDataCategoryField(): ExtraDataCategoryFieldFormValue {
  return { name: "" };
}

export function isDuplicateExtraDataCategoryFieldName(
  fields: readonly ExtraDataCategoryFieldFormValue[] | undefined,
  index: number,
  value: string
): boolean {
  return (fields ?? []).some(
    (field, fieldIndex) => fieldIndex !== index && field?.name?.trim() === value
  );
}

export function toExtraDataCategoryFieldsPayload(
  values: readonly ExtraDataCategoryFieldFormValue[] | undefined
): MinionExtraDataCategoryField[] {
  return (values ?? []).flatMap((value) => {
    const name = value.name.trim();
    const type = value.type;
    if (!name || type == null) {
      return [];
    }
    return [{ name, type }];
  });
}

function reorderExtraDataCategoryField(
  fields: readonly MinionExtraDataCategoryField[],
  fromIndex: number,
  toIndex: number
): MinionExtraDataCategoryField[] | null {
  if (
    fromIndex === toIndex ||
    fromIndex < 0 ||
    toIndex < 0 ||
    fromIndex >= fields.length ||
    toIndex >= fields.length
  ) {
    return null;
  }

  const next = [...fields];
  const [item] = next.splice(fromIndex, 1);
  next.splice(toIndex, 0, item);
  return next;
}

export function reorderExtraDataCategoryFieldByName(
  fields: readonly MinionExtraDataCategoryField[],
  fromName: string,
  toName: string
): MinionExtraDataCategoryField[] | null {
  const fromIndex = fields.findIndex((field) => field.name === fromName);
  const toIndex = fields.findIndex((field) => field.name === toName);
  return reorderExtraDataCategoryField(fields, fromIndex, toIndex);
}

export function applyExtraDataCategoryFieldOrder(
  fields: readonly MinionExtraDataCategoryField[] | undefined,
  orderedNames: readonly string[]
): MinionExtraDataCategoryField[] {
  const list = fields ?? [];
  const byName = new Map(list.map((field) => [field.name, field]));
  const ordered = orderedNames
    .map((name) => byName.get(name))
    .filter((field): field is MinionExtraDataCategoryField => field != null);
  const orderedSet = new Set(ordered.map((field) => field.name));
  const rest = list.filter((field) => !orderedSet.has(field.name));
  return [...ordered, ...rest];
}

export function mergeExtraDataCategoryFieldsPreferringCurrentOrder(
  currentFields: readonly MinionExtraDataCategoryField[] | undefined,
  serverFields: readonly MinionExtraDataCategoryField[] | undefined
): MinionExtraDataCategoryField[] {
  const current = currentFields ?? [];
  const server = serverFields ?? [];
  const serverByName = new Map(server.map((field) => [field.name, field]));
  const currentNames = new Set(current.map((field) => field.name));

  const kept = current
    .map((field) => serverByName.get(field.name))
    .filter((field): field is MinionExtraDataCategoryField => field != null);
  const added = server.filter((field) => !currentNames.has(field.name));

  return [...kept, ...added];
}
