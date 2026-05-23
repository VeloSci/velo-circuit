<script setup lang="ts">
import { ref, onMounted, onBeforeUnmount } from 'vue';
import { defaultMountHeight } from './playground-utils';

const props = defineProps<{ initialDsl?: string; showParams?: boolean }>();
const emit = defineEmits<{ (e: 'dslChange', dsl: string): void }>();

const containerRef = ref<HTMLDivElement | null>(null);
let editor: import('/src/adapters/svelte/index.js').SvelteEditorInstance | null = null;

onMounted(async () => {
  if (!containerRef.value) return;
  const { createSvelteCircuitEditor } = await import('/src/adapters/svelte/index.js');
  const inner = document.createElement('div');
  inner.style.height = '100%';
  containerRef.value.appendChild(inner);
  editor = createSvelteCircuitEditor(inner, {
    initialDsl: props.initialDsl,
    height: defaultMountHeight,
    width: containerRef.value.clientWidth || 900,
  });
  if (props.showParams) editor.setShowParams(true);
  inner.addEventListener('change', (e: Event) => {
    emit('dslChange', (e as CustomEvent<string>).detail);
  });
});

onBeforeUnmount(() => editor?.destroy());

defineExpose({
  setValue(dsl: string) { editor?.setValue(dsl); },
  centerView() { editor?.fitView(); },
  setShowParams(show: boolean) { editor?.setShowParams(show); },
  setStrict(strict: boolean) { editor?.setStrict(strict); },
});
</script>

<template>
  <div ref="containerRef" class="preview-container ce-editor"></div>
</template>

<style scoped>
.preview-container { width: 100%; height: 100%; min-height: 320px; }
</style>
