export { DocViewerEngine } from './core/engine';
export type { EngineMode } from './core/engine';
export { SearchEngine } from './core/search/SearchEngine';
export { Highlighter } from './core/search/highlighter';
export { ZoomManager } from './core/zoom/ZoomManager';
export { resolveSource, extractFileName } from './core/source-resolver';
export { detectFileType } from './core/file-detection';
export { getRenderer, registerRenderer, registerRendererFactory } from './core/renderers/registry';
export { BaseRenderer } from './core/renderers/BaseRenderer';
export { recognizeImage, isOCRAvailable, terminateOCR } from './core/ocr/OCREngine';
export type { OCRResult, OCRWord } from './core/ocr/OCREngine';

export type {
  DocumentSource,
  FileType,
  SearchResult,
  SearchOptions,
  IRenderer,
  ISearchable,
  RendererContext,
  RendererConstructor,
  OutlineItem,
  ThemePreset,
  ThemeConfig,
  HeaderConfig,
  DocViewerOptions,
  DocumentMeta,
  DocViewerEvent,
  DocViewerEventMap,
} from './core/types';
