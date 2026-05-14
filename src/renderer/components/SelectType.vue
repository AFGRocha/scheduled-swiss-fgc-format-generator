<script setup lang="ts">
import { ref } from "vue";

defineProps({
  msg: String,
});

const emit = defineEmits<{
  "button-clicked": [button: string];
}>();

const count = ref(0);

const handleButtonClick = (button: string) => {
  emit("button-clicked", button);
};
</script>

<template>
  <h1>a</h1>
  <div class="button-container">
    <button @click="handleButtonClick('import-startgg')">Import from Start.gg</button>
    <button @click="handleButtonClick('manual')">Manual</button>
  </div>
</template>

<style scoped>
.button-container {
  display: flex;
  gap: 1rem;
  justify-content: center;
}
</style>
