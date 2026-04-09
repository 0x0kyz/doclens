---
sidebar_position: 3
title: Theming
---

# Theming

doclens ships with light and dark themes and supports full customization via CSS custom properties.

## Theme Presets

```tsx
<DocViewer theme="light" />
<DocViewer theme="dark" />
```

## CSS Custom Properties

Override any variable on the viewer's container or globally:

```css
.my-viewer {
  --dv-bg: #1a1a2e;
  --dv-text: #eee;
  --dv-primary: #e94560;
  --dv-highlight-color: #ffeb3b;
  --dv-toolbar-bg: #16213e;
}
```

## Theme Config Object

Combine a preset with variable overrides:

```tsx
<DocViewer
  theme={{
    preset: 'dark',
    variables: {
      '--dv-primary': '#e94560',
      '--dv-highlight-color': '#ffd700',
    },
  }}
/>
```

## Available Variables

| Variable | Description | Default (Light) |
|----------|-------------|-----------------|
| `--dv-bg` | Background color | `#ffffff` |
| `--dv-text` | Text color | `#1a1a1a` |
| `--dv-primary` | Primary accent | `#2563eb` |
| `--dv-toolbar-bg` | Toolbar background | `#f8f9fa` |
| `--dv-border` | Border color | `#e5e7eb` |
| `--dv-highlight-color` | Search highlight | `#ffeb3b` |
| `--dv-highlight-active-color` | Active match | `#ff9800` |
| `--dv-highlight-term-1` | First search term | `#ffeb3b` |
| `--dv-highlight-term-2` | Second search term | `#a5d6a7` |
| `--dv-highlight-term-3` | Third search term | `#90caf9` |
| `--dv-highlight-term-4` | Fourth search term | `#f48fb1` |
| `--dv-highlight-term-5` | Fifth search term | `#ce93d8` |
| `--dv-font-family` | Font family | `system-ui, sans-serif` |
| `--dv-font-size` | Base font size | `14px` |
| `--dv-border-radius` | Border radius | `6px` |

## Copy Protection

Disable text selection and/or printing:

```tsx
<DocViewer
  document={{ uri: '/confidential.pdf' }}
  disableSelection
  disablePrint
/>
```

## Header Configuration

Control which toolbar items are shown:

```tsx
<DocViewer
  document={{ uri: '/report.pdf' }}
  header={{
    show: true,
    fileName: true,
    search: true,
    zoom: true,
    pageNav: true,
    fullscreen: true,
    download: false,
    print: false,
  }}
/>
```

Hide the header entirely:

```tsx
<DocViewer header={false} />
```

## Custom Header Slots

Inject your own UI into the header:

```tsx
<DocViewer
  document={{ uri: '/report.pdf' }}
  renderHeaderLeft={() => <MyLogo />}
  renderHeaderRight={() => <ShareButton />}
/>
```
