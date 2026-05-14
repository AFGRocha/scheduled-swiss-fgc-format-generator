<script setup lang="ts">
import { ref } from "vue";
import { simulateDraw, Player, Pot } from "../utils/drawUtils";


const pots = ref<Pot[]>([[]]);
const playerInputs = ref<{ [potIndex: number]: string }>({});
const editingPlayerId = ref<{ [potIndex: number]: string | null }>({});
const editingPlayerName = ref<{ [potIndex: number]: string }>({});
const schedule = ref<any[]>([]);
const showResults = ref(false);

const addPot = () => {
  pots.value.push([]);
};

const removePot = (potIndex: number) => {
  pots.value = pots.value.filter((_, index) => index !== potIndex);
};

const addPlayer = (potIndex: number) => {
  const input = playerInputs.value[potIndex];
  if (input && input.trim()) {
    const pot = pots.value[potIndex];
    if (pot) {
      // Generate globally unique ID across all pots
      const allPlayerIds = pots.value.flatMap(p => p.map(pl => pl.id));
      const existingIds = allPlayerIds.filter(id => !isNaN(Number(id)));
      const newPlayerId = Math.max(...existingIds.map(Number), 0) + 1;
      pot.push({ 
        id: newPlayerId.toString(), 
        name: input.trim(), 
        potId: potIndex.toString() 
      });
      playerInputs.value[potIndex] = "";
    }
  }
};

const removePlayer = (potIndex: number, playerId: string) => {
  const pot = pots.value[potIndex];
  if (pot) {
    pots.value[potIndex] = pot.filter(p => p.id !== playerId);
  }
};

const startEditPlayer = (potIndex: number, playerId: string, playerName: string) => {
  editingPlayerId.value[potIndex] = playerId;
  editingPlayerName.value[potIndex] = playerName;
};

const saveEditPlayer = (potIndex: number, playerId: string) => {
  const pot = pots.value[potIndex];
  if (pot) {
    const player = pot.find(p => p.id === playerId);
    if (player && editingPlayerName.value[potIndex]?.trim()) {
      player.name = editingPlayerName.value[potIndex].trim();
    }
  }
  editingPlayerId.value[potIndex] = null;
  editingPlayerName.value[potIndex] = "";
};

const cancelEditPlayer = (potIndex: number) => {
  editingPlayerId.value[potIndex] = null;
  editingPlayerName.value[potIndex] = "";
};

const generateDraw = () => {
  try {
    // Convert pots array to the format expected by simulateDraw
    const potsRecord: Record<string, Pot> = {};
    pots.value.forEach((pot, index) => {
      potsRecord[`Pot-${index + 1}`] = pot;
    });
    
    const matches = simulateDraw(potsRecord);
    schedule.value = matches.map((match, idx) => ({
      id: idx,
      player1: match.player1,
      player2: match.player2
    }));
    showResults.value = true;
  } catch (error) {
    console.error("Error generating draw:", error);
    alert("Error generating draw. " + error );
  }
};
</script>

<template>
  <div class="container">
    <div v-for="(pot, potIndex) in pots" :key="potIndex" class="card">
      <div class="card-header">
        <h3>Pot {{ potIndex + 1 }}</h3>
        <button @click="removePot(potIndex)" class="remove-button">×</button>
      </div>
      
      <div class="input-group">
        <input
          v-model="playerInputs[potIndex]"
          type="text"
          placeholder="Add player..."
          @keyup.enter="addPlayer(potIndex)"
        />
        <button @click="addPlayer(potIndex)" class="add-player-button">Add</button>
      </div>

      <ul class="player-list">
        <li v-for="player in pot" :key="player.id" class="player-item">
          <div v-if="editingPlayerId[potIndex] === player.id" class="edit-mode">
            <input v-model="editingPlayerName[potIndex]" type="text" class="edit-input" />
            <button @click="saveEditPlayer(potIndex, player.id)" class="save-button">Save</button>
            <button @click="cancelEditPlayer(potIndex)" class="cancel-button">Cancel</button>
          </div>
          <div v-else class="view-mode">
            <span class="player-name">{{ player.name }}</span>
            <div class="action-buttons">
              <button @click="startEditPlayer(potIndex, player.id, player.name)" class="edit-button">Edit</button>
              <button @click="removePlayer(potIndex, player.id)" class="delete-button">Delete</button>
            </div>
          </div>
        </li>
      </ul>
    </div>
    <button @click="addPot" class="add-button">Add Pot</button>
  </div>
  <div>
    <button @click="generateDraw" class="generate-button">Generate Draw</button>
  </div>

  <div v-if="showResults" class="results-container">
    <h2>Generated Matchups</h2>
    <div class="schedule-list">
      <div v-for="match in schedule" :key="match.id" class="schedule-match">
        <span class="player-name">{{ match.player1.name }}</span>
        <span class="vs">vs</span>
        <span class="player-name">{{ match.player2.name }}</span>
      </div>
    </div>
  </div>
</template>

<style scoped>
.container {
  display: flex;
  flex-direction: row;
  flex-wrap: wrap;
  gap: 16px;
  margin: 0 auto;
  padding: 24px 0;
}

.card {
  border: 1px solid #404040;
  border-radius: 8px;
  padding: 16px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.3);
  flex: 1 1 300px;
  min-width: 300px;
  background-color: #1a1a1a;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;
}

.card-header h3 {
  margin: 0;
  color: rgba(255, 255, 255, 0.87);
}

.remove-button {
  background-color: #5a3a3a;
  color: rgba(255, 255, 255, 0.87);
  border: 1px solid #8a5a5a;
  border-radius: 4px;
  width: 28px;
  height: 28px;
  font-size: 18px;
  cursor: pointer;
  transition: background-color 0.2s, border-color 0.2s;
  padding: 0;
  display: flex;
  align-items: center;
  justify-content: center;
}

.remove-button:hover {
  background-color: #6a4a4a;
  border-color: #a07070;
}

.input-group {
  display: flex;
  gap: 8px;
  margin-bottom: 16px;
}

.input-group input {
  flex: 1;
  padding: 8px;
  border: 1px solid #404040;
  border-radius: 4px;
  font-size: 14px;
  background-color: #242424;
  color: rgba(255, 255, 255, 0.87);
}

.input-group input:focus {
  outline: none;
  border-color: #0066cc;
  box-shadow: 0 0 0 3px rgba(0, 102, 204, 0.2);
}

.add-player-button {
  padding: 8px 12px;
  background-color: #505050;
  color: rgba(255, 255, 255, 0.87);
  border: 1px solid #606060;
  border-radius: 4px;
  font-size: 14px;
  cursor: pointer;
  transition: background-color 0.2s, border-color 0.2s;
}

.add-player-button:hover {
  background-color: #5a5a5a;
  border-color: #7a7a7a;
}

.player-list {
  list-style: none;
  padding: 0;
  margin: 0;
}

.player-item {
  border: 1px solid #404040;
  border-radius: 4px;
  padding: 12px;
  margin-bottom: 8px;
  background-color: #1a1a1a;
}

.view-mode {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.player-name {
  font-size: 14px;
  word-break: break-word;
  color: rgba(255, 255, 255, 0.87);
}

.action-buttons {
  display: flex;
  gap: 8px;
}

.edit-button,
.delete-button {
  padding: 4px 8px;
  font-size: 12px;
  border-radius: 4px;
  cursor: pointer;
  transition: background-color 0.2s;
}

.edit-button {
  background-color: #505050;
  color: rgba(255, 255, 255, 0.87);
  border: 1px solid #606060;
}

.edit-button:hover {
  background-color: #5a5a5a;
  border-color: #7a7a7a;
}

.delete-button {
  background-color: #5a3a3a;
  color: rgba(255, 255, 255, 0.87);
  border: 1px solid #8a5a5a;
}

.delete-button:hover {
  background-color: #6a4a4a;
  border-color: #a07070;
}

.edit-mode {
  display: flex;
  gap: 8px;
  width: 100%;
}

.edit-input {
  flex: 1;
  padding: 6px;
  border: 1px solid #404040;
  border-radius: 4px;
  font-size: 14px;
  background-color: #242424;
  color: rgba(255, 255, 255, 0.87);
}

.edit-input:focus {
  outline: none;
  border-color: #0066cc;
  box-shadow: 0 0 0 3px rgba(0, 102, 204, 0.2);
}

.save-button,
.cancel-button {
  padding: 4px 8px;
  font-size: 12px;
  border-radius: 4px;
  cursor: pointer;
  transition: background-color 0.2s;
}

.save-button {
  background-color: #505050;
  color: rgba(255, 255, 255, 0.87);
  border: 1px solid #606060;
}

.save-button:hover {
  background-color: #5a5a5a;
  border-color: #7a7a7a;
}

.cancel-button {
  background-color: #505050;
  color: rgba(255, 255, 255, 0.87);
  border: 1px solid #606060;
}

.cancel-button:hover {
  background-color: #5a5a5a;
  border-color: #7a7a7a;
}

.add-button {
  padding: 10px 16px;
  background-color: #505050;
  color: rgba(255, 255, 255, 0.87);
  border: 1px solid #606060;
  border-radius: 4px;
  font-size: 14px;
  cursor: pointer;
  transition: background-color 0.2s, border-color 0.2s;
  align-self: stretch;
}

.add-button:hover {
  background-color: #5a5a5a;
  border-color: #7a7a7a;
}

.results-container {
  margin-top: 24px;
  margin-bottom: 24px;
  padding: 24px;
  border: 1px solid #404040;
  border-radius: 8px;
  background-color: #1a1a1a;
}

.results-container h2 {
  margin-top: 0;
  margin-bottom: 20px;
  color: rgba(255, 255, 255, 0.87);
}

.schedule-list {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
  gap: 12px;
}

.schedule-match {
  border: 1px solid #404040;
  border-radius: 6px;
  padding: 12px;
  background-color: #242424;
  display: flex;
  gap: 12px;
  align-items: center;
  justify-content: center;
}

.vs {
  font-size: 12px;
  color: #888;
  font-weight: 600;
}

.generate-button {
  padding: 12px 24px;
  background-color: #505050;
  color: rgba(255, 255, 255, 0.87);
  border: 1px solid #606060;
  border-radius: 4px;
  font-size: 16px;
  cursor: pointer;
  transition: background-color 0.2s, border-color 0.2s;
  font-weight: 500;
  margin: 24px 0;
}

.generate-button:hover {
  background-color: #5a5a5a;
  border-color: #7a7a7a;
}
</style>
