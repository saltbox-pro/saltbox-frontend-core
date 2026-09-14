import { loader } from "@monaco-editor/react";
import { AppLanguage } from "@saltbox/saltbox-frontend-common";

import { i18nStore } from "saltbox-core/store";

let ready: Promise<void> | null = null;
let isReady = false;

/**
 * Подключает локальную сборку monaco к `@monaco-editor/react` и локализует
 * встроенное меню редактора. Переводы monaco читает из `globalThis` при первой
 * загрузке модуля, поэтому файл сообщений выполняется до импорта редактора, а
 * язык меню фиксируется на всю сессию: смена языка интерфейса подхватится
 * только после перезагрузки страницы.
 */
export function ensureMonaco(): Promise<void> {
  ready ??= (async () => {
    if (i18nStore.currentLanguage === AppLanguage.RU) {
      await import("monaco-editor/esm/nls.messages.ru.js");
    }
    const monaco = await import("monaco-editor");
    loader.config({ monaco });
    isReady = true;
  })().catch((error: unknown) => {
    // Даём следующему монтированию редактора повторить загрузку
    ready = null;
    throw error;
  });

  return ready;
}

export const isMonacoReady = (): boolean => isReady;
