<script setup lang="ts">
import { computed, ref, watch, onMounted } from 'vue';
import { useData } from 'vitepress';
import type { SymbolColorMode } from '../../../src/core/render-svg/themes.js';
import type { ConnectionStyle } from '../../../src/core/render-svg/renderer.js';

const props = withDefaults(defineProps<{
  /** Boukamp DSL string, e.g. `R0-p(R1,C1)` */
  dsl: string;
  /** `bicolor` uses theme stroke only; `multicolor` matches editor per-kind colors */
  colorMode?: SymbolColorMode;
  /** `curved` (default, editor-style) or `orthogonal` (right-angle wires) */
  wires?: ConnectionStyle;
  showParams?: boolean;
  /** Max width of the preview figure (SVG scales down inside) */
  maxWidth?: string;
  /** Optional caption under the diagram */
  caption?: string;
}>(), {
  colorMode: 'multicolor',
  wires: 'curved',
  showParams: false,
  maxWidth: '420px',
});

const { isDark } = useData();
const svgHtml = ref('');
const parseError = ref(false);

async function renderPreview() {
  const { renderDslPreviewSvg } = await import('../../../src/core/render-svg/renderer-ex.js');
  const themeMode = isDark.value ? 'dark' : 'light';
  const svg = renderDslPreviewSvg(props.dsl, {
    themeMode,
    colorMode: props.colorMode,
    connectionStyle: props.wires,
    showParams: props.showParams,
    width: '100%',
    height: 'auto',
  });
  parseError.value = !svg;
  svgHtml.value = svg;
}

onMounted(renderPreview);
watch([() => props.dsl, () => props.colorMode, () => props.wires, () => props.showParams, isDark], renderPreview);

const wrapperStyle = computed(() => ({ maxWidth: props.maxWidth }));
</script>

<template>
  <figure class="circuit-svg-preview" :class="{ dark: isDark }" :style="wrapperStyle">
    <div
      v-if="parseError"
      class="circuit-svg-preview__error"
    >
      Invalid DSL: <code>{{ dsl }}</code>
    </div>
    <div
      v-else-if="svgHtml"
      class="circuit-svg-preview__svg"
      v-html="svgHtml"
    />
    <figcaption v-if="caption" class="circuit-svg-preview__caption">{{ caption }}</figcaption>
  </figure>
</template>

<style scoped>
.circuit-svg-preview {
  margin: 0.75rem auto;
  padding: 0.5rem 0.625rem;
  border: 1px solid var(--vp-c-divider);
  border-radius: 8px;
  background: var(--vp-c-bg-soft);
  text-align: center;
}

.circuit-svg-preview__svg {
  display: flex;
  justify-content: center;
  align-items: center;
  overflow-x: auto;
  line-height: 0;
}

.circuit-svg-preview__svg :deep(svg) {
  display: block;
  width: 100%;
  max-width: 100%;
  height: auto;
}

.circuit-svg-preview__error {
  display: block;
  padding: 0.5rem;
  color: var(--vp-c-danger-1);
  font-size: 0.85rem;
}

.circuit-svg-preview__caption {
  margin-top: 0.375rem;
  font-size: 0.8rem;
  color: var(--vp-c-text-3);
  line-height: 1.4;
}
</style>
