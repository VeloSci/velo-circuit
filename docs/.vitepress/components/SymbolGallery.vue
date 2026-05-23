<script setup lang="ts">
import { ref, onMounted, watch } from 'vue';
import { useData } from 'vitepress';
import { ElementKind } from '../../../src/core/domain/circuit.js';

const { isDark } = useData();
const hostRef = ref<HTMLDivElement | null>(null);

const kinds = [
  ElementKind.Resistor,
  ElementKind.Capacitor,
  ElementKind.Inductor,
  ElementKind.Cpe,
  ElementKind.WarburgInfinite,
  ElementKind.WarburgShort,
  ElementKind.WarburgOpen,
  ElementKind.Gerischer,
  ElementKind.ParallelDiffusionWarburg,
  ElementKind.ColeCole,
  ElementKind.HavriliakNegami,
];

async function renderGallery() {
  if (!hostRef.value) return;
  const { buildSvgElementSymbol } = await import('../../../src/core/render-svg/symbols.js');
  const { getTheme } = await import('../../../src/core/render-svg/themes.js');
  const theme = getTheme(isDark.value ? 'dark' : 'light');

  hostRef.value.innerHTML = kinds.map(kind => {
    const inner = buildSvgElementSymbol(kind, theme);
    return `<figure class="symbol-card">
      <svg viewBox="0 0 80 40" width="120" height="60" aria-label="${kind}">${inner}</svg>
      <figcaption><code>${kind}</code></figcaption>
    </figure>`;
  }).join('');
}

onMounted(renderGallery);
watch(isDark, renderGallery);
</script>

<template>
  <div ref="hostRef" class="symbol-gallery" :class="{ dark: isDark }" />
</template>

<style scoped>
.symbol-gallery {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(130px, 1fr));
  gap: 12px;
  margin: 16px 0;
}
.symbol-gallery :deep(.symbol-card) {
  margin: 0;
  padding: 10px;
  border: 1px solid var(--vp-c-divider);
  border-radius: 8px;
  background: var(--vp-c-bg-soft);
  text-align: center;
}
.symbol-gallery :deep(figcaption) {
  margin-top: 6px;
  font-size: 12px;
  color: var(--vp-c-text-2);
}
</style>
