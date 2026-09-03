import {
  applyTranslations,
  collectTemplateLocales,
  collectTranslationKeys,
  collectTranslationRows,
  pickPreviewLanguage,
  isValidLocaleCode,
} from "./template-i18n";
import type { TemplateMeta } from "./template-meta";

const meta: TemplateMeta = {
  fun: "state.apply",
  json_schema: {
    type: "object",
    properties: {
      kwargs: {
        type: "object",
        properties: {
          pillar: {
            type: "object",
            properties: {
              host: { type: "string", description: "{{host_description}}" },
            },
          },
        },
      },
    },
  },
  ui_schema: {
    kwargs: {
      pillar: {
        host: { "ui:title": "{{host_title}}", "ui:description": "{{host_description}}" },
      },
    },
  },
  i18n: {
    ru: { host_title: "Хост", host_description: "Адрес хоста", legacy_key: "Старый текст" },
    en: { host_title: "Host" },
  },
};

describe("переводы шаблона", () => {
  it("собирает ключи из ui_schema и json_schema без дублей", () => {
    expect([...collectTranslationKeys(meta)].sort()).toEqual(["host_description", "host_title"]);
  });

  it("считает используемыми ключи из собственных title и description шаблона", () => {
    const withOwnLabels: TemplateMeta = {
      ...meta,
      title: "{{template_title}}",
      description: "{{template_description}}",
    };

    expect([...collectTranslationKeys(withOwnLabels)].sort()).toEqual([
      "host_description",
      "host_title",
      "template_description",
      "template_title",
    ]);

    const rows = collectTranslationRows(withOwnLabels);
    expect(rows.find((row) => row.key === "template_title")?.isOrphan).toBe(false);
    expect(rows.find((row) => row.key === "template_description")?.isOrphan).toBe(false);
  });

  it("показывает ru и en всегда, дальше локали шаблона по алфавиту", () => {
    expect(collectTemplateLocales({})).toEqual(["ru", "en"]);
    expect(collectTemplateLocales({ i18n: { fr: {}, de: {}, en: {} } })).toEqual([
      "ru",
      "en",
      "de",
      "fr",
    ]);
  });

  it("строит строки с переводами и помечает осиротевшие ключи", () => {
    const rows = collectTranslationRows(meta);

    expect(rows.map((row) => row.key)).toEqual(["host_description", "host_title", "legacy_key"]);
    expect(rows.find((row) => row.key === "legacy_key")?.isOrphan).toBe(true);
    expect(rows.find((row) => row.key === "host_title")).toEqual({
      key: "host_title",
      isOrphan: false,
      values: { ru: "Хост", en: "Host" },
    });
  });

  it("не падает на схеме без переводов", () => {
    expect(collectTranslationRows(null)).toEqual([]);
    expect(collectTranslationRows({ ui_schema: { "ui:title": "Обычный текст" } })).toEqual([]);
  });

  it("записывает и подчищает переводы", () => {
    const updated = applyTranslations(meta, "host_title", { ru: "  Сервер  ", en: "" });

    expect(updated.i18n?.ru?.host_title).toBe("Сервер");
    expect(updated.i18n?.en).toBeUndefined();
    // Локаль исчезает целиком, когда после правки в ней не осталось ключей
    expect(Object.keys(updated.i18n ?? {})).toEqual(["ru"]);
  });

  it("не трогает локали, которых не было в форме", () => {
    const updated = applyTranslations(meta, "host_title", { ru: "Сервер" });

    expect(updated.i18n?.en?.host_title).toBe("Host");
  });

  it("убирает пустой i18n из схемы", () => {
    const single: TemplateMeta = { fun: "test.ping", i18n: { ru: { title: "Заголовок" } } };

    expect("i18n" in applyTranslations(single, "title", { ru: "" })).toBe(false);
  });

  it("добавляет новую локаль", () => {
    const updated = applyTranslations(meta, "host_title", { de: "Server" });

    expect(updated.i18n?.de).toEqual({ host_title: "Server" });
  });

  it("проверяет код локали", () => {
    expect(isValidLocaleCode("de")).toBe(true);
    expect(isValidLocaleCode("zh-Hans")).toBe(true);
    expect(isValidLocaleCode("ru-RU")).toBe(true);
    expect(isValidLocaleCode("russian")).toBe(false);
    expect(isValidLocaleCode("DE")).toBe(false);
    expect(isValidLocaleCode("")).toBe(false);
  });

  describe("pickPreviewLanguage", () => {
    it("возвращает выбранный язык если он есть в списке", () => {
      expect(pickPreviewLanguage(["ru", "en", "de"], "de", "en-US")).toBe("de");
    });

    it("если выбранный язык отсутствует, использует нормализованный fallback", () => {
      expect(pickPreviewLanguage(["ru", "en", "de"], "es", "en-US")).toBe("en");
    });

    it("fallback нормализуется до базового кода", () => {
      expect(pickPreviewLanguage(["ru", "en"], null, "en-US")).toBe("en");
    });

    it("если в списке нет нормализованного fallback, берёт первый локаль", () => {
      expect(pickPreviewLanguage(["ru", "en"], "es", "fr-FR")).toBe("ru");
    });

    it("если список пуст, возвращает нормализованный fallback", () => {
      expect(pickPreviewLanguage([], null, "en-US")).toBe("en");
    });
  });
});
