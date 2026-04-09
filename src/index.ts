// React exports (default entry point)
export { DocViewer } from './react/DocViewer';
export type { DocViewerProps } from './react/DocViewer';

export { DocViewerContext, useDocViewerContext } from './react/context/DocViewerContext';
export type { DocViewerState, DocViewerActions, DocViewerContextValue } from './react/context/DocViewerContext';

export { useDocViewer } from './react/hooks/useDocViewer';
export { useSearch } from './react/hooks/useSearch';
export { useZoom } from './react/hooks/useZoom';

export { Header } from './react/components/Header';
export { SearchBar } from './react/components/SearchBar';
export { ZoomControls } from './react/components/ZoomControls';
export { DocumentTabs } from './react/components/DocumentTabs';

// Re-export core types for convenience
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

// Re-export core engine for advanced usage
export { DocViewerEngine } from './core/engine';
export type { EngineMode } from './core/engine';
export { registerRenderer, registerRendererFactory } from './core/renderers/registry';
export { BaseRenderer } from './core/renderers/BaseRenderer';
