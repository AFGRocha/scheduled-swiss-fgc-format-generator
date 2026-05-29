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
  <h1>Scheduled Swiss FGC Format Generator</h1>
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
  padding: 48px 24px;
}

button {
  padding: 12px 24px;
  background-color: #505050;
  color: rgba(255, 255, 255, 0.87);
  border: 1px solid #606060;
  border-radius: 4px;
  font-size: 16px;
  cursor: pointer;
  transition: background-color 0.2s, border-color 0.2s;
  font-weight: 500;
}

button:hover {
  background-color: #5a5a5a;
  border-color: #7a7a7a;
}
</style>
