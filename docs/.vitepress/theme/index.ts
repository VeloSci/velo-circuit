import DefaultTheme from 'vitepress/theme';
import type { Theme } from 'vitepress';
import CircuitPlayground from '../components/CircuitPlayground.vue';
import GridPlayground from '../components/GridPlayground.vue';
import './style.css';

export default {
  extends: DefaultTheme,
  enhanceApp({ app }) {
    app.component('CircuitPlayground', CircuitPlayground);
    app.component('GridPlayground', GridPlayground);
  },
} satisfies Theme;
