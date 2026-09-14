import { useEffect, useRef } from "react";
import { navigateToUrl } from "single-spa";

interface BeforeRoutingEventDetail {
  oldUrl: string;
  newUrl: string;
  cancelNavigation: () => void;
}

/**
 * Не даёт уйти со страницы с несохранёнными правками без подтверждения.
 *
 * Закрытие вкладки и перезагрузку ловит `beforeunload`. Переходы внутри
 * платформы (меню base, кнопка «назад», браузерные back/forward) проходят
 * через single-spa: его `before-routing-event` отменяет переход только
 * синхронно, поэтому навигация сначала отменяется, а после подтверждения в
 * модалке повторяется через `navigateToUrl`.
 */
export function useUnsavedChangesGuard(
  isDirty: () => boolean,
  confirm: () => Promise<boolean>
): void {
  // Геттер, а не значение: после сохранения переход на список идёт в том же
  // тике, что и сброс «грязи», до ре-рендера
  const isDirtyRef = useRef(isDirty);
  const confirmRef = useRef(confirm);
  isDirtyRef.current = isDirty;
  confirmRef.current = confirm;

  useEffect(() => {
    // Переход уже подтверждён: следующее событие роутинга пропускаем
    let bypassNext = false;
    // После отмены single-spa возвращает старый URL — это не уход со страницы
    let returnUrl: string | null = null;

    const handleBeforeUnload = (event: BeforeUnloadEvent) => {
      if (!isDirtyRef.current()) return;

      event.preventDefault();
      // Без returnValue старые браузеры не показывают диалог
      event.returnValue = "";
    };

    const handleBeforeRouting = (event: Event) => {
      const { oldUrl, newUrl, cancelNavigation } = (event as CustomEvent<BeforeRoutingEventDetail>)
        .detail;

      if (bypassNext) {
        bypassNext = false;
        return;
      }
      if (newUrl === oldUrl) return;
      if (newUrl === returnUrl) {
        returnUrl = null;
        return;
      }
      if (!isDirtyRef.current()) return;

      cancelNavigation();
      returnUrl = oldUrl;

      confirmRef.current().then((shouldLeave) => {
        if (!shouldLeave) return;

        bypassNext = true;
        navigateToUrl(newUrl);
      });
    };

    window.addEventListener("beforeunload", handleBeforeUnload);
    window.addEventListener("single-spa:before-routing-event", handleBeforeRouting);

    return () => {
      window.removeEventListener("beforeunload", handleBeforeUnload);
      window.removeEventListener("single-spa:before-routing-event", handleBeforeRouting);
    };
  }, []);
}
