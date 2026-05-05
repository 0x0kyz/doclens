import { BaseRenderer } from './BaseRenderer';
import type { RendererContext, SearchResult, SearchOptions } from '../types';
import { escapeHtml } from '../utils/dom';

interface SheetData {
  name: string;
  headers: string[];
  rows: string[][];
}

export class SpreadsheetRenderer extends BaseRenderer {
  private sheets: SheetData[] = [];
  private activeSheet = 0;
  private tableWrapper: HTMLElement | null = null;
  private tabsEl: HTMLElement | null = null;

  async render(ctx: RendererContext): Promise<void> {
    await super.render(ctx);

    this.sheets = await this.parseData(ctx);

    const wrapper = document.createElement('div');
    wrapper.className = 'dv-spreadsheet';

    this.tableWrapper = document.createElement('div');
    this.tableWrapper.className = 'dv-table-wrapper';
    wrapper.appendChild(this.tableWrapper);

    if (this.sheets.length > 1) {
      this.tabsEl = document.createElement('div');
      this.tabsEl.className = 'dv-sheet-tabs';
      this.renderTabs();
      wrapper.appendChild(this.tabsEl);
    }

    this.renderSheet(this.activeSheet);

    ctx.container.appendChild(wrapper);
    this.contentEl = wrapper;
    this.highlighter.setContainer(this.tableWrapper!);
  }

  private async parseData(ctx: RendererContext): Promise<SheetData[]> {
    const fileType = ctx.fileType;

    if (fileType === 'csv') {
      return this.parseCSV(ctx.data);
    }

    return this.parseExcel(ctx.data);
  }

  private async parseCSV(data: ArrayBuffer): Promise<SheetData[]> {
    try {
      const Papa = await import('papaparse').then(m => m.default ?? m);
      const text = new TextDecoder('utf-8').decode(data);
      const result = Papa.parse(text, { header: false });

      const allRows = result.data.filter(
        (row: any) => row.some((cell: any) => cell.trim()),
      );

      if (allRows.length === 0) return [{ name: 'Sheet1', headers: [], rows: [] }];

      const headers = allRows[0] as string[];
      const rows = allRows.slice(1) as string[][];

      return [{ name: 'Sheet1', headers, rows }];
    } catch {
      return this.parseCSVFallback(data);
    }
  }

  private parseCSVFallback(data: ArrayBuffer): SheetData[] {
    const text = new TextDecoder('utf-8').decode(data);
    const lines = text.split('\n').filter((l) => l.trim());

    if (lines.length === 0) return [{ name: 'Sheet1', headers: [], rows: [] }];

    const headers = lines[0].split(',').map((h) => h.trim());
    const rows = lines.slice(1).map((l) => l.split(',').map((c) => c.trim()));

    return [{ name: 'Sheet1', headers, rows }];
  }

  private async parseExcel(data: ArrayBuffer): Promise<SheetData[]> {
    try {
      const XLSX = await import('xlsx').then(m => m.default ?? m);
      const workbook = XLSX.read(data, { type: 'array' });

      return workbook.SheetNames.map((name: string) => {
        const sheet = workbook.Sheets[name];
        const jsonData: string[][] = XLSX.utils.sheet_to_json(sheet, {
          header: 1,
          defval: '',
        });

        const allRows = (jsonData as string[][]).filter(
          (row) => row.some((cell) => String(cell).trim()),
        );

        if (allRows.length === 0) return { name, headers: [], rows: [] };

        const headers = allRows[0].map(String);
        const rows = allRows.slice(1).map((row) => row.map(String));

        return { name, headers, rows };
      });
    } catch (err) {
      throw new Error(`Failed to parse spreadsheet: ${err instanceof Error ? err.message : 'Unknown error'}`);
    }
  }

  private renderSheet(index: number): void {
    if (!this.tableWrapper) return;

    this.activeSheet = index;
    this.tableWrapper.innerHTML = '';

    const sheet = this.sheets[index];
    if (!sheet || (sheet.headers.length === 0 && sheet.rows.length === 0)) {
      this.tableWrapper.innerHTML = '<div class="dv-loading">Empty sheet</div>';
      return;
    }

    const table = document.createElement('table');
    table.className = 'dv-table';

    // Header
    if (sheet.headers.length > 0) {
      const thead = document.createElement('thead');
      const tr = document.createElement('tr');
      sheet.headers.forEach((h) => {
        const th = document.createElement('th');
        th.textContent = h;
        tr.appendChild(th);
      });
      thead.appendChild(tr);
      table.appendChild(thead);
    }

    // Body
    const tbody = document.createElement('tbody');
    const maxRows = Math.min(sheet.rows.length, 10000);
    for (let i = 0; i < maxRows; i++) {
      const row = sheet.rows[i];
      const tr = document.createElement('tr');
      row.forEach((cell) => {
        const td = document.createElement('td');
        td.textContent = cell;
        tr.appendChild(td);
      });
      tbody.appendChild(tr);
    }

    if (sheet.rows.length > maxRows) {
      const tr = document.createElement('tr');
      const td = document.createElement('td');
      td.colSpan = sheet.headers.length || 1;
      td.textContent = `... ${sheet.rows.length - maxRows} more rows`;
      td.style.textAlign = 'center';
      td.style.fontStyle = 'italic';
      tr.appendChild(td);
      tbody.appendChild(tr);
    }

    table.appendChild(tbody);
    this.tableWrapper.appendChild(table);

    this.highlighter.setContainer(this.tableWrapper);
    this.updateActiveTabs();
  }

  private renderTabs(): void {
    if (!this.tabsEl) return;
    this.tabsEl.innerHTML = '';

    this.sheets.forEach((sheet, i) => {
      const tab = document.createElement('button');
      tab.className = `dv-sheet-tab${i === this.activeSheet ? ' dv-sheet-tab--active' : ''}`;
      tab.textContent = sheet.name;
      tab.addEventListener('click', () => {
        this.highlighter.clearHighlights();
        this.renderSheet(i);
      });
      this.tabsEl!.appendChild(tab);
    });
  }

  private updateActiveTabs(): void {
    if (!this.tabsEl) return;
    const tabs = this.tabsEl.querySelectorAll('.dv-sheet-tab');
    tabs.forEach((tab, i) => {
      tab.classList.toggle('dv-sheet-tab--active', i === this.activeSheet);
    });
  }

  search(query: string, options?: SearchOptions): SearchResult[] {
    return this.highlighter.search(query, options);
  }

  getTextContent(): string {
    return this.sheets
      .map((s) => [s.headers.join('\t'), ...s.rows.map((r) => r.join('\t'))].join('\n'))
      .join('\n\n');
  }
}
