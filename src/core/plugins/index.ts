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

/** All plugins — full-featured editor */
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

/** Minimal plugins — just canvas interaction */
export function minimalPlugins(): EditorPlugin[] {
  return [
    themePlugin(),
    panZoomPlugin(),
    selectionPlugin(),
    keyboardPlugin(),
  ];
}
