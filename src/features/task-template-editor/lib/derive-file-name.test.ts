import { isValidTemplateFileName } from "../helpers/validate-template-file-name";

import { deriveTemplateFileName } from "./derive-file-name";

describe("deriveTemplateFileName", () => {
  it("транслитерирует кириллицу", () => {
    expect(deriveTemplateFileName("Установка nginx")).toBe("ustanovka_nginx");
    expect(deriveTemplateFileName("Ёжик щёлкает")).toBe("ezhik_schelkaet");
    expect(deriveTemplateFileName("Объявление")).toBe("obyavlenie");
  });

  it("схлопывает пробелы и спецсимволы в одно подчёркивание", () => {
    expect(deriveTemplateFileName("Обновление   ПО (v2)")).toBe("obnovlenie_po_v2");
    expect(deriveTemplateFileName("deploy / rollback")).toBe("deploy_rollback");
  });

  it("обрезает ведущие и замыкающие разделители", () => {
    expect(deriveTemplateFileName("-nginx-")).toBe("nginx");
    expect(deriveTemplateFileName("  запуск  ")).toBe("zapusk");
  });

  it("возвращает пустую строку, если латинских символов не осталось", () => {
    expect(deriveTemplateFileName("安装")).toBe("");
    expect(deriveTemplateFileName("!!!")).toBe("");
    expect(deriveTemplateFileName("")).toBe("");
  });

  it("даёт имя, которое проходит валидацию имени файла", () => {
    const titles = ["Установка nginx", "Обновление   ПО (v2)", "-nginx-", "Ёжик щёлкает"];

    for (const title of titles) {
      expect(isValidTemplateFileName(deriveTemplateFileName(title))).toBe(true);
    }
  });
});
