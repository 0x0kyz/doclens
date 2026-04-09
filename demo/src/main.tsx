import React, { useState, useCallback } from "react";
import { createRoot } from "react-dom/client";
import { DocViewer } from "doclens";
import type { DocumentSource, ThemePreset } from "doclens";

/* ------------------------------------------------------------------ */
/*  Inline sample data (no external files needed)                      */
/* ------------------------------------------------------------------ */

const SAMPLE_JSON = JSON.stringify(
  {
    name: "DocLens",
    version: "0.1.0",
    description: "Universal document viewer library",
    features: [
      "PDF",
      "XLSX",
      "CSV",
      "PPTX",
      "DOCX",
      "XML",
      "JSON",
      "HTML",
      "Markdown",
    ],
    config: {
      search: { enabled: true, caseSensitive: false },
      zoom: { min: 0.25, max: 5, step: 0.25 },
      theme: { light: true, dark: true },
    },
    keywords: [
      "document",
      "viewer",
      "search",
      "highlight",
      "zoom",
      "react",
      "typescript",
    ],
    revenue: "Q4 revenue was outstanding",
  },
  null,
  2,
);

const SAMPLE_XML = `<?xml version="1.0" encoding="UTF-8"?>
<library>
  <book id="1" category="fiction">
    <title>The Great Gatsby</title>
    <author>F. Scott Fitzgerald</author>
    <year>1925</year>
    <price currency="USD">12.99</price>
    <description>A novel about the American dream and the revenue of the 1920s.</description>
  </book>
  <book id="2" category="science">
    <title>A Brief History of Time</title>
    <author>Stephen Hawking</author>
    <year>1988</year>
    <price currency="USD">15.99</price>
    <description>An exploration of cosmology for general readers.</description>
  </book>
  <book id="3" category="programming">
    <title>Clean Code</title>
    <author>Robert C. Martin</author>
    <year>2008</year>
    <price currency="USD">33.99</price>
    <description>A handbook of agile software craftsmanship.</description>
  </book>
</library>`;

const SAMPLE_CSV = `Name,Department,Salary,City,Revenue Target
Alice Johnson,Engineering,120000,San Francisco,500000
Bob Smith,Marketing,95000,New York,350000
Carol Williams,Design,105000,London,280000
David Brown,Engineering,130000,Berlin,450000
Eve Davis,Sales,88000,Tokyo,600000
Frank Miller,Engineering,115000,San Francisco,420000
Grace Lee,Marketing,92000,New York,380000
Henry Wilson,Design,98000,London,310000
Ivy Chen,Sales,91000,Tokyo,550000
Jack Taylor,Engineering,125000,Berlin,470000`;

const SAMPLE_HTML = `<!DOCTYPE html>
<html>
<head><title>Sample HTML Document</title></head>
<body>
  <h1>Welcome to DocLens HTML Viewer</h1>
  <p>This is a <strong>sample HTML document</strong> rendered inside a Shadow DOM for security isolation.</p>
  <h2>Features</h2>
  <ul>
    <li>Safe rendering via Shadow DOM</li>
    <li>Script tags are sanitized</li>
    <li>Search and highlight works across the content</li>
    <li>Q4 revenue report shows growth</li>
  </ul>
  <h2>Table Example</h2>
  <table border="1" cellpadding="8" style="border-collapse:collapse;">
    <tr><th>Feature</th><th>Status</th></tr>
    <tr><td>PDF Rendering</td><td>Complete</td></tr>
    <tr><td>Search Highlight</td><td>Complete</td></tr>
    <tr><td>Zoom Controls</td><td>Complete</td></tr>
    <tr><td>Revenue Tracking</td><td>In Progress</td></tr>
  </table>
  <blockquote>DocLens: Universal document viewing for the modern web.</blockquote>
</body>
</html>`;

const SAMPLE_MARKDOWN = `# DocLens Markdown Viewer

## Overview

**DocLens** is a framework-agnostic universal document viewer library. It supports
rendering of _multiple file formats_ with unified search and highlight capabilities.

## Supported Formats

- PDF documents
- Excel spreadsheets (XLSX, XLS)
- CSV files
- PowerPoint presentations (PPTX)
- Word documents (DOCX)
- XML files
- JSON data
- HTML pages
- Markdown files
- Images, Video, Audio

## Code Example

\`\`\`typescript
import { DocViewer } from 'doclens';

function App() {
  return (
    <DocViewer
      document={{ uri: '/report.pdf' }}
      initialSearchTerms={['revenue', 'Q4']}
      theme="dark"
    />
  );
}
\`\`\`

## Revenue Report

The Q4 revenue exceeded expectations by **23%**, driven by strong demand
in the enterprise segment. Total annual revenue reached $4.2M.

> "DocLens has transformed how our team reviews documents." — Engineering Lead

| Metric | Q3 | Q4 | Growth |
|--------|----|----|--------|
| Revenue | $950K | $1.17M | +23% |
| Users | 12,400 | 18,600 | +50% |
| Documents | 1.2M | 2.1M | +75% |
`;

const SAMPLE_TEXT = `DocLens - Universal Document Viewer
====================================

This is a plain text file being rendered by the TextRenderer.
The search functionality works here too — try searching for "revenue" or "DocLens".

Features:
- Framework-agnostic core with React wrapper
- Unified search across all file types
- Keyboard navigation (Enter/Shift+Enter)
- Zoom controls with pinch-to-zoom
- Dark mode support
- Pre-search with auto-highlight and scroll

Revenue Report Summary:
Q4 revenue: $1.17M (+23% QoQ)
Annual revenue: $4.2M
Active users: 18,600

Technical Stack:
- TypeScript
- Vite (library mode)
- pdfjs-dist for PDF
- SheetJS for XLSX
- PapaParse for CSV
- Mammoth for DOCX
- Marked for Markdown

The library uses dynamic imports for all format-specific dependencies,
ensuring that consumers only pay for the formats they actually use.
`;

/* ------------------------------------------------------------------ */
/*  Create DocumentSources from inline data                            */
/* ------------------------------------------------------------------ */

function textToSource(
  text: string,
  fileName: string,
  mime: string,
): DocumentSource {
  const encoder = new TextEncoder();
  const data = encoder.encode(text);
  return {
    fileData: data.buffer as ArrayBuffer,
    fileName,
    fileType: mime,
  };
}

const SAMPLES: Record<string, DocumentSource> = {
  JSON: textToSource(SAMPLE_JSON, "sample.json", "application/json"),
  XML: textToSource(SAMPLE_XML, "library.xml", "text/xml"),
  CSV: textToSource(SAMPLE_CSV, "employees.csv", "text/csv"),
  HTML: textToSource(SAMPLE_HTML, "page.html", "text/html"),
  Markdown: textToSource(SAMPLE_MARKDOWN, "readme.md", "text/markdown"),
  "Plain Text": textToSource(SAMPLE_TEXT, "notes.txt", "text/plain"),
  PDF: {
    uri: "https://mozilla.github.io/pdf.js/web/compressed.tracemonkey-pldi-09.pdf",
    fileName: "tracemonkey.pdf",
    fileType: "application/pdf",
  },
};

/* ------------------------------------------------------------------ */
/*  Demo App                                                           */
/* ------------------------------------------------------------------ */

function App() {
  const [activeKey, setActiveKey] = useState("JSON");
  const [theme, setTheme] = useState<ThemePreset>("light");
  const [customDoc, setCustomDoc] = useState<DocumentSource | null>(null);

  const currentDoc = customDoc ?? SAMPLES[activeKey];

  const handleFileInput = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (!file) return;

      setCustomDoc({
        fileData: file,
        fileName: file.name,
        fileType: file.type,
      });
      setActiveKey("");
    },
    [],
  );

  const handleSampleClick = useCallback((key: string) => {
    setActiveKey(key);
    setCustomDoc(null);
  }, []);

  return (
    <div>
      <div className="controls">
        {Object.keys(SAMPLES).map((key) => (
          <button
            key={key}
            className={activeKey === key && !customDoc ? "active" : ""}
            onClick={() => handleSampleClick(key)}
          >
            {key}
          </button>
        ))}

        <label>
          Open file:
          <input type="file" onChange={handleFileInput} />
        </label>

        <div className="theme-toggle">
          <button
            className={theme === "light" ? "active" : ""}
            onClick={() => setTheme("light")}
          >
            Light
          </button>
          <button
            className={theme === "dark" ? "active" : ""}
            onClick={() => setTheme("dark")}
          >
            Dark
          </button>
        </div>
      </div>

      <div id="viewer-root" style={{ height: "calc(100vh - 130px)" }}>
        {currentDoc && (
          <DocViewer
            key={`${activeKey}-${customDoc?.fileName ?? ""}`}
            document={currentDoc}
            initialSearchTerms={["revenue", "DocLens"]}
            theme={theme}
            enableOCR
            onDocumentLoad={(meta) => console.log("Loaded:", meta)}
            onError={(err) => console.error("Error:", err)}
            onSearchChange={(q, r) =>
              console.log(`Search "${q}": ${r.length} results`)
            }
            onDrop={(files) => {
              const file = files[0];
              if (file) {
                setCustomDoc({
                  fileData: file,
                  fileName: file.name,
                  fileType: file.type,
                });
                setActiveKey("");
              }
            }}
          />
        )}
      </div>
    </div>
  );
}

const root = createRoot(document.getElementById("root")!);
root.render(<App />);
