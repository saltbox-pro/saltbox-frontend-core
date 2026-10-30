import {
  MinionFilterGroup,
  type MinionFilterExtraCategorySchema,
} from "@saltbox/saltbox-core-api-client";

import { buildExtraDataCategoryFieldPrefix } from "saltbox-core/shared/helpers/extra-data-value";
import {
  readMinionFieldExtraCategory,
  readMinionFieldGroup,
} from "saltbox-core/shared/helpers/minion-filter-field-meta";

export const MINION_FIELD_GENERAL_GROUP_KEY = "__general__";
export const MINION_FIELD_GRAINS_GROUP_KEY = "__grains__";
export const MINION_FIELD_EXTRA_DATA_GROUP_KEY = "__extra_data__";
export const MINION_FIELD_CUSTOM_GRAIN_VALUE = "__custom_grain__";
export const MINION_GRAINS_FIELD_PREFIX = "grains.";

export type MinionFieldCascaderOption = {
  value: string;
  label: string;
  icon?: string | null;
  searchText?: string;
  children?: MinionFieldCascaderOption[];
};

export type MinionSchemaField = {
  name: string;
  label: string;
  group: MinionFilterGroup;
  extraCategory?: MinionFilterExtraCategorySchema;
};

type MinionFieldCascaderCategory = MinionFilterExtraCategorySchema & {
  label: string;
  icon?: string | null;
};

type CategorizedExtraField = MinionSchemaField & {
  extraCategory: MinionFilterExtraCategorySchema;
};

export type LabelComparator = (a: string, b: string) => number;

type BuildMinionFieldCascaderOptionsParams = {
  fields: ReadonlyArray<MinionSchemaField>;
  categories?: ReadonlyArray<MinionFieldCascaderCategory>;
  generalGroupLabel: string;
  grainsGroupLabel: string;
  extraDataGroupLabel: string;
  customGrainLabel?: string;
  compareLabels?: LabelComparator;
};

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
      group?: unknown;
      extra_category?: unknown;
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

    const extraCategory = readMinionFieldExtraCategory(typed.extra_category);
    result.push({
      name,
      label: typeof typed.label === "string" && typed.label ? typed.label : name,
      group: readMinionFieldGroup(typed.group),
      ...(extraCategory ? { extraCategory } : {}),
    });
  };

  (options ?? []).forEach(visit);
  return result;
}

function getCategoryGroupKey({ source, name }: MinionFilterExtraCategorySchema): string {
  return `${source}.${name}`;
}

function getExtraFieldShortName({ name, label, extraCategory }: CategorizedExtraField): string {
  const categoryPrefix = buildExtraDataCategoryFieldPrefix(
    extraCategory.source,
    extraCategory.name
  );
  return name.startsWith(categoryPrefix) && name.length > categoryPrefix.length
    ? name.slice(categoryPrefix.length)
    : label;
}

function hasExtraCategory(field: MinionSchemaField): field is CategorizedExtraField {
  return field.extraCategory !== undefined;
}

function toFieldLeafOption(field: MinionSchemaField): MinionFieldCascaderOption {
  return {
    value: field.name,
    label: `${field.label} (${field.name})`,
    searchText: `${field.label} ${field.name}`,
  };
}

function toExtraLeafOption(
  field: CategorizedExtraField,
  categoryLabel: string
): MinionFieldCascaderOption {
  const shortName = getExtraFieldShortName(field);
  return {
    value: field.name,
    label: shortName,
    searchText: [categoryLabel, shortName, field.label, field.name].filter(Boolean).join(" "),
  };
}

function toPlainLeafOption(field: MinionSchemaField): MinionFieldCascaderOption {
  return {
    value: field.name,
    label: field.label,
    searchText: `${field.label} ${field.name}`,
  };
}

function sortOptionsByLabel(
  options: MinionFieldCascaderOption[],
  compareLabels?: LabelComparator
): MinionFieldCascaderOption[] {
  return compareLabels ? [...options].sort((a, b) => compareLabels(a.label, b.label)) : options;
}

function toCategoryOption(
  groupKey: string,
  label: string,
  fields: ReadonlyArray<CategorizedExtraField>,
  { icon, compareLabels }: { icon?: string | null; compareLabels?: LabelComparator } = {}
): MinionFieldCascaderOption {
  return {
    value: groupKey,
    label,
    icon,
    searchText: label,
    children: sortOptionsByLabel(
      fields.map((field) => toExtraLeafOption(field, label)),
      compareLabels
    ),
  };
}

function buildExtraDataChildren(
  extraFields: ReadonlyArray<MinionSchemaField>,
  categories: ReadonlyArray<MinionFieldCascaderCategory>,
  compareLabels?: LabelComparator
): MinionFieldCascaderOption[] {
  const fieldsByCategory = new Map<string, CategorizedExtraField[]>();
  const uncategorizedFields: MinionSchemaField[] = [];
  for (const field of extraFields) {
    if (!hasExtraCategory(field)) {
      uncategorizedFields.push(field);
      continue;
    }

    const groupKey = getCategoryGroupKey(field.extraCategory);
    const groupFields = fieldsByCategory.get(groupKey);
    if (groupFields) {
      groupFields.push(field);
    } else {
      fieldsByCategory.set(groupKey, [field]);
    }
  }

  const categoryGroups: MinionFieldCascaderOption[] = [];
  const usedGroupKeys = new Set<string>();

  for (const category of categories) {
    const groupKey = getCategoryGroupKey(category);
    const groupFields = fieldsByCategory.get(groupKey);
    if (!groupFields?.length || usedGroupKeys.has(groupKey)) {
      continue;
    }

    usedGroupKeys.add(groupKey);
    categoryGroups.push(
      toCategoryOption(groupKey, category.label, groupFields, {
        icon: category.icon,
        compareLabels,
      })
    );
  }

  for (const [groupKey, groupFields] of fieldsByCategory) {
    if (usedGroupKeys.has(groupKey)) {
      continue;
    }

    categoryGroups.push(
      toCategoryOption(groupKey, groupFields[0].extraCategory.name, groupFields, { compareLabels })
    );
  }

  return [
    ...sortOptionsByLabel(categoryGroups, compareLabels),
    ...sortOptionsByLabel(uncategorizedFields.map(toPlainLeafOption), compareLabels),
  ];
}

function buildGeneralChildren(
  fields: ReadonlyArray<MinionSchemaField>,
  compareLabels?: LabelComparator
): MinionFieldCascaderOption[] {
  return sortOptionsByLabel(
    fields.filter((field) => field.group === MinionFilterGroup.General).map(toFieldLeafOption),
    compareLabels
  );
}

function toGroupOption(
  value: string,
  label: string,
  children: MinionFieldCascaderOption[]
): MinionFieldCascaderOption[] {
  return children.length ? [{ value, label, searchText: label, children }] : [];
}

export function buildMinionFieldCascaderOptions({
  fields,
  categories = [],
  generalGroupLabel,
  grainsGroupLabel,
  extraDataGroupLabel,
  customGrainLabel,
  compareLabels,
}: BuildMinionFieldCascaderOptionsParams): MinionFieldCascaderOption[] {
  const fieldsOf = (group: MinionFilterGroup) => fields.filter((field) => field.group === group);

  const collectionOptions = fieldsOf(MinionFilterGroup.Collection).map(toPlainLeafOption);

  const generalChildren = buildGeneralChildren(fields, compareLabels);

  const grainsChildren = sortOptionsByLabel(
    [
      ...fieldsOf(MinionFilterGroup.Grains).map(toFieldLeafOption),
      ...(customGrainLabel
        ? [
            {
              value: MINION_FIELD_CUSTOM_GRAIN_VALUE,
              label: customGrainLabel,
              searchText: customGrainLabel,
            },
          ]
        : []),
    ],
    compareLabels
  );

  const extraDataChildren = buildExtraDataChildren(
    fieldsOf(MinionFilterGroup.Extra),
    categories,
    compareLabels
  );

  return sortOptionsByLabel(
    [
      ...collectionOptions,
      ...toGroupOption(MINION_FIELD_GENERAL_GROUP_KEY, generalGroupLabel, generalChildren),
      ...toGroupOption(MINION_FIELD_GRAINS_GROUP_KEY, grainsGroupLabel, grainsChildren),
      ...toGroupOption(MINION_FIELD_EXTRA_DATA_GROUP_KEY, extraDataGroupLabel, extraDataChildren),
    ],
    compareLabels
  );
}

export function getDefaultMinionFilterField(
  options: ReadonlyArray<unknown> | undefined,
  compareLabels?: LabelComparator
): string {
  const [firstGeneralOption] = buildGeneralChildren(
    flattenMinionFilterSchemaFields(options),
    compareLabels
  );

  return firstGeneralOption?.value ?? "";
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
