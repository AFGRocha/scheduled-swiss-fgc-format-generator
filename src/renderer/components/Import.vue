<script setup lang="ts">
import { ref } from "vue";
import { simulateDraw, Player, Pot } from "../utils/drawUtils";

type SeededAttendee = {
	name: string;
	seed: number | null;
};

type PotData = {
	potNumber: number;
	players: SeededAttendee[];
};

const importLink = ref("");
const potCount = ref<number | null>(null);
const createdPots = ref<number>(0);
const errorMessage = ref("");
const isLoading = ref(false);
const eventName = ref("");
const attendees = ref<SeededAttendee[]>([]);
const pots = ref<PotData[]>([]);
const schedule = ref<Array<{ id: number; player1: Player; player2: Player }>>([]);
const showResults = ref(false);

const parseEventSlugFromUrl = (url: string): string | null => {
	try {
		const parsed = new URL(url);
		if (!parsed.hostname.includes("start.gg")) {
			return null;
		}

		const cleanPath = parsed.pathname.replace(/^\/+|\/+$/g, "");
		if (!cleanPath.includes("/event/")) {
			return null;
		}

		return cleanPath;
	} catch {
		return null;
	}
};


const buildPotsFromSeeds = (seededAttendees: SeededAttendee[], numberOfPots: number): PotData[] => {
	const nextPots: PotData[] = Array.from({ length: numberOfPots }, (_, idx) => ({
		potNumber: idx + 1,
		players: []
	}));

	const totalPlayers = seededAttendees.length;
	const baseSize = Math.floor(totalPlayers / numberOfPots);
	const remainder = totalPlayers % numberOfPots;

	let cursor = 0;
	for (let potIndex = 0; potIndex < numberOfPots; potIndex += 1) {
		const potSize = baseSize + (potIndex < remainder ? 1 : 0);
		nextPots[potIndex].players = seededAttendees.slice(cursor, cursor + potSize);
		cursor += potSize;
	}

	return nextPots;
};

const createPots = async () => {
	errorMessage.value = "";
	createdPots.value = 0;
	attendees.value = [];
	pots.value = []; 
	eventName.value = "";
	schedule.value = [];
	showResults.value = false;

	const trimmedLink = importLink.value.trim();
	if (!trimmedLink) {
		errorMessage.value = "Please enter a link to import.";
		return;
	}

	const count = Number(potCount.value);
	if (!Number.isInteger(count) || count <= 0) {
		errorMessage.value = "Please enter a valid number of pots.";
		return;
	}

	const eventSlug = parseEventSlugFromUrl(trimmedLink);
	if (!eventSlug) {
		errorMessage.value = "Please provide a valid start.gg event link.";
		return;
	}

	isLoading.value = true;
	try {
		const result = await window.electronAPI.getSeededAttendees(eventSlug);
		if (result.attendees.length === 0) {
			errorMessage.value = "No attendees found for this event.";
			return;
		}

		eventName.value = result.eventName;
		attendees.value = result.attendees;
		pots.value = buildPotsFromSeeds(result.attendees, count);
		createdPots.value = count;
	} catch (error) {
		const message = error instanceof Error ? error.message : "Failed to import attendees from start.gg.";
		errorMessage.value = message;
	} finally {
		isLoading.value = false;
	}
};

const generateMatches = () => {
	try {
		const potsRecord: Record<string, Pot> = {};

		pots.value.forEach((pot, potIndex) => {
			const drawPot: Pot = pot.players.map((player, playerIndex) => ({
				id: `${potIndex}-${player.seed ?? "unseeded"}-${playerIndex}`,
				name: player.name,
				potId: potIndex.toString()
			}));

			potsRecord[`Pot-${pot.potNumber}`] = drawPot;
		});

		const matches = simulateDraw(potsRecord);
		schedule.value = matches.map((match, idx) => ({
			id: idx,
			player1: match.player1,
			player2: match.player2
		}));
		showResults.value = true;
	} catch (error) {
		console.error("Error generating matches:", error);
		errorMessage.value = `Error generating matches. ${String(error)}`;
	}
};
</script>

<template>
	<div class="import-wrapper">
		<div class="card">
			<h3>Import</h3>

			<div class="field-group">
				<label for="import-link">Import Link</label>
				<input
					id="import-link"
					v-model="importLink"
					type="url"
					placeholder="https://www.start.gg/*tournament*/event/*event-name*"
				/>
			</div>

			<div class="field-group">
				<label for="pot-count">Number of Pots</label>
				<input
					id="pot-count"
					v-model.number="potCount"
					type="number"
					min="1"
					step="1"
					placeholder="Enter number of pots"
				/>
			</div>

			<button class="create-button" :disabled="isLoading" @click="createPots">
				{{ isLoading ? "Importing..." : "Create Pots" }}
			</button>

			<p v-if="errorMessage" class="error-message">{{ errorMessage }}</p>
			<p v-else-if="createdPots > 0" class="success-message">
				Created {{ createdPots }} pot{{ createdPots === 1 ? "" : "s" }} from {{ eventName || "import link" }}.
			</p>
		</div>  
		<div v-if="pots.length > 0" class="pots-grid">
			<div v-for="pot in pots" :key="pot.potNumber" class="card pot-card">
				<h3>Pot {{ pot.potNumber }}</h3>
				<ul class="pot-list">
					<li v-for="(player, index) in pot.players" :key="`${pot.potNumber}-${player.name}-${index}`">
						<span class="seed">#{{ player.seed ?? "-" }}</span>
						<span>{{ player.name }}</span>
					</li>
				</ul>
			</div>
		</div>

		<div v-if="pots.length > 0" class="actions-row">
			<button class="generate-button" @click="generateMatches">Create Matches</button>
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
	</div>
</template>

<style scoped>
.import-wrapper {
	margin: 0 auto;
	padding: 24px 0;
	display: grid;
	gap: 16px;
}

.card {
	border: 1px solid #404040;
	border-radius: 8px;
	padding: 16px;
	box-shadow: 0 2px 8px rgba(0, 0, 0, 0.3);
	background-color: #1a1a1a;
}

h3 {
	margin: 0 0 16px;
	color: rgba(255, 255, 255, 0.87);
}

.field-group {
	display: flex;
	flex-direction: column;
	gap: 8px;
	margin-bottom: 16px;
}

label {
	font-size: 14px;
	color: rgba(255, 255, 255, 0.87);
}

input {
	width: 100%;
	box-sizing: border-box;
	padding: 8px;
	border: 1px solid #404040;
	border-radius: 4px;
	font-size: 14px;
	background-color: #242424;
	color: rgba(255, 255, 255, 0.87);
}

input:focus {
	outline: none;
	border-color: #0066cc;
	box-shadow: 0 0 0 3px rgba(0, 102, 204, 0.2);
}

.create-button {
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

.create-button:disabled {
	opacity: 0.7;
	cursor: not-allowed;
}

.create-button:not(:disabled):hover {
	background-color: #5a5a5a;
	border-color: #7a7a7a;
}

.error-message {
	margin-top: 12px;
	color: #d07a7a;
}

.success-message {
	margin-top: 12px;
	color: #9fd0a0;
}

.results-card {
	padding-top: 20px;
}

.attendee-table {
	display: grid;
	gap: 8px;
}

.table-row {
	display: grid;
	grid-template-columns: 80px 1fr;
	gap: 12px;
	padding: 8px;
	border: 1px solid #404040;
	border-radius: 4px;
	background-color: #242424;
}

.table-header {
	background-color: #2a2a2a;
	font-weight: 600;
}

.pots-grid {
	display: grid;
	grid-template-columns: repeat(auto-fit, minmax(240px, 1fr));
	gap: 16px;
}

.pot-card {
	min-width: 0;
}

.pot-list {
	list-style: none;
	margin: 0;
	padding: 0;
	display: grid;
	gap: 8px;
}

.pot-list li {
	background-color: #242424;
	border: 1px solid #404040;
	border-radius: 4px;
	padding: 8px;
	display: flex;
	gap: 8px;
	align-items: baseline;
}

.seed {
	color: #9f9f9f;
	font-size: 13px;
	min-width: 36px;
}

.actions-row {
	display: flex;
	justify-content: center;
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
}

.generate-button:hover {
	background-color: #5a5a5a;
	border-color: #7a7a7a;
}

.results-container {
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

.player-name {
	font-size: 14px;
	word-break: break-word;
	color: rgba(255, 255, 255, 0.87);
}

.vs {
	font-size: 12px;
	color: #888;
	font-weight: 600;
}
</style>