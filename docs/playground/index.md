---
layout: page
title: Circuit Playground
outline: false
pageClass: full-width-page
---

<CircuitPlayground 
  title="Interactive Circuit Editor"
  initial-circuit="param-randles"
  height="calc(100dvh - var(--vp-nav-height, 64px) - 24px)"
/>

This playground uses the **extended** editor preset (global toolbar, DSL panel, grid view). For embed-only canvas, use `preset: 'lite'` in your app — see [Editor Presets](/guide/editor-presets).