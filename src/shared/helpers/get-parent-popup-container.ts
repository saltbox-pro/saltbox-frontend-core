// Popups rendered into body end up under the modal/drawer mask, so they are mounted next to the trigger.
export function getParentPopupContainer(trigger: HTMLElement): HTMLElement {
  return trigger.parentElement ?? document.body;
}
