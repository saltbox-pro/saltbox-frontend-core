import { MinionFilterGroup } from "@saltbox/saltbox-core-api-client";

import {
  buildMinionFieldCascaderOptions,
  flattenMinionFilterSchemaFields,
  getMinionFieldCascaderValue,
  MINION_FIELD_CUSTOM_GRAIN_VALUE,
  MINION_FIELD_EXTRA_DATA_GROUP_KEY,
  MINION_FIELD_GENERAL_GROUP_KEY,
  MINION_FIELD_GRAINS_GROUP_KEY,
  type MinionSchemaField,
} from "./minion-field-cascader";

const BASE_GROUP_LABELS = {
  generalGroupLabel: "Общие данные",
  grainsGroupLabel: "Данные grains",
  extraDataGroupLabel: "Расширенные данные",
};

const GROUP_LABELS = { ...BASE_GROUP_LABELS, customGrainLabel: "Произвольный grain" };

const HARDWARE = { source: "system", name: "hardware" };

const field = (
  group: MinionFilterGroup,
  name: string,
  label: string,
  extraCategory?: MinionSchemaField["extraCategory"]
): MinionSchemaField => ({ name, label, group, ...(extraCategory ? { extraCategory } : {}) });

describe("flattenMinionFilterSchemaFields", () => {
  it("flattens nested option groups with backend group and extra category", () => {
    expect(
      flattenMinionFilterSchemaFields([
        { name: "grains.os", label: "OS", group: "grains" },
        {
          label: "group",
          options: [
            {
              name: "extra.system.hw.cpu",
              label: "CPU",
              group: "extra",
              extra_category: { source: "system", name: "hw" },
            },
          ],
        },
      ])
    ).toEqual([
      field(MinionFilterGroup.Grains, "grains.os", "OS"),
      field(MinionFilterGroup.Extra, "extra.system.hw.cpu", "CPU", {
        source: "system",
        name: "hw",
      }),
    ]);
  });

  it("falls back to value when name is missing", () => {
    expect(
      flattenMinionFilterSchemaFields([{ value: "host", label: "Host", group: "general" }])
    ).toEqual([field(MinionFilterGroup.General, "host", "Host")]);
  });
});

describe("buildMinionFieldCascaderOptions", () => {
  const fields = [
    field(MinionFilterGroup.General, "minion_id", "Minion ID"),
    field(MinionFilterGroup.Grains, "grains.os", "OS"),
    field(MinionFilterGroup.Collection, "collection", "Collection"),
    field(MinionFilterGroup.Grains, "grains.host", "Host"),
    field(MinionFilterGroup.General, "last_activity", "Last activity"),
    field(MinionFilterGroup.Extra, "extra", "Extra aggregated data"),
    field(
      MinionFilterGroup.Extra,
      "extra.system.hardware.cpu",
      'Extra data field "system.hardware.cpu"',
      HARDWARE
    ),
    field(
      MinionFilterGroup.Extra,
      "extra.system.hardware.ram",
      'Extra data field "system.hardware.ram"',
      HARDWARE
    ),
    field(
      MinionFilterGroup.Extra,
      "extra.user.notes.comment",
      'Extra data field "user.notes.comment"',
      { source: "user", name: "notes" }
    ),
    field(
      MinionFilterGroup.Extra,
      "extra.orphan.cat.field",
      'Extra data field "orphan.cat.field"',
      { source: "orphan", name: "cat" }
    ),
  ];

  const categories = [
    { source: "user", name: "notes", label: "Заметки", icon: "sticky_note_2" },
    { ...HARDWARE, label: "Оборудование", icon: "memory" },
    { source: "system", name: "empty", label: "Пустая", icon: "inbox" },
  ];

  const options = buildMinionFieldCascaderOptions({ fields, categories, ...GROUP_LABELS });

  it("orders root options as collection, general, grains, extra data", () => {
    expect(options.map((option) => option.value)).toEqual([
      "collection",
      MINION_FIELD_GENERAL_GROUP_KEY,
      MINION_FIELD_GRAINS_GROUP_KEY,
      MINION_FIELD_EXTRA_DATA_GROUP_KEY,
    ]);
    expect(options[0]).toEqual({
      value: "collection",
      label: "Collection",
      searchText: "Collection collection",
    });
  });

  it("puts general fields into general group", () => {
    expect(options[1]).toEqual({
      value: MINION_FIELD_GENERAL_GROUP_KEY,
      label: "Общие данные",
      searchText: "Общие данные",
      children: [
        { value: "minion_id", label: "Minion ID (minion_id)", searchText: "Minion ID minion_id" },
        {
          value: "last_activity",
          label: "Last activity (last_activity)",
          searchText: "Last activity last_activity",
        },
      ],
    });
  });

  it("puts grains fields into grains group with custom grain option", () => {
    expect(options[2]).toEqual({
      value: MINION_FIELD_GRAINS_GROUP_KEY,
      label: "Данные grains",
      searchText: "Данные grains",
      children: [
        { value: "grains.os", label: "OS (grains.os)", searchText: "OS grains.os" },
        { value: "grains.host", label: "Host (grains.host)", searchText: "Host grains.host" },
        {
          value: MINION_FIELD_CUSTOM_GRAIN_VALUE,
          label: "Произвольный grain",
          searchText: "Произвольный grain",
        },
      ],
    });
  });

  it("groups by backend group instead of field name", () => {
    const grouped = buildMinionFieldCascaderOptions({
      fields: [
        field(MinionFilterGroup.General, "grains.uptime", "Uptime"),
        field(MinionFilterGroup.Grains, "os_family", "OS family"),
      ],
      ...BASE_GROUP_LABELS,
    });

    expect(grouped.map((option) => option.children?.map((child) => child.value))).toEqual([
      ["grains.uptime"],
      ["os_family"],
    ]);
  });

  it("nests extra data categories and uncategorized fields last into extra data group", () => {
    const extraGroup = options[3];

    expect(extraGroup?.label).toBe("Расширенные данные");
    expect(extraGroup?.children?.map((child) => child.value)).toEqual([
      "user.notes",
      "system.hardware",
      "orphan.cat",
      "extra",
    ]);
    expect(extraGroup?.children?.at(-1)).toEqual({
      value: "extra",
      label: "Extra aggregated data",
      searchText: "Extra aggregated data extra",
    });
    expect(extraGroup?.children?.[1]).toEqual({
      value: "system.hardware",
      label: "Оборудование",
      icon: "memory",
      searchText: "Оборудование",
      children: [
        {
          value: "extra.system.hardware.cpu",
          label: "cpu",
          searchText:
            'Оборудование cpu Extra data field "system.hardware.cpu" extra.system.hardware.cpu',
        },
        {
          value: "extra.system.hardware.ram",
          label: "ram",
          searchText:
            'Оборудование ram Extra data field "system.hardware.ram" extra.system.hardware.ram',
        },
      ],
    });
  });

  it("skips empty categories and keeps unmatched categories by category name", () => {
    const extraChildren = options[3]?.children ?? [];

    expect(extraChildren.some((option) => option.value === "system.empty")).toBe(false);
    expect(extraChildren.at(-2)).toEqual({
      value: "orphan.cat",
      label: "cat",
      searchText: "cat",
      children: [
        {
          value: "extra.orphan.cat.field",
          label: "field",
          searchText: 'cat field Extra data field "orphan.cat.field" extra.orphan.cat.field',
        },
      ],
    });
  });

  it("keeps dotted extra field names and falls back to label for foreign paths", () => {
    const custom = { source: "user", name: "custom" };
    const withDotted = buildMinionFieldCascaderOptions({
      fields: [
        field(MinionFilterGroup.Extra, "extra.user.custom.nested.field", "Nested", custom),
        field(MinionFilterGroup.Extra, "extra.other.path", "Foreign", custom),
      ],
      ...BASE_GROUP_LABELS,
    });

    expect(
      withDotted[0]?.children?.[0]?.children?.map((child) => [child.value, child.label])
    ).toEqual([
      ["extra.user.custom.nested.field", "nested.field"],
      ["extra.other.path", "Foreign"],
    ]);
  });

  it("omits empty general and extra data groups", () => {
    const grainsOnly = buildMinionFieldCascaderOptions({
      fields: [field(MinionFilterGroup.Grains, "grains.os", "OS")],
      ...GROUP_LABELS,
    });

    expect(grainsOnly.map((option) => option.value)).toEqual([MINION_FIELD_GRAINS_GROUP_KEY]);
  });

  it("omits custom grain option and empty grains group without custom grain label", () => {
    const withGrains = buildMinionFieldCascaderOptions({
      fields: [field(MinionFilterGroup.Grains, "grains.os", "OS")],
      ...BASE_GROUP_LABELS,
    });
    expect(withGrains[0]?.children?.map((child) => child.value)).toEqual(["grains.os"]);

    const withoutGrains = buildMinionFieldCascaderOptions({
      fields: [field(MinionFilterGroup.General, "minion_id", "Minion ID")],
      ...BASE_GROUP_LABELS,
    });
    expect(withoutGrains.map((option) => option.value)).toEqual([MINION_FIELD_GENERAL_GROUP_KEY]);
  });

  it("builds single group for duplicated categories", () => {
    const hardware = { ...HARDWARE, label: "Оборудование" };
    const withDuplicates = buildMinionFieldCascaderOptions({
      fields: [
        field(MinionFilterGroup.Extra, "extra.system.hardware.cpu", "CPU", HARDWARE),
        field(MinionFilterGroup.Extra, "extra.system.hardware.ram", "RAM", HARDWARE),
      ],
      categories: [hardware, hardware],
      ...GROUP_LABELS,
    });

    expect(withDuplicates.at(-1)?.children?.map((child) => child.value)).toEqual([
      "system.hardware",
    ]);
  });

  it("keeps extra fields without category inside extra data group", () => {
    const withUncategorized = buildMinionFieldCascaderOptions({
      fields: [field(MinionFilterGroup.Extra, "extra.foo", "Short extra")],
      ...GROUP_LABELS,
    });

    expect(withUncategorized.at(-1)?.children).toEqual([
      { value: "extra.foo", label: "Short extra", searchText: "Short extra extra.foo" },
    ]);
  });
});

describe("getMinionFieldCascaderValue", () => {
  const options = buildMinionFieldCascaderOptions({
    fields: [
      field(MinionFilterGroup.Collection, "collection", "Collection"),
      field(MinionFilterGroup.General, "minion_id", "Minion ID"),
      field(MinionFilterGroup.Grains, "grains.os", "OS"),
      field(MinionFilterGroup.Extra, "extra", "Extra aggregated data"),
      field(MinionFilterGroup.Extra, "extra.system.hardware.cpu", "CPU", HARDWARE),
    ],
    categories: [{ ...HARDWARE, label: "Оборудование", icon: "memory" }],
    ...GROUP_LABELS,
  });

  it("returns path for root collection field", () => {
    expect(getMinionFieldCascaderValue("collection", options)).toEqual(["collection"]);
  });

  it("returns path for general and grain fields", () => {
    expect(getMinionFieldCascaderValue("minion_id", options)).toEqual([
      MINION_FIELD_GENERAL_GROUP_KEY,
      "minion_id",
    ]);
    expect(getMinionFieldCascaderValue("grains.os", options)).toEqual([
      MINION_FIELD_GRAINS_GROUP_KEY,
      "grains.os",
    ]);
  });

  it("returns path for extra data fields", () => {
    expect(getMinionFieldCascaderValue("extra", options)).toEqual([
      MINION_FIELD_EXTRA_DATA_GROUP_KEY,
      "extra",
    ]);
    expect(getMinionFieldCascaderValue("extra.system.hardware.cpu", options)).toEqual([
      MINION_FIELD_EXTRA_DATA_GROUP_KEY,
      "system.hardware",
      "extra.system.hardware.cpu",
    ]);
  });

  it("returns undefined for unknown field", () => {
    expect(getMinionFieldCascaderValue("missing.field", options)).toBeUndefined();
  });

  it("returns custom grain path", () => {
    expect(getMinionFieldCascaderValue("grains.foo", options, true)).toEqual([
      MINION_FIELD_GRAINS_GROUP_KEY,
      MINION_FIELD_CUSTOM_GRAIN_VALUE,
    ]);
  });
});
