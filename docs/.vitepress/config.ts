import { defineConfig } from 'vitepress';
import { resolve } from 'path';

const base = '/velo-circuit/';

export default defineConfig({
  base,
  title: 'velo-circuit',
  description: 'Framework-agnostic SVG circuit editor based on the Boukamp DSL',
  head: [
    ['link', { rel: 'icon', type: 'image/svg+xml', href: `${base}favicon.svg` }],
    ['link', { rel: 'apple-touch-icon', href: `${base}favicon.svg` }],
  ],
  vite: {
    resolve: {
      alias: {
        '/src/core': resolve(__dirname, '../../src/core'),
        '/src/adapters': resolve(__dirname, '../../src/adapters'),
      },
    },
    optimizeDeps: {
      include: ['vue', 'react', 'react-dom'],
    },
  },
  themeConfig: {
    logo: '/favicon.svg',
    nav: [
      { text: 'Guide', link: '/guide/getting-started', activeMatch: '/guide/' },
      { text: 'Examples', link: '/examples/basic-circuit', activeMatch: '/examples/' },
      { text: 'API', link: '/api/core', activeMatch: '/api/' },
      { text: 'Adapters', link: '/adapters/', activeMatch: '/adapters/' },
      { text: 'Reference', link: '/reference/boukamp-syntax', activeMatch: '/reference/' },
      { text: 'Playground', link: '/playground/', activeMatch: '/playground/' },
    ],
    sidebar: {
      '/guide/': [
        { text: 'Guide', items: [
          { text: 'Getting Started', link: '/guide/getting-started' },
          { text: 'Static SVG Rendering', link: '/guide/static-rendering' },
          { text: 'Architecture', link: '/guide/architecture' },
          { text: 'Core Concepts', link: '/guide/core-concepts' },
          { text: 'Editor Presets', link: '/guide/editor-presets' },
          { text: 'Export and Download', link: '/guide/export-download' },
          { text: 'Boukamp DSL', link: '/guide/boukamp-dsl' },
          { text: 'Migration to v1.0', link: '/guide/migration-v1' },
          { text: 'Release and Publish', link: '/guide/release-and-publish' },
        ]},
      ],
      '/examples/': [
        { text: 'Examples', items: [
          { text: 'Basic Circuit', link: '/examples/basic-circuit' },
          { text: 'Randles Circuit', link: '/examples/randles-circuit' },
          { text: 'Warburg Elements', link: '/examples/warburg-elements' },
          { text: 'Gerischer', link: '/examples/gerischer' },
          { text: 'Cole-Cole & HN', link: '/examples/cole-cole-hn' },
          { text: 'PDW Diffusion', link: '/examples/pdw-diffusion' },
          { text: 'Nested Circuits', link: '/examples/nested-circuits' },
          { text: 'CPE and Complex', link: '/examples/cpe-and-complex' },
        ]},
      ],
      '/api/': [
        { text: 'API', items: [
          { text: 'Package Exports', link: '/api/exports' },
          { text: 'Core', link: '/api/core' },
          { text: 'Editor', link: '/api/editor' },
          { text: 'Plugins', link: '/api/plugins' },
          { text: 'Grid', link: '/api/grid' },
          { text: 'DSL Editor', link: '/api/dsl-editor' },
          { text: 'Parser', link: '/api/parser' },
          { text: 'Layout', link: '/api/layout' },
          { text: 'Render & Themes', link: '/api/render' },
        ]},
      ],
      '/adapters/': [
        { text: 'Adapters', items: [
          { text: 'Overview', link: '/adapters/' },
          { text: 'Vanilla JS', link: '/adapters/vanilla' },
          { text: 'React', link: '/adapters/react' },
          { text: 'Vue 3', link: '/adapters/vue' },
          { text: 'Angular', link: '/adapters/angular' },
          { text: 'Astro', link: '/adapters/astro' },
          { text: 'Svelte', link: '/adapters/svelte' },
        ]},
      ],
      '/reference/': [
        { text: 'Reference', items: [
          { text: 'Boukamp Syntax', link: '/reference/boukamp-syntax' },
          { text: 'Unified Circuit DSL', link: '/reference/unified-circuit-dsl' },
          { text: 'Element Types', link: '/reference/element-types' },
          { text: 'Symbol Design System', link: '/reference/symbol-design-system' },
        ]},
      ],
      '/playground/': [
        { text: 'Playground', items: [
          { text: 'Editor', link: '/playground/' },
          { text: 'Grid Catalog', link: '/playground/grid' },
        ]},
      ],
    },
    socialLinks: [
      { icon: 'github', link: 'https://github.com/jigonzalez930209/velo-circuit' },
    ],
    search: {
      provider: 'local',
      options: {
        detailedView: true,
      },
    },
  },
});
