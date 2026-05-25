<script setup lang="ts">
import { ref, computed, watch, onMounted, onUnmounted } from 'vue';
import { useData } from 'vitepress';
import type { CircuitExample } from '../theme/circuits';
import { renderDslPreviewSvg } from '../../../src/core/render-svg/renderer-ex.js';

const props = defineProps<{
  circuits: CircuitExample[];
  modelValue: string;
  disabled?: boolean;
}>();

const emit = defineEmits<{
  'update:modelValue': [id: string];
  select: [circuit: CircuitExample];
}>();

const { isDark } = useData();
const open = ref(false);
const rootRef = ref<HTMLElement | null>(null);
const svgCache = new Map<string, string>();

const activeCircuit = computed(() => {
  return props.circuits.find(c => c.id === props.modelValue) ?? props.circuits[0] ?? null;
});

function thumbSvg(dsl: string): string {
  if (!dsl) return '';
  const themeMode = isDark.value ? 'dark' : 'light';
  const key = `${themeMode}::${dsl}`;
  if (svgCache.has(key)) return svgCache.get(key)!;
  let svg = '';
  try {
    svg = renderDslPreviewSvg(dsl, { themeMode, colorMode: 'multicolor' });
    svg = svg.replace(/\s(?:width|height)="auto"/gi, '');
  } catch {
    svg = '';
  }
  svgCache.set(key, svg);
  return svg;
}

function toggle() {
  if (props.disabled) return;
  open.value = !open.value;
}

function pick(circuit: CircuitExample) {
  emit('update:modelValue', circuit.id);
  emit('select', circuit);
  open.value = false;
}

function onDocClick(e: MouseEvent) {
  if (!open.value || !rootRef.value) return;
  if (!rootRef.value.contains(e.target as Node)) open.value = false;
}

function onEscape(e: KeyboardEvent) {
  if (e.key === 'Escape') open.value = false;
}

watch(isDark, () => svgCache.clear());

onMounted(() => {
  document.addEventListener('click', onDocClick);
  document.addEventListener('keydown', onEscape);
});

onUnmounted(() => {
  document.removeEventListener('click', onDocClick);
  document.removeEventListener('keydown', onEscape);
});
</script>

<template>
  <div ref="rootRef" class="pg-circuit-picker" :class="{ open, disabled }">
    <button type="button" class="picker-trigger" :disabled="disabled" @click.stop="toggle">
      <span v-if="activeCircuit" class="trigger-inner">
        <span class="trigger-thumb" v-html="thumbSvg(activeCircuit.dsl)" />
        <span class="trigger-name">{{ activeCircuit.title }}</span>
      </span>
      <span v-else class="trigger-placeholder">Select circuit…</span>
      <span class="chevron" aria-hidden="true">▾</span>
    </button>
    <div v-show="open" class="picker-panel" role="listbox">
      <button
        v-for="circuit in circuits"
        :key="circuit.id"
        type="button"
        class="picker-option"
        :class="{ active: circuit.id === modelValue }"
        role="option"
        @click="pick(circuit)"
      >
        <span class="option-thumb" v-html="thumbSvg(circuit.dsl)" />
        <span class="option-text">
          <strong>{{ circuit.title }}</strong>
          <span v-if="circuit.description" class="option-desc">{{ circuit.description }}</span>
        </span>
      </button>
    </div>
  </div>
</template>

<style scoped>
.pg-circuit-picker {
  position: relative;
  flex: 1;
  min-width: 0;
  max-width: 420px;
}
.picker-trigger {
  width: 100%;
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 6px 10px;
  border: 1px solid var(--vp-c-divider);
  border-radius: 8px;
  background: var(--vp-c-bg);
  color: var(--vp-c-text-1);
  cursor: pointer;
  text-align: left;
  box-sizing: border-box;
}
.picker-trigger:hover:not(:disabled) {
  border-color: var(--vp-c-brand-1);
}
.picker-trigger:disabled {
  opacity: 0.55;
  cursor: not-allowed;
}
.trigger-inner {
  display: flex;
  align-items: center;
  gap: 10px;
  flex: 1;
  min-width: 0;
}
.trigger-thumb,
.option-thumb {
  flex-shrink: 0;
  width: 56px;
  height: 32px;
  display: flex;
  align-items: center;
  justify-content: center;
  overflow: hidden;
  border-radius: 4px;
  background: var(--vp-c-bg-soft);
  border: 1px solid var(--vp-c-divider);
}
.trigger-thumb :deep(svg),
.option-thumb :deep(svg) {
  max-width: 100%;
  max-height: 30px;
  width: auto;
  height: auto;
}
.trigger-name {
  font-size: 13px;
  font-weight: 600;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.trigger-placeholder {
  flex: 1;
  font-size: 13px;
  color: var(--vp-c-text-2);
}
.chevron {
  flex-shrink: 0;
  font-size: 11px;
  color: var(--vp-c-text-2);
}
.open .chevron {
  transform: rotate(180deg);
}
.picker-panel {
  position: absolute;
  z-index: 60;
  top: calc(100% + 4px);
  left: 0;
  width: min(100%, 380px);
  max-height: min(320px, 45vh);
  overflow-y: auto;
  border: 1px solid var(--vp-c-divider);
  border-radius: 8px;
  background: var(--vp-c-bg-soft);
  box-shadow: 0 12px 32px rgba(0, 0, 0, 0.2);
}
.picker-option {
  width: 100%;
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 8px 10px;
  border: none;
  border-bottom: 1px solid var(--vp-c-divider);
  background: transparent;
  color: var(--vp-c-text-1);
  cursor: pointer;
  text-align: left;
}
.picker-option:last-child {
  border-bottom: none;
}
.picker-option:hover,
.picker-option.active {
  background: var(--vp-c-bg);
}
.picker-option.active {
  outline: 1px solid var(--vp-c-brand-1);
  outline-offset: -1px;
}
.option-text {
  display: flex;
  flex-direction: column;
  gap: 2px;
  min-width: 0;
  flex: 1;
}
.option-text strong {
  font-size: 12px;
  font-weight: 600;
}
.option-desc {
  font-size: 10px;
  color: var(--vp-c-text-2);
  line-height: 1.3;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}
</style>
