export function createElement<K extends keyof HTMLElementTagNameMap>(
  tag: K,
  className?: string,
  parent?: HTMLElement,
): HTMLElementTagNameMap[K] {
  const el = document.createElement(tag);
  if (className) el.className = className;
  if (parent) parent.appendChild(el);
  return el;
}

export function clearElement(el: HTMLElement): void {
  while (el.firstChild) {
    el.removeChild(el.firstChild);
  }
}

export function setTextContent(el: HTMLElement, text: string): void {
  el.textContent = text;
}

export function addClasses(el: HTMLElement, ...classes: string[]): void {
  el.classList.add(...classes);
}

export function removeClasses(el: HTMLElement, ...classes: string[]): void {
  el.classList.remove(...classes);
}

export function escapeHtml(text: string): string {
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}
