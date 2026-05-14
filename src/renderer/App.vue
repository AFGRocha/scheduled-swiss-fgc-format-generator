<script setup lang="ts">
import viteLogo from './assets/vite.svg';
import vueLogo from './assets/vue.svg';

import SelectType from './components/SelectType.vue'
import Manual from './components/Manual.vue';
import { ref } from 'vue';
window.electronAPI.sendMessage('Hello from App.vue!');

const showManual = ref(false);
const showImport = ref(false);

const handleButtonClick = (button: string) => {
  showManual.value = button === 'manual';
  showImport.value = button === 'import-startgg';
}
</script>

<template>
  <SelectType @button-clicked="handleButtonClick" />

  <div>
    <Manual v-if="showManual" />
  </div>
</template>

<style scoped>

</style>
