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
}

.card {
  border: 1px solid #ccc;
  border-radius: 8px;
  padding: 16px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  flex: 1 1 300px;
  min-width: 300px;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;
}

.card-header h3 {
  margin: 0;
}

.remove-button {
  background-color: #ff4444;
  color: white;
  border: none;
  border-radius: 4px;
  width: 28px;
  height: 28px;
  font-size: 18px;
  cursor: pointer;
  transition: background-color 0.2s;
  padding: 0;
  display: flex;
  align-items: center;
  justify-content: center;
}

.remove-button:hover {
  background-color: #cc0000;
}

.input-group {
  display: flex;
  gap: 8px;
  margin-bottom: 16px;
}

.input-group input {
  flex: 1;
  padding: 8px;
  border: 1px solid #ddd;
  border-radius: 4px;
  font-size: 14px;
}

.input-group input:focus {
  outline: none;
  border-color: #0066cc;
  box-shadow: 0 0 0 3px rgba(0, 102, 204, 0.1);
}

.add-player-button {
  padding: 8px 12px;
  background-color: #0066cc;
  color: white;
  border: none;
  border-radius: 4px;
  font-size: 14px;
  cursor: pointer;
  transition: background-color 0.2s;
}

.add-player-button:hover {
  background-color: #0052a3;
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
}

.action-buttons {
  display: flex;
  gap: 8px;
}

.edit-button,
.delete-button {
  padding: 4px 8px;
  font-size: 12px;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  transition: background-color 0.2s;
}

.edit-button {
  background-color: #4CAF50;
  color: white;
}

.edit-button:hover {
  background-color: #45a049;
}

.delete-button {
  background-color: #ff4444;
  color: white;
}

.delete-button:hover {
  background-color: #cc0000;
}

.edit-mode {
  display: flex;
  gap: 8px;
  width: 100%;
}

.edit-input {
  flex: 1;
  padding: 6px;
  border: 1px solid #ddd;
  border-radius: 4px;
  font-size: 14px;
}

.edit-input:focus {
  outline: none;
  border-color: #0066cc;
  box-shadow: 0 0 0 3px rgba(0, 102, 204, 0.1);
}

.save-button,
.cancel-button {
  padding: 4px 8px;
  font-size: 12px;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  transition: background-color 0.2s;
}

.save-button {
  background-color: #4CAF50;
  color: white;
}

.save-button:hover {
  background-color: #45a049;
}

.cancel-button {
  background-color: #999;
  color: white;
}

.cancel-button:hover {
  background-color: #777;
}

.add-button {
  padding: 10px 16px;
  background-color: #0066cc;
  color: white;
  border: none;
  border-radius: 4px;
  font-size: 14px;
  cursor: pointer;
  transition: background-color 0.2s;
  height: fit-content;
}

.add-button:hover {
  background-color: #0052a3;
}

.results-container {
  margin-top: 32px;
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

.matchday-label {
  background-color: #0066cc;
  color: white;
  padding: 4px 8px;
  border-radius: 4px;
  font-size: 12px;
  font-weight: 500;
  min-width: 90px;
  display: none;
}

.match-details {
  flex: 1;
  display: flex;
  align-items: center;
  gap: 12px;
}

.player-name {
  padding: 4px 8px;
  border-radius: 4px;
  font-size: 14px;
  font-weight: 500;
}

.player-name.home {
  background-color: #2a6a2a;
  color: #8cff8c;
}

.player-name.away {
  background-color: #6a2a2a;
  color: #ff8c8c;
}

.vs {
  font-size: 12px;
  color: #999;
  font-weight: 600;
}

.match-location {
  font-size: 12px;
  color: #999;
  min-width: 150px;
  text-align: right;
  display: none;
}

.generate-button {
  padding: 12px 24px;
  background-color: #4CAF50;
  color: white;
  border: none;
  border-radius: 4px;
  font-size: 16px;
  cursor: pointer;
  transition: background-color 0.2s;
  font-weight: 500;
}

.generate-button:hover {
  background-color: #45a049;
}
</style>
