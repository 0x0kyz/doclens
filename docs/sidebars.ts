import type {SidebarsConfig} from '@docusaurus/plugin-content-docs';

const sidebars: SidebarsConfig = {
  docsSidebar: [
    'intro',
    'getting-started',
    {
      type: 'category',
      label: 'Guides',
      items: [
        'guides/document-sources',
        'guides/search-and-ocr',
        'guides/theming',
        'guides/custom-renderers',
        'guides/vanilla-js',
      ],
    },
    'api-reference',
  ],
};

export default sidebars;
