export { type EditorPlugin, type PluginContext, type PluginFactory, PluginRegistry } from './types.js';
export { panZoomPlugin, type PanZoomPluginAPI } from './pan-zoom.plugin.js';
export { selectionPlugin } from './selection.plugin.js';
export { contextMenuPlugin } from './context-menu.plugin.js';
export { elementPickerPlugin } from './element-picker.plugin.js';
export { floatingToolbarPlugin } from './floating-toolbar.plugin.js';
export { paramEditPlugin } from './param-edit.plugin.js';
export { gridViewPlugin } from './grid-view.plugin.js';
export { keyboardPlugin } from './keyboard.plugin.js';
export { toolbarPlugin } from './toolbar.plugin.js';
export { dslPanelPlugin, diagnosticsPlugin, exportPanelPlugin } from './sidebar.plugin.js';
export { dslCodemirrorPanelPlugin } from './dsl-codemirror.plugin.js';
export { themePlugin, THEME_CSS } from './theme.plugin.js';

import type { EditorPlugin } from './types.js';
import { themePlugin } from './theme.plugin.js';
import { panZoomPlugin } from './pan-zoom.plugin.js';
import { selectionPlugin } from './selection.plugin.js';
import { contextMenuPlugin } from './context-menu.plugin.js';
import { elementPickerPlugin } from './element-picker.plugin.js';
import { floatingToolbarPlugin } from './floating-toolbar.plugin.js';
import { paramEditPlugin } from './param-edit.plugin.js';
import { gridViewPlugin } from './grid-view.plugin.js';
import { keyboardPlugin } from './keyboard.plugin.js';
import { toolbarPlugin } from './toolbar.plugin.js';
import { diagnosticsPlugin, exportPanelPlugin } from './sidebar.plugin.js';
import { dslCodemirrorPanelPlugin } from './dsl-codemirror.plugin.js';

/** All plugins — full-featured editor (extended preset) */
export function allPlugins(): EditorPlugin[] {
  return [
    themePlugin(),
    panZoomPlugin(),
    selectionPlugin(),
    elementPickerPlugin(),
    contextMenuPlugin(),
    floatingToolbarPlugin(),
    gridViewPlugin(),
    keyboardPlugin(),
    toolbarPlugin(),
    dslCodemirrorPanelPlugin(),
    diagnosticsPlugin(),
    exportPanelPlugin(),
  ];
}

/** Lite plugins — in-canvas editing without global toolbar or side panels */
export function litePlugins(): EditorPlugin[] {
  return [
    themePlugin(),
    panZoomPlugin(),
    selectionPlugin(),
    elementPickerPlugin(),
    contextMenuPlugin(),
    floatingToolbarPlugin(),
    keyboardPlugin(),
  ];
}

/** Minimal plugins — just canvas interaction (pan/zoom, selection) */
export function minimalPlugins(): EditorPlugin[] {
  return [
    themePlugin(),
    panZoomPlugin(),
    selectionPlugin(),
    keyboardPlugin(),
  ];
}

/** Preset names for adapter and app configuration */
export type EditorPreset = 'minimal' | 'lite' | 'extended';

/** Resolve a preset name to a plugin array (default: extended) */
export function resolvePlugins(preset: EditorPreset = 'extended'): EditorPlugin[] {
  switch (preset) {
    case 'minimal':
      return minimalPlugins();
    case 'lite':
      return litePlugins();
    case 'extended':
      return allPlugins();
  }
}
