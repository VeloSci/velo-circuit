<script setup lang="ts">
import { ref, onMounted, onBeforeUnmount } from 'vue';
import { defaultMountHeight } from './playground-utils';

const props = defineProps<{
  initialDsl?: string;
  showParams?: boolean;
}>();

const emit = defineEmits<{
  (e: 'dslChange', dsl: string): void;
}>();

const containerRef = ref<HTMLDivElement | null>(null);
let editor: import('/src/adapters/react/index.js').ReactEditorInstance | null = null;

onMounted(async () => {
  if (!containerRef.value) return;

  const adapter = await import('/src/adapters/react/index.js');

  editor = adapter.createReactCircuitEditor(containerRef.value, {
    initialDsl: props.initialDsl,
    height: defaultMountHeight,
    width: containerRef.value.clientWidth || 900,
    onChange: (dsl) => emit('dslChange', dsl),
  });

  if (props.showParams) {
    editor.setShowParams(true);
  }
});

onBeforeUnmount(() => {
  editor?.destroy();
});

defineExpose({
  setValue(dsl: string) {
    editor?.setValue(dsl);
  },
  centerView() {
    editor?.fitView();
  },
  setShowParams(show: boolean) {
    editor?.setShowParams(show);
  },
  setStrict(strict: boolean) {
    editor?.setStrict(strict);
  },
});
</script>

<template>
  <div ref="containerRef" class="preview-container ce-editor"></div>
</template>

<style scoped>
.preview-container {
  width: 100%;
  height: 100%;
  min-height: 320px;
}
</style>
