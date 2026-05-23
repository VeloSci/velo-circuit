<script setup lang="ts">
import { ref, onMounted, onBeforeUnmount, watch } from 'vue';
import { useData } from 'vitepress';
import { gridCatalogRows } from '../theme/circuits/grid-catalog';

const props = withDefaults(defineProps<{
  title?: string;
  height?: string;
  strict?: boolean;
}>(), {
  title: 'Circuit Grid Catalog',
  height: 'calc(100dvh - var(--vp-nav-height, 64px) - 24px)',
  strict: false,
});

const { isDark } = useData();
const containerRef = ref<HTMLDivElement | null>(null);
const strictMode = ref(props.strict);
const rowCount = ref(gridCatalogRows.length);
let grid: import('../../../src/core/grid/circuit-grid.js').CircuitGridInstance | null = null;

async function mountGrid() {
  if (!containerRef.value) return;
  const { createCircuitGrid } = await import('../../../src/core/index.ts');
  const h = Math.max(420, containerRef.value.clientHeight || 520);

  grid?.destroy();
  grid = createCircuitGrid({
    height: h,
    rowHeight: 128,
    strict: strictMode.value,
    themeMode: isDark.value ? 'dark' : 'light',
    columns: [
      { id: 'label', label: 'Name', type: 'text', width: 120 },
      { id: 'dsl', label: 'Linear DSL', type: 'dsl', width: 340 },
      { id: 'svg', label: 'Circuit SVG', type: 'svg', width: 240 },
      { id: 'params', label: 'Parameters', type: 'params', width: 220 },
    ],
    initialRows: gridCatalogRows.map(r => ({ id: r.id, dsl: r.dsl, meta: { label: r.label } })),
  });

  grid.mount(containerRef.value);
  rowCount.value = grid.getRows().length;
}

watch(isDark, (dark) => {
  grid?.setThemeMode(dark ? 'dark' : 'light');
});

function addRow() {
  grid?.addRow({ id: `row-${Date.now()}`, dsl: 'R0{100}-C1{1e-5}', meta: { label: 'New row' } });
  rowCount.value = grid?.getRows().length ?? rowCount.value;
}

function toggleStrict() {
  strictMode.value = !strictMode.value;
  mountGrid();
}

onMounted(() => {
  mountGrid();
});

onBeforeUnmount(() => {
  grid?.destroy();
});
</script>

<template>
  <div class="grid-playground" :style="{ minHeight: height }">
    <div class="grid-playground-chrome">
      <div class="chrome-dots">
        <span class="chrome-dot chrome-dot--red"></span>
        <span class="chrome-dot chrome-dot--yellow"></span>
        <span class="chrome-dot chrome-dot--green"></span>
      </div>
      <div class="chrome-title">{{ title }}</div>
      <div class="chrome-actions">
        <button type="button" class="action-btn" :class="{ active: strictMode }" @click="toggleStrict">
          Strict {{ strictMode ? 'ON' : 'OFF' }}
        </button>
        <button type="button" class="action-btn" @click="addRow">+ Add row</button>
        <span class="row-count">{{ rowCount }} rows</span>
      </div>
    </div>

    <p class="grid-hint">
      SVG-first catalog: each row shows the Boukamp DSL string and its rendered circuit preview.
      Scroll to browse rows. Enable <strong>Strict</strong> to highlight invalid parameters (last row).
    </p>

    <div ref="containerRef" class="grid-mount"></div>
  </div>
</template>

<style scoped>
.grid-playground {
  display: flex;
  flex-direction: column;
  border: 1px solid var(--vp-c-divider);
  background: var(--vp-c-bg);
  overflow: hidden;
}

.grid-playground-chrome {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 10px 16px;
  background: var(--vp-c-bg-soft);
  border-bottom: 1px solid var(--vp-c-divider);
}

.chrome-dots { display: flex; gap: 6px; }
.chrome-dot { width: 12px; height: 12px; border-radius: 50%; }
.chrome-dot--red { background: #ff5f56; }
.chrome-dot--yellow { background: #ffbd2e; }
.chrome-dot--green { background: #27c93f; }

.chrome-title {
  flex: 1;
  font-size: 11px;
  font-weight: 700;
  color: var(--vp-c-text-2);
  text-transform: uppercase;
  letter-spacing: 0.1em;
}

.chrome-actions {
  display: flex;
  align-items: center;
  gap: 8px;
}

.action-btn {
  padding: 4px 10px;
  border: 1px solid var(--vp-c-divider);
  border-radius: 6px;
  background: var(--vp-c-bg);
  font-size: 12px;
  cursor: pointer;
}
.action-btn.active {
  background: var(--vp-c-brand-1);
  border-color: var(--vp-c-brand-1);
  color: #fff;
}

.row-count {
  font-size: 11px;
  color: var(--vp-c-text-2);
}

.grid-hint {
  margin: 0;
  padding: 10px 16px;
  font-size: 13px;
  color: var(--vp-c-text-2);
  border-bottom: 1px solid var(--vp-c-divider);
  background: var(--vp-c-bg-soft);
}

.grid-mount {
  flex: 1;
  height: 520px;
  min-height: 420px;
  background: var(--vp-c-bg);
}

.grid-mount :deep(.circuit-grid-host) {
  border-top: 1px solid var(--vp-c-divider);
}
</style>
