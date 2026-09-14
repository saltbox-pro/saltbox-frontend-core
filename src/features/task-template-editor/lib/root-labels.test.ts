import { moveTemplateLabelsToRoot, readTemplateLabel, writeTemplateLabel } from "./root-labels";
import type { TemplateMeta } from "./template-meta";

describe("подписи шаблона", () => {
  it("читает строку как есть", () => {
    const meta: TemplateMeta = { title: "Установка пакета" };

    expect(readTemplateLabel(meta, "title", "ru")).toBe("Установка пакета");
  });

  it("читает словарь локалей по текущему языку", () => {
    const meta: TemplateMeta = { title: { ru: "Название", en: "Title" } };

    expect(readTemplateLabel(meta, "title", "ru-RU")).toBe("Название");
    expect(readTemplateLabel(meta, "title", "en")).toBe("Title");
  });

  it("пустую схему читает пустой строкой", () => {
    expect(readTemplateLabel(null, "title", "ru")).toBe("");
    expect(readTemplateLabel({}, "description", "ru")).toBe("");
  });

  it("пишет строку в корень схемы", () => {
    const next = writeTemplateLabel({ fun: "state.apply" }, "title", "Название", "ru");

    expect(next.title).toBe("Название");
  });

  it("в словаре локалей правит только текущий язык", () => {
    const meta: TemplateMeta = { title: { ru: "Название", en: "Title" } };

    expect(writeTemplateLabel(meta, "title", "Новое", "ru-RU").title).toEqual({
      ru: "Новое",
      en: "Title",
    });
  });

  it("очистка строки оставляет пустую строку, а из словаря убирает только текущий язык", () => {
    expect(writeTemplateLabel({ title: "Название" }, "title", "   ", "ru").title).toBe("");
    expect(writeTemplateLabel({ fun: "state.apply" }, "title", "", "ru").title).toBe("");

    const localized: TemplateMeta = { title: { ru: "Название", en: "Title" } };
    expect(writeTemplateLabel(localized, "title", "", "ru").title).toEqual({ en: "Title" });
    expect(
      writeTemplateLabel({ title: { ru: "Название" } }, "title", "", "ru").title
    ).toBeUndefined();
  });

  it("переносит подписи из ui_schema в корень", () => {
    const meta: TemplateMeta = {
      ui_schema: { "ui:title": "Название", "ui:description": "Описание", kwargs: {} },
    };

    const next = moveTemplateLabelsToRoot(meta);

    expect(next.title).toBe("Название");
    expect(next.description).toBe("Описание");
    expect(next.ui_schema).toEqual({ kwargs: {} });
  });

  it("не затирает подпись, уже заданную в корне, но убирает дубль из ui_schema", () => {
    const meta: TemplateMeta = {
      title: "Из корня",
      ui_schema: { "ui:title": "Из ui_schema" },
    };

    const next = moveTemplateLabelsToRoot(meta);

    expect(next.title).toBe("Из корня");
    expect(next.ui_schema).toEqual({});
  });

  it("схему без подписей в ui_schema возвращает без изменений", () => {
    const meta: TemplateMeta = { title: "Название", ui_schema: { kwargs: {} } };

    expect(moveTemplateLabelsToRoot(meta)).toBe(meta);
    expect(moveTemplateLabelsToRoot({ fun: "state.apply" })).toEqual({ fun: "state.apply" });
  });
});
