import { migrateMetaFormat } from "./migrate-meta-format";
import { extractParamsFormSchema } from "./params-subtree";
import { readSecretNames } from "./secret-pillars";
import { stringifyMeta, type TemplateMeta } from "./template-meta";

/** Как шаблон выглядел до переезда подписей и укорачивания secret_pillars. */
const legacyMeta = (): TemplateMeta => ({
  fun: "state.apply",
  query: { minion_id: { $in: ["web-1"] } },
  json_schema: {
    type: "object",
    additionalProperties: false,
    required: ["kwargs"],
    properties: {
      kwargs: {
        type: "object",
        additionalProperties: false,
        required: ["pillar"],
        properties: {
          pillar: {
            type: "object",
            additionalProperties: false,
            required: ["token"],
            properties: { message: { type: "string" }, token: { type: "string" } },
          },
        },
      },
    },
  },
  ui_schema: {
    "ui:title": "{{template_title}}",
    "ui:description": "Разворачивает конфиг",
    kwargs: {
      "ui:label": false,
      pillar: {
        "ui:label": false,
        message: { "ui:title": "{{message_title}}" },
        token: { "ui:widget": "password" },
      },
    },
  },
  i18n: { ru: { template_title: "Деплой", message_title: "Сообщение" } },
  defaults: { ttl: 600 },
  secret_pillars: ["kwargs.pillar.token"],
});

describe("миграция схемы шаблона при открытии", () => {
  it("поднимает подписи в корень и убирает их из ui_schema", () => {
    const next = migrateMetaFormat(legacyMeta(), "state.apply");

    expect(next.title).toBe("{{template_title}}");
    expect(next.description).toBe("Разворачивает конфиг");
    expect(next.ui_schema).not.toHaveProperty("ui:title");
    expect(next.ui_schema).not.toHaveProperty("ui:description");
  });

  it("обрезает secret_pillars до имени параметра", () => {
    const next = migrateMetaFormat(legacyMeta(), "state.apply");

    expect(next.secret_pillars).toEqual(["token"]);
    // визуальный редактор должен увидеть галочку «Секретное поле»
    expect(readSecretNames(next, "state.apply")).toEqual(["token"]);
  });

  it("не трогает ничего, кроме этих двух форматов", () => {
    const before = legacyMeta();
    const next = migrateMetaFormat(before, "state.apply");

    expect(next.fun).toBe(before.fun);
    expect(next.query).toEqual(before.query);
    expect(next.json_schema).toEqual(before.json_schema);
    expect(next.i18n).toEqual(before.i18n);
    expect(next.defaults).toEqual(before.defaults);
    // настройки полей, включая маску секрета, остаются на месте
    expect((next.ui_schema as Record<string, any>).kwargs).toEqual(
      (before.ui_schema as Record<string, any>).kwargs
    );
  });

  it("не ломает исходный объект", () => {
    const before = legacyMeta();
    migrateMetaFormat(before, "state.apply");

    expect(before).toEqual(legacyMeta());
  });

  it("параметры формы после миграции читаются как прежде", () => {
    const next = migrateMetaFormat(legacyMeta(), "state.apply");
    const { json_schema, ui_schema } = extractParamsFormSchema(next, "state.apply");

    expect(Object.keys((json_schema as { properties: object }).properties)).toEqual([
      "message",
      "token",
    ]);
    expect(ui_schema.message).toEqual({ "ui:title": "{{message_title}}" });
    // подписи шаблона в поддерево параметров не утекают
    expect(ui_schema["ui:title"]).toBeUndefined();
  });

  it("плейсхолдер подписи переживает переезд вместе со словарём переводов", () => {
    const next = migrateMetaFormat(legacyMeta(), "state.apply");

    expect(next.title).toBe("{{template_title}}");
    expect(next.i18n?.ru?.template_title).toBe("Деплой");
  });

  it("повторное открытие уже мигрированного шаблона ничего не меняет", () => {
    const once = migrateMetaFormat(legacyMeta(), "state.apply");
    const twice = migrateMetaFormat(once, "state.apply");

    expect(stringifyMeta(twice)).toBe(stringifyMeta(once));
  });

  it("заполненный корень выигрывает у ui_schema, пустой — уступает", () => {
    const filled = migrateMetaFormat({ ...legacyMeta(), title: "Из корня" }, "state.apply");
    expect(filled.title).toBe("Из корня");

    // бекенд отдаёт незаполненную подпись и как null, и как пустую строку
    for (const empty of [null, "", "   ", {}]) {
      const next = migrateMetaFormat(
        { ...legacyMeta(), title: empty } as TemplateMeta,
        "state.apply"
      );
      expect(next.title).toBe("{{template_title}}");
    }
  });

  it("обычной функции обрезает её собственный префикс", () => {
    const meta: TemplateMeta = {
      fun: "pkg.install",
      json_schema: {
        type: "object",
        properties: { kwargs: { type: "object", properties: { token: { type: "string" } } } },
      },
      secret_pillars: ["kwargs.token"],
    };

    expect(migrateMetaFormat(meta, "pkg.install").secret_pillars).toEqual(["token"]);
  });

  it("шаблон нового формата остаётся тем же объектом", () => {
    const modern: TemplateMeta = {
      fun: "state.apply",
      title: "Деплой",
      ui_schema: { kwargs: { "ui:label": false } },
      secret_pillars: ["token"],
    };

    expect(migrateMetaFormat(modern, "state.apply")).toEqual(modern);
  });
});
