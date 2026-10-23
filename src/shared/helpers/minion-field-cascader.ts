import { COLLECTION_FILTER_FIELD } from "saltbox-core/shared/helpers/collection-filter-field";

export const MINION_FIELD_GENERAL_GROUP_KEY = "__general__";
export const MINION_FIELD_GRAINS_GROUP_KEY = "__grains__";
export const MINION_FIELD_EXTRA_DATA_GROUP_KEY = "__extra_data__";
export const MINION_FIELD_CUSTOM_GRAIN_VALUE = "__custom_grain__";
export const MINION_GRAINS_FIELD_PREFIX = "grains.";

const EXTRA_DATA_FIELD_PREFIX = "extra.";

export type MinionFieldCascaderOption = {
  value: string;
  label: string;
  icon?: string | null;
  searchText?: string;
  children?: MinionFieldCascaderOption[];
};

type MinionSchemaField = {
  name: string;
  label: string;
};

type MinionFieldCascaderCategory = {
  source: string;
  name: string;
  label: string;
  icon?: string | null;
};

type ParsedExtraField = {
  source: string;
  categoryName: string;
  fieldName: string;
  fullName: string;
  label: string;
};

type BuildMinionFieldCascaderOptionsParams = {
  fields: ReadonlyArray<MinionSchemaField>;
  categories?: ReadonlyArray<MinionFieldCascaderCategory>;
  generalGroupLabel: string;
  grainsGroupLabel: string;
  extraDataGroupLabel: string;
  customGrainLabel?: string;
};

function isGrainField(name: string): boolean {
  return name.startsWith(MINION_GRAINS_FIELD_PREFIX);
}

function isExtraDataField(name: string): boolean {
  return name === "extra" || name.startsWith(EXTRA_DATA_FIELD_PREFIX);
}

export function parseExtraDataFilterField(name: string): Omit<ParsedExtraField, "label"> | null {
  if (!name.startsWith(EXTRA_DATA_FIELD_PREFIX)) {
    return null;
  }

  const parts = name.slice(EXTRA_DATA_FIELD_PREFIX.length).split(".");
  if (parts.length < 3) {
    return null;
  }

  const [source, categoryName, ...fieldParts] = parts;
  const fieldName = fieldParts.join(".");
  if (!source || !categoryName || !fieldName) {
    return null;
  }

  return { source, categoryName, fieldName, fullName: name };
}

export function flattenMinionFilterSchemaFields(
  options: ReadonlyArray<unknown> | undefined
): MinionSchemaField[] {
  const result: MinionSchemaField[] = [];

  const visit = (option: unknown) => {
    if (!option || typeof option !== "object") {
      return;
    }

    const typed = option as {
      options?: unknown[];
      name?: unknown;
      value?: unknown;
      label?: unknown;
    };

    if (Array.isArray(typed.options)) {
      typed.options.forEach(visit);
      return;
    }

    const name =
      typeof typed.name === "string"
        ? typed.name
        : typeof typed.value === "string"
          ? typed.value
          : "";
    if (!name) {
      return;
    }

    result.push({
      name,
      label: typeof typed.label === "string" && typed.label ? typed.label : name,
    });
  };

  (options ?? []).forEach(visit);
  return result;
}

function getCategoryGroupKey(source: string, categoryName: string): string {
  return `${source}.${categoryName}`;
}

function toFieldLeafOption(field: MinionSchemaField): MinionFieldCascaderOption {
  return {
    value: field.name,
    label: `${field.label} (${field.name})`,
    searchText: `${field.label} ${field.name}`,
  };
}

function toExtraLeafOption(
  field: ParsedExtraField,
  categoryLabel?: string
): MinionFieldCascaderOption {
  return {
    value: field.fullName,
    label: field.fieldName,
    searchText: [categoryLabel, field.fieldName, field.label, field.fullName]
      .filter(Boolean)
      .join(" "),
  };
}

function buildExtraDataChildren(
  extraFields: ReadonlyArray<MinionSchemaField>,
  categories: ReadonlyArray<MinionFieldCascaderCategory>
): MinionFieldCascaderOption[] {
  const parsedExtraFields = extraFields.flatMap((field) => {
    const parsed = parseExtraDataFilterField(field.name);
    return parsed ? [{ ...parsed, label: field.label }] : [];
  });
  const parsedExtraNames = new Set(parsedExtraFields.map((field) => field.fullName));
  const leftoverExtraFields = extraFields.filter((field) => !parsedExtraNames.has(field.name));

  const fieldsByCategory = new Map<string, ParsedExtraField[]>();
  for (const field of parsedExtraFields) {
    const groupKey = getCategoryGroupKey(field.source, field.categoryName);
    const groupFields = fieldsByCategory.get(groupKey) ?? [];
    groupFields.push(field);
    fieldsByCategory.set(groupKey, groupFields);
  }

  const categoryGroups: MinionFieldCascaderOption[] = [];
  const usedGroupKeys = new Set<string>();

  for (const category of categories) {
    const groupKey = getCategoryGroupKey(category.source, category.name);
    const groupFields = fieldsByCategory.get(groupKey);
    if (!groupFields?.length || usedGroupKeys.has(groupKey)) {
      continue;
    }

    usedGroupKeys.add(groupKey);
    categoryGroups.push({
      value: groupKey,
      label: category.label,
      icon: category.icon,
      searchText: category.label,
      children: groupFields.map((field) => toExtraLeafOption(field, category.label)),
    });
  }

  for (const [groupKey, groupFields] of fieldsByCategory) {
    if (usedGroupKeys.has(groupKey) || !groupFields.length) {
      continue;
    }

    const [{ categoryName }] = groupFields;
    categoryGroups.push({
      value: groupKey,
      label: categoryName,
      searchText: categoryName,
      children: groupFields.map((field) => toExtraLeafOption(field, categoryName)),
    });
  }

  const leftoverExtraOptions: MinionFieldCascaderOption[] = leftoverExtraFields.map((field) => ({
    value: field.name,
    label: field.label,
    searchText: `${field.label} ${field.name}`,
  }));

  return [...categoryGroups, ...leftoverExtraOptions];
}

export function buildMinionFieldCascaderOptions({
  fields,
  categories = [],
  generalGroupLabel,
  grainsGroupLabel,
  extraDataGroupLabel,
  customGrainLabel,
}: BuildMinionFieldCascaderOptionsParams): MinionFieldCascaderOption[] {
  const collectionField = fields.find((field) => field.name === COLLECTION_FILTER_FIELD);
  const grainFields = fields.filter((field) => isGrainField(field.name));
  const extraFields = fields.filter((field) => isExtraDataField(field.name));
  const generalFields = fields.filter(
    (field) =>
      field.name !== COLLECTION_FILTER_FIELD &&
      !isGrainField(field.name) &&
      !isExtraDataField(field.name)
  );

  const rootOptions: MinionFieldCascaderOption[] = collectionField
    ? [
        {
          value: collectionField.name,
          label: collectionField.label,
          searchText: `${collectionField.label} ${collectionField.name}`,
        },
      ]
    : [];

  const generalGroup: MinionFieldCascaderOption[] = generalFields.length
    ? [
        {
          value: MINION_FIELD_GENERAL_GROUP_KEY,
          label: generalGroupLabel,
          searchText: generalGroupLabel,
          children: generalFields.map(toFieldLeafOption),
        },
      ]
    : [];

  const grainsChildren: MinionFieldCascaderOption[] = [
    ...grainFields.map(toFieldLeafOption),
    ...(customGrainLabel
      ? [
          {
            value: MINION_FIELD_CUSTOM_GRAIN_VALUE,
            label: customGrainLabel,
            searchText: customGrainLabel,
          },
        ]
      : []),
  ];
  const grainsGroup: MinionFieldCascaderOption[] = grainsChildren.length
    ? [
        {
          value: MINION_FIELD_GRAINS_GROUP_KEY,
          label: grainsGroupLabel,
          searchText: grainsGroupLabel,
          children: grainsChildren,
        },
      ]
    : [];

  const extraDataChildren = buildExtraDataChildren(extraFields, categories);
  const extraDataGroup: MinionFieldCascaderOption[] = extraDataChildren.length
    ? [
        {
          value: MINION_FIELD_EXTRA_DATA_GROUP_KEY,
          label: extraDataGroupLabel,
          searchText: extraDataGroupLabel,
          children: extraDataChildren,
        },
      ]
    : [];

  return [...rootOptions, ...generalGroup, ...grainsGroup, ...extraDataGroup];
}

function findOptionPath(
  options: ReadonlyArray<MinionFieldCascaderOption>,
  leafValue: string
): string[] | undefined {
  for (const option of options) {
    if (!option.children?.length) {
      if (option.value === leafValue) {
        return [option.value];
      }
      continue;
    }

    const childPath = findOptionPath(option.children, leafValue);
    if (childPath) {
      return [option.value, ...childPath];
    }
  }

  return undefined;
}

export function getMinionFieldCascaderValue(
  fieldName: string | undefined,
  options: ReadonlyArray<MinionFieldCascaderOption>,
  isCustomGrain = false
): string[] | undefined {
  if (isCustomGrain) {
    return [MINION_FIELD_GRAINS_GROUP_KEY, MINION_FIELD_CUSTOM_GRAIN_VALUE];
  }

  if (!fieldName) {
    return undefined;
  }

  return findOptionPath(options, fieldName);
}
