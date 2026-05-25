<script setup lang="ts">
import { ref, computed, watch, onMounted } from 'vue';
import { useData } from 'vitepress';
import type { CircuitExample } from '../theme/circuits';
import { allPlaygroundCircuits } from '../theme/circuits';
import VanillaPreview from './VanillaPreview.vue';
import ReactPreview from './ReactPreview.vue';
import VuePreview from './VuePreview.vue';
import SveltePreview from './SveltePreview.vue';
import AngularPreview from './AngularPreview.vue';
import AstroPreview from './AstroPreview.vue';
import PlaygroundCircuitPicker from './PlaygroundCircuitPicker.vue';

const props = withDefaults(defineProps<{
  circuits?: CircuitExample[];
  initialCircuit?: string;
  title?: string;
  height?: string;
}>(), {
  title: 'Circuit Playground',
  height: 'calc(100dvh - var(--vp-nav-height, 64px) - 24px)',
});

const { isDark } = useData();
const circuitsList = computed(() => props.circuits || allPlaygroundCircuits);

function circuitById(id: string) {
  return circuitsList.value.find(c => c.id === id) ?? circuitsList.value[0];
}

const activeCircuit = ref(props.initialCircuit || 'randles');
const dslInput = ref(circuitById(activeCircuit.value)?.dsl ?? '');
const diagnosticsOutput = ref<{ type: string; message: string }[]>([]);
const activeTab = ref('preview');
const framework = ref('react');
const activePreviewRef = ref<any>(null);
const showParams = ref(false);
const strictMode = ref(false);
const mountPointRef = ref<HTMLElement | null>(null);

// Map tabs to preview components
const previewComponents: Record<string, any> = {
  preview: VanillaPreview,
  vanilla: VanillaPreview,
  react: ReactPreview,
  vue: VuePreview,
  svelte: SveltePreview,
  angular: AngularPreview,
  astro: AstroPreview,
};

const currentPreview = computed(() => previewComponents[activeTab.value] || VanillaPreview);

const frameworkCode = {
  react: `import React, { useState } from 'react';
import { useCircuitEditor } from 'velo-circuit/react';

export default function CircuitPlayground() {
  const [dsl, setDsl] = useState('${dslInput.value}');
  const { containerRef } = useCircuitEditor({ value: dsl, onChange: setDsl });
  return <div ref={containerRef} style={{ height: '500px' }} />;
}`,
  vue: `<template>
  <div ref="containerRef" style="height: 500px"></div>
</template>
<script setup>
import { ref } from 'vue';
import { useCircuitEditor } from 'velo-circuit/vue';
const dsl = ref('${dslInput.value}');
const { containerRef } = useCircuitEditor({ value: dsl });
<\/script>`,
  svelte: `<script lang="ts">
  import { circuitEditor } from 'velo-circuit/svelte';
  let dsl = '${dslInput.value}';
<\/script>
<div use:circuitEditor={{ value: dsl }} style="height: 500px"></div>`,
  angular: `@Component({
  selector: 'circuit-editor',
  template: \`<div #container style="width:100%;height:100%;"></div>\`,
})
export class CircuitEditorComponent implements AfterViewInit {
  @Input() initialDsl = '${dslInput.value}';
  private editor = createEditor();

  ngAfterViewInit() {
    this.editor.mount(this.container.nativeElement, {
      initialDsl: this.initialDsl
    });
  }
}`,
  astro: `<div id="editor" style="height: 500px"></div>
<script>
  import { mountAstroCircuitEditor } from 'velo-circuit/astro';

  const editor = mountAstroCircuitEditor(
    document.getElementById('editor'),
    { initialDsl: '${dslInput.value}' }
  );
<\/script>`
};

// Core module loaded once
let coreModule: any = null;

async function loadCore() {
  if (!coreModule) {
    coreModule = await import('../../../src/core/index.ts');
  }
  return coreModule;
}

function toggleShowParams() {
  showParams.value = !showParams.value;
  activePreviewRef.value?.setShowParams?.(showParams.value);
}

function toggleStrict() {
  strictMode.value = !strictMode.value;
  activePreviewRef.value?.setStrict?.(strictMode.value);
  updateDiagnostics();
}

async function updateDiagnostics() {
  const core = await loadCore();
  const { validate, parseBoukamp } = core;

  const result = parseBoukamp(dslInput.value);
  if (result && typeof result === 'object' && 'type' in result && (result.type === 'lex' || result.type === 'parse')) {
    diagnosticsOutput.value = [{ type: 'error', message: result.message }];
    return;
  }

  const validation = validate(result, { strict: strictMode.value });
  diagnosticsOutput.value = validation.issues.map((i: any) => ({
    type: i.type,
    message: i.message,
  }));
}

function centerView() {
  activePreviewRef.value?.centerView();
}

watch(isDark, (val) => {
  if (typeof document === 'undefined') {
    return;
  }
  const editors = document.querySelectorAll('.ce-editor');
  editors.forEach(el => {
    if (val) el.classList.add('ce-dark');
    else el.classList.remove('ce-dark');
  });
}, { immediate: true });

function selectCircuit(circuit: CircuitExample) {
  activeCircuit.value = circuit.id;
  dslInput.value = circuit.dsl;
  showParams.value = true;
  activePreviewRef.value?.setValue(circuit.dsl);
  activePreviewRef.value?.setShowParams?.(true);
  activePreviewRef.value?.setStrict?.(strictMode.value);
  void updateDiagnostics();
  requestAnimationFrame(() => activePreviewRef.value?.centerView?.());
}

function onCircuitPickerSelect(circuit: CircuitExample) {
  selectCircuit(circuit);
}

function onPreviewDslChange(newDsl: string) {
  dslInput.value = newDsl;
  updateDiagnostics();
}

onMounted(async () => {
  await updateDiagnostics();
});
</script>

<template>
  <div class="playground-wrapper" :style="{ height }">
    <div class="playground-chrome">
      <div class="chrome-dots">
        <span class="chrome-dot chrome-dot--red"></span>
        <span class="chrome-dot chrome-dot--yellow"></span>
        <span class="chrome-dot chrome-dot--green"></span>
      </div>
      <div class="chrome-title">{{ title }}</div>
    </div>

    <div class="framework-tabs">
      <button :class="['tab-btn', { active: activeTab === 'preview' }]" @click="activeTab = 'preview'">Live Preview</button>
      <button :class="['tab-btn', { active: activeTab === 'react' }]" @click="activeTab = 'react'">React</button>
      <button :class="['tab-btn', { active: activeTab === 'vue' }]" @click="activeTab = 'vue'">Vue</button>
      <button :class="['tab-btn', { active: activeTab === 'svelte' }]" @click="activeTab = 'svelte'">Svelte</button>
      <button :class="['tab-btn', { active: activeTab === 'angular' }]" @click="activeTab = 'angular'">Angular</button>
      <button :class="['tab-btn', { active: activeTab === 'astro' }]" @click="activeTab = 'astro'">Astro</button>
      <button :class="['tab-btn', { active: activeTab === 'code' }]" @click="activeTab = 'code'">Code Example</button>
    </div>

    <div class="playground-main">
      <div v-show="activeTab === 'code'" class="code-view">
         <div class="code-tabs">
            <button v-for="fw in ['react', 'vue', 'svelte', 'angular', 'astro']" :key="fw" :class="['code-tab-btn', { active: framework === fw }]" @click="framework = fw">{{ fw }}</button>
         </div>
         <pre><code>{{ frameworkCode[framework as keyof typeof frameworkCode] }}</code></pre>
      </div>

      <div v-show="activeTab !== 'code'" class="playground-canvas">
        <div class="workbench-bar">
          <PlaygroundCircuitPicker
            v-model="activeCircuit"
            :circuits="circuitsList"
            @select="onCircuitPickerSelect"
          />
          <div class="workbench-actions">
            <button type="button" class="mode-btn" title="Fit view" @click="centerView">🎯 Fit</button>
            <button type="button" class="mode-btn" :class="{ active: showParams }" @click="toggleShowParams">Params</button>
            <button type="button" class="mode-btn" :class="{ active: strictMode }" @click="toggleStrict">Strict</button>
          </div>
        </div>

        <div ref="mountPointRef" class="framework-mount-point">
          <component
            :is="currentPreview"
            ref="activePreviewRef"
            :initial-dsl="dslInput"
            :show-params="showParams"
            @dsl-change="onPreviewDslChange"
          />
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.playground-wrapper {
  margin: 0;
  border-radius: 0px;
  overflow: hidden;
  border: 1px solid var(--vp-c-divider);
  background: var(--vp-c-bg);
  box-shadow: 0 10px 30px rgba(0,0,0,0.1);
  display: flex;
  flex-direction: column;
  min-height: 0;
}

.workbench-bar {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 8px 12px;
  background: var(--vp-c-bg-soft);
  border-bottom: 1px solid var(--vp-c-divider);
  flex-shrink: 0;
}
.workbench-actions {
  display: flex;
  align-items: center;
  gap: 6px;
  margin-left: auto;
  flex-shrink: 0;
}
.mode-btn {
  padding: 6px 12px;
  border: 1px solid var(--vp-c-divider);
  background: var(--vp-c-bg);
  cursor: pointer;
  font-size: 12px;
  font-weight: 600;
  color: var(--vp-c-text-1);
  border-radius: 6px;
  transition: border-color 0.15s, background 0.15s;
}
.mode-btn:hover {
  border-color: var(--vp-c-brand-1);
}
.mode-btn.active {
  background: var(--vp-c-brand-1);
  border-color: var(--vp-c-brand-1);
  color: #fff;
}

.playground-chrome {
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

.framework-tabs {
  display: flex;
  gap: 4px;
  padding: 8px 16px;
  background: var(--vp-c-bg-soft);
  border-bottom: 1px solid var(--vp-c-divider);
}

.tab-btn {
  padding: 6px 14px;
  border-radius: 6px;
  font-size: 13px;
  font-weight: 600;
  color: var(--vp-c-text-2);
  transition: all 0.2s;
  border: 1px solid transparent;
  cursor: pointer;
  background: transparent;
}
.tab-btn:hover { color: var(--vp-c-text-1); background: var(--vp-c-bg-mute); }
.tab-btn.active { background: var(--vp-c-bg); color: var(--vp-c-brand-1); box-shadow: 0 2px 5px rgba(0,0,0,0.05); }

.playground-main {
  position: relative;
  display: flex;
  flex-direction: column;
  flex: 1;
  min-height: 0;
}

.playground-canvas {
  display: flex;
  flex-direction: column;
  flex: 1;
  min-height: 0;
  width: 100%;
}

.framework-mount-point {
  width: 100%;
  background: #f0f2f5;
  flex: 1;
  min-height: 0;
  position: relative;
}
.dark .framework-mount-point { background: #0f172a; }

.framework-mount-point :deep(svg.circuit-editor-root),
.framework-mount-point :deep(.ce-editor) {
  height: 100%;
}

.code-view {
  padding: 16px;
  background: #1e1e1e;
  color: #d4d4d4;
  font-family: monospace;
  font-size: 13px;
  min-height: 400px;
}

.code-tabs {
  display: flex;
  gap: 8px;
  margin-bottom: 16px;
}
.code-tab-btn {
  padding: 4px 8px;
  border: 1px solid #444;
  border-radius: 4px;
  background: #333;
  color: #ccc;
  cursor: pointer;
}
.code-tab-btn:hover { background: #444; }
.code-tab-btn.active { background: #555; color: white; }

:deep(.ce-editor) {
  height: 100% !important;
}
</style>