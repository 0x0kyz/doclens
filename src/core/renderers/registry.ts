import type { FileType, IRenderer, RendererConstructor } from '../types';

type RendererFactory = () => Promise<IRenderer>;

const builtinFactories: Partial<Record<FileType, RendererFactory>> = {
  text: async () => {
    const { TextRenderer } = await import('./TextRenderer');
    return new TextRenderer();
  },
  json: async () => {
    const { JSONRenderer } = await import('./JSONRenderer');
    return new JSONRenderer();
  },
  xml: async () => {
    const { XMLRenderer } = await import('./XMLRenderer');
    return new XMLRenderer();
  },
  csv: async () => {
    const { SpreadsheetRenderer } = await import('./SpreadsheetRenderer');
    return new SpreadsheetRenderer();
  },
  xlsx: async () => {
    const { SpreadsheetRenderer } = await import('./SpreadsheetRenderer');
    return new SpreadsheetRenderer();
  },
  xls: async () => {
    const { SpreadsheetRenderer } = await import('./SpreadsheetRenderer');
    return new SpreadsheetRenderer();
  },
  pdf: async () => {
    const { PDFRenderer } = await import('./PDFRenderer');
    return new PDFRenderer();
  },
  html: async () => {
    const { HTMLRenderer } = await import('./HTMLRenderer');
    return new HTMLRenderer();
  },
  docx: async () => {
    const { DocxRenderer } = await import('./DocxRenderer');
    return new DocxRenderer();
  },
  pptx: async () => {
    const { PresentationRenderer } = await import('./PresentationRenderer');
    return new PresentationRenderer();
  },
  image: async () => {
    const { ImageRenderer } = await import('./ImageRenderer');
    return new ImageRenderer();
  },
  markdown: async () => {
    const { MarkdownRenderer } = await import('./MarkdownRenderer');
    return new MarkdownRenderer();
  },
  video: async () => {
    const { VideoRenderer } = await import('./VideoRenderer');
    return new VideoRenderer();
  },
  audio: async () => {
    const { AudioRenderer } = await import('./AudioRenderer');
    return new AudioRenderer();
  },
};

const customRenderers = new Map<string, RendererFactory>();

export async function getRenderer(fileType: FileType): Promise<IRenderer> {
  const custom = customRenderers.get(fileType);
  if (custom) return custom();

  const factory = builtinFactories[fileType];
  if (factory) return factory();

  // Fallback to text renderer
  const { TextRenderer } = await import('./TextRenderer');
  return new TextRenderer();
}

export function registerRenderer(
  fileType: string,
  Ctor: RendererConstructor,
): void {
  customRenderers.set(fileType, async () => new Ctor());
}

export function registerRendererFactory(
  fileType: string,
  factory: RendererFactory,
): void {
  customRenderers.set(fileType, factory);
}
