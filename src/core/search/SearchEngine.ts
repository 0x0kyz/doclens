import type { SearchResult, SearchOptions, ISearchable } from '../types';
import { Highlighter } from './highlighter';

export class SearchEngine {
  private highlighter = new Highlighter();
  private currentQuery = '';
  private activeIndex = -1;
  private allResults: SearchResult[] = [];
  private customSearchable: ISearchable | null = null;

  setContainer(container: HTMLElement): void {
    this.highlighter.setContainer(container);
  }

  setSearchable(searchable: ISearchable | null): void {
    this.customSearchable = searchable;
  }

  search(query: string, options?: SearchOptions): SearchResult[] {
    this.currentQuery = query;
    this.activeIndex = -1;

    if (!query) {
      this.clear();
      return [];
    }

    if (this.customSearchable) {
      this.allResults = this.customSearchable.search(query, options);
    } else {
      this.allResults = this.highlighter.search(query, options);
    }

    if (this.allResults.length > 0) {
      this.activeIndex = 0;
      this.activateMatch(0);
    }

    return this.allResults;
  }

  searchMultiple(terms: string[], options?: Omit<SearchOptions, 'termIndex'>): SearchResult[] {
    this.allResults = [];
    this.activeIndex = -1;

    for (let i = 0; i < terms.length; i++) {
      const term = terms[i];
      if (!term) continue;

      const termOptions: SearchOptions = { ...options, termIndex: i };

      if (this.customSearchable) {
        const results = this.customSearchable.search(term, termOptions);
        this.allResults.push(...results);
      } else {
        const results = this.highlighter.search(term, termOptions);
        this.allResults.push(...results);
      }
    }

    // Re-index
    this.allResults.forEach((r, i) => {
      r.index = i;
    });

    if (this.allResults.length > 0) {
      this.activeIndex = 0;
      this.activateMatch(0);
    }

    return this.allResults;
  }

  nextMatch(): number {
    if (this.allResults.length === 0) return -1;

    this.activeIndex = (this.activeIndex + 1) % this.allResults.length;
    this.activateMatch(this.activeIndex);
    return this.activeIndex;
  }

  prevMatch(): number {
    if (this.allResults.length === 0) return -1;

    this.activeIndex =
      (this.activeIndex - 1 + this.allResults.length) % this.allResults.length;
    this.activateMatch(this.activeIndex);
    return this.activeIndex;
  }

  goToMatch(index: number): void {
    if (index >= 0 && index < this.allResults.length) {
      this.activeIndex = index;
      this.activateMatch(index);
    }
  }

  clear(): void {
    if (this.customSearchable) {
      this.customSearchable.clearHighlights();
    } else {
      this.highlighter.clearHighlights();
    }
    this.allResults = [];
    this.activeIndex = -1;
    this.currentQuery = '';
  }

  getResults(): SearchResult[] {
    return this.allResults;
  }

  getActiveIndex(): number {
    return this.activeIndex;
  }

  getQuery(): string {
    return this.currentQuery;
  }

  getCount(): number {
    return this.allResults.length;
  }

  /**
   * Replace the current results (e.g. after async OCR yields more matches).
   */
  setResults(results: SearchResult[]): void {
    this.allResults = results;
    this.allResults.forEach((r, i) => { r.index = i; });
    if (this.allResults.length > 0 && this.activeIndex < 0) {
      this.activeIndex = 0;
      this.activateMatch(0);
    }
  }

  private activateMatch(index: number): void {
    if (this.customSearchable) {
      this.customSearchable.highlightMatch(index);
    } else {
      this.highlighter.highlightMatch(index);
    }
  }
}
