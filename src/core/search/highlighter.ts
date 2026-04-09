import type { SearchResult, SearchOptions } from '../types';

const HIGHLIGHT_CLASS = 'dv-highlight';
const ACTIVE_CLASS = 'dv-highlight--active';

export class Highlighter {
  private results: SearchResult[] = [];
  private activeIndex = -1;
  private container: HTMLElement | null = null;

  setContainer(container: HTMLElement): void {
    this.container = container;
  }

  search(query: string, options?: SearchOptions): SearchResult[] {
    this.clearHighlights();

    if (!this.container || !query) {
      this.results = [];
      return this.results;
    }

    const caseSensitive = options?.caseSensitive ?? false;
    const wholeWord = options?.wholeWord ?? false;
    const termIndex = options?.termIndex ?? 0;

    const results: SearchResult[] = [];
    const treeWalker = document.createTreeWalker(
      this.container,
      NodeFilter.SHOW_TEXT,
      null,
    );

    const textNodes: Text[] = [];
    let node: Text | null;
    while ((node = treeWalker.nextNode() as Text | null)) {
      if (node.nodeValue && node.nodeValue.trim()) {
        textNodes.push(node);
      }
    }

    for (const textNode of textNodes) {
      const nodeText = textNode.nodeValue ?? '';
      const searchText = caseSensitive ? nodeText : nodeText.toLowerCase();
      const searchQuery = caseSensitive ? query : query.toLowerCase();

      let startIdx = 0;
      let matchIdx: number;

      while ((matchIdx = searchText.indexOf(searchQuery, startIdx)) !== -1) {
        if (wholeWord) {
          const before = matchIdx > 0 ? searchText[matchIdx - 1] : ' ';
          const after =
            matchIdx + searchQuery.length < searchText.length
              ? searchText[matchIdx + searchQuery.length]
              : ' ';
          if (/\w/.test(before) || /\w/.test(after)) {
            startIdx = matchIdx + 1;
            continue;
          }
        }

        const mark = this.wrapMatch(textNode, matchIdx, searchQuery.length, termIndex);
        if (mark) {
          results.push({
            index: results.length,
            node: mark,
            text: nodeText.slice(matchIdx, matchIdx + searchQuery.length),
            termIndex,
          });
        }

        // After wrapping, the textNode has been split -- advance past the mark
        startIdx = 0;
        break;
      }
    }

    // Need to re-run on remaining text nodes (wrapping splits them)
    if (textNodes.length > 0 && results.length > 0) {
      const moreResults = this.continueSearch(query, options, results.length);
      results.push(...moreResults);
    }

    this.results = results;
    return results;
  }

  private continueSearch(
    query: string,
    options?: SearchOptions,
    startIndex = 0,
  ): SearchResult[] {
    if (!this.container) return [];

    const caseSensitive = options?.caseSensitive ?? false;
    const wholeWord = options?.wholeWord ?? false;
    const termIndex = options?.termIndex ?? 0;
    const results: SearchResult[] = [];

    const treeWalker = document.createTreeWalker(
      this.container,
      NodeFilter.SHOW_TEXT,
      null,
    );

    let node: Text | null;
    while ((node = treeWalker.nextNode() as Text | null)) {
      if (!node.nodeValue || !node.nodeValue.trim()) continue;
      if (node.parentElement?.classList.contains(HIGHLIGHT_CLASS)) continue;

      const nodeText = node.nodeValue;
      const searchText = caseSensitive ? nodeText : nodeText.toLowerCase();
      const searchQuery = caseSensitive ? query : query.toLowerCase();

      let startIdx = 0;
      let matchIdx: number;

      while ((matchIdx = searchText.indexOf(searchQuery, startIdx)) !== -1) {
        if (wholeWord) {
          const before = matchIdx > 0 ? searchText[matchIdx - 1] : ' ';
          const after =
            matchIdx + searchQuery.length < searchText.length
              ? searchText[matchIdx + searchQuery.length]
              : ' ';
          if (/\w/.test(before) || /\w/.test(after)) {
            startIdx = matchIdx + 1;
            continue;
          }
        }

        const mark = this.wrapMatch(node, matchIdx, searchQuery.length, termIndex);
        if (mark) {
          results.push({
            index: startIndex + results.length,
            node: mark,
            text: nodeText.slice(matchIdx, matchIdx + searchQuery.length),
            termIndex,
          });
        }
        startIdx = 0;
        break;
      }
    }

    if (results.length > 0) {
      const more = this.continueSearch(query, options, startIndex + results.length);
      results.push(...more);
    }

    return results;
  }

  private wrapMatch(
    textNode: Text,
    offset: number,
    length: number,
    termIndex: number,
  ): HTMLElement | null {
    try {
      const range = document.createRange();
      range.setStart(textNode, offset);
      range.setEnd(textNode, offset + length);

      const mark = document.createElement('mark');
      mark.className = HIGHLIGHT_CLASS;
      mark.dataset.termIndex = String(termIndex);
      range.surroundContents(mark);
      return mark;
    } catch {
      return null;
    }
  }

  highlightMatch(index: number): void {
    // Remove active from previous
    if (this.activeIndex >= 0 && this.activeIndex < this.results.length) {
      this.results[this.activeIndex].node.classList.remove(ACTIVE_CLASS);
    }

    this.activeIndex = index;

    if (index >= 0 && index < this.results.length) {
      const result = this.results[index];
      result.node.classList.add(ACTIVE_CLASS);
      result.node.scrollIntoView({
        behavior: 'smooth',
        block: 'center',
        inline: 'nearest',
      });
    }
  }

  clearHighlights(): void {
    if (!this.container) return;

    const marks = this.container.querySelectorAll(`mark.${HIGHLIGHT_CLASS}`);
    marks.forEach((mark) => {
      const parent = mark.parentNode;
      if (!parent) return;

      const text = document.createTextNode(mark.textContent ?? '');
      parent.replaceChild(text, mark);
      parent.normalize();
    });

    this.results = [];
    this.activeIndex = -1;
  }

  getResults(): SearchResult[] {
    return this.results;
  }

  getActiveIndex(): number {
    return this.activeIndex;
  }
}
