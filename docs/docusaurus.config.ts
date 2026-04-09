import {themes as prismThemes} from 'prism-react-renderer';
import type {Config} from '@docusaurus/types';
import type * as Preset from '@docusaurus/preset-classic';

const config: Config = {
  title: 'doclens — Universal Document Viewer for the Web',
  tagline: 'One component to render PDFs, spreadsheets, presentations, and 10+ more formats. Full-text search with OCR, zoom, dark mode, and deep customization.',
  favicon: 'img/favicon.ico',

  url: 'https://amit641.github.io',
  baseUrl: '/doclens/',

  organizationName: 'amit641',
  projectName: 'doclens',

  onBrokenLinks: 'throw',

  headTags: [
    {
      tagName: 'meta',
      attributes: {
        name: 'description',
        content: 'doclens is a universal document viewer library for React and vanilla JavaScript. Render PDF, XLSX, CSV, PPTX, DOCX, XML, JSON, HTML, Markdown, images, video, audio, and text with unified search, OCR, zoom, and theming.',
      },
    },
    {
      tagName: 'meta',
      attributes: {
        name: 'keywords',
        content: 'doclens, document viewer, pdf viewer react, file viewer, xlsx viewer, csv viewer, react document viewer, typescript, search highlight, ocr, pdfnova, universal viewer',
      },
    },
    {
      tagName: 'meta',
      attributes: { property: 'og:title', content: 'doclens — Universal Document Viewer for the Web' },
    },
    {
      tagName: 'meta',
      attributes: { property: 'og:description', content: 'One component to render PDFs, spreadsheets, presentations, and 10+ more formats with search, OCR, zoom, and dark mode.' },
    },
    {
      tagName: 'meta',
      attributes: { property: 'og:type', content: 'website' },
    },
  ],

  i18n: {
    defaultLocale: 'en',
    locales: ['en'],
  },

  presets: [
    [
      'classic',
      {
        docs: {
          sidebarPath: './sidebars.ts',
          routeBasePath: '/',
          editUrl: 'https://github.com/amit641/doclens/tree/main/docs/',
        },
        blog: false,
        sitemap: {
          lastmod: 'date',
          changefreq: 'weekly',
          priority: 0.5,
        },
        theme: {
          customCss: './src/css/custom.css',
        },
      } satisfies Preset.Options,
    ],
  ],

  themeConfig: {
    colorMode: {
      respectPrefersColorScheme: true,
    },
    navbar: {
      title: 'doclens',
      items: [
        {
          type: 'docSidebar',
          sidebarId: 'docsSidebar',
          position: 'left',
          label: 'Docs',
        },
        {
          href: 'https://www.npmjs.com/package/doclens',
          label: 'npm',
          position: 'right',
        },
        {
          href: 'https://github.com/amit641/doclens',
          label: 'GitHub',
          position: 'right',
        },
      ],
    },
    footer: {
      style: 'dark',
      links: [
        {
          title: 'Docs',
          items: [
            { label: 'Getting Started', to: '/getting-started' },
            { label: 'Search & OCR', to: '/guides/search-and-ocr' },
            { label: 'Theming', to: '/guides/theming' },
            { label: 'Custom Renderers', to: '/guides/custom-renderers' },
          ],
        },
        {
          title: 'Links',
          items: [
            { label: 'GitHub', href: 'https://github.com/amit641/doclens' },
            { label: 'npm', href: 'https://www.npmjs.com/package/doclens' },
          ],
        },
      ],
      copyright: `Copyright © ${new Date().getFullYear()} doclens. Built with Docusaurus.`,
    },
    prism: {
      theme: prismThemes.github,
      darkTheme: prismThemes.dracula,
      additionalLanguages: ['bash', 'json', 'css'],
    },
  } satisfies Preset.ThemeConfig,
};

export default config;
