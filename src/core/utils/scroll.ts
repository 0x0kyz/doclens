export function scrollToElement(
  element: HTMLElement,
  options?: ScrollIntoViewOptions,
): void {
  element.scrollIntoView(
    options ?? { behavior: 'smooth', block: 'center', inline: 'nearest' },
  );
}

export function scrollToFirstHighlight(
  container: HTMLElement,
  selector = '.dv-highlight',
): void {
  const first = container.querySelector<HTMLElement>(selector);
  if (first) {
    scrollToElement(first);
  }
}
