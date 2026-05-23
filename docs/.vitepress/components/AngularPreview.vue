<script setup lang="ts">
import { ref, onMounted, onBeforeUnmount } from 'vue';
import { defaultMountHeight } from './playground-utils';

const props = defineProps<{ initialDsl?: string; showParams?: boolean }>();
const emit = defineEmits<{ (e: 'dslChange', dsl: string): void }>();

const containerRef = ref<HTMLDivElement | null>(null);
let componentInstance: {
  setValue(d: string): void;
  destroy(): void;
  fitView(): void;
  setShowParams(show: boolean): void;
  setStrict(strict: boolean): void;
  dslChange?: { emit: (dsl: string) => void };
} | null = null;

onMounted(async () => {
  if (!containerRef.value) return;
  const { createAngularCircuitEditorAdapter } = await import('/src/adapters/angular/index.js');
  const adapter = createAngularCircuitEditorAdapter();
  componentInstance = adapter.createComponent(containerRef.value, {
    initialDsl: props.initialDsl,
    height: defaultMountHeight,
    width: containerRef.value.clientWidth || 900,
  });
  if (props.showParams) componentInstance.setShowParams(true);
  const originalEmit = componentInstance.dslChange?.emit;
  if (originalEmit) {
    componentInstance.dslChange.emit = (dsl: string) => {
      emit('dslChange', dsl);
      originalEmit(dsl);
    };
  }
});

onBeforeUnmount(() => componentInstance?.destroy());

defineExpose({
  setValue(dsl: string) { componentInstance?.setValue(dsl); },
  centerView() { componentInstance?.fitView(); },
  setShowParams(show: boolean) { componentInstance?.setShowParams(show); },
  setStrict(strict: boolean) { componentInstance?.setStrict(strict); },
});
</script>

<template>
  <div ref="containerRef" class="preview-container ce-editor"></div>
</template>

<style scoped>
.preview-container { width: 100%; height: 100%; min-height: 320px; }
</style>
