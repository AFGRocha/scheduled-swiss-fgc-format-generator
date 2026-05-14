// 1. Define our types
export interface Player {
  id: string;
  name: string;
  potId: string;
}

interface Match {
  player1: Player;
  player2: Player;
}

export type Pot = Player[];
  
// Helper function to shuffle an array in-place (Fisher-Yates)
function shuffle<T>(array: T[]): T[] {
  const cloned = [...array];
  for (let i = cloned.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [cloned[i], cloned[j]] = [cloned[j], cloned[i]];
  }
  return cloned;
}

/**
 * Generates matches within the same pot ensuring no player plays themselves
 * and no duplicate pairings occur.
 */
function drawSamePot(pot: Pot): Match[] {
  if (pot.length < 2) {
    throw new Error("A pot must have at least 2 players to draw within itself.");
  }
  
  if (pot.length % 2 !== 0) {
    throw new Error("Same-pot draws require an even number of players to avoid someone being left out.");
  }

  const matches: Match[] = [];
  const shuffled = shuffle(pot);

  // Pair them up sequentially after a random shuffle
  for (let i = 0; i < shuffled.length; i += 2) {
    matches.push({
      player1: shuffled[i],
      player2: shuffled[i + 1]
    });
  }

  return matches;
}

/**
 * Generates matches between two different pots.
 */
function drawDifferentPots(potA: Pot, potB: Pot): Match[] {
  if (potA.length !== potB.length) {
    throw new Error("Pots must have the same number of players for a balanced draw.");
  }

  const matches: Match[] = [];
  const shuffledB = shuffle(potB);

  // Pair each player from Pot A with a unique, randomized player from Pot B
  for (let i = 0; i < potA.length; i++) {
    matches.push({
      player1: potA[i],
      player2: shuffledB[i]
    });
  }

  return matches;
}

/**
 * Master function to simulate the entire competition draw
 */
export function simulateDraw(pots: Record<string, Pot>): Match[] {
  const allMatches: Match[] = [];
  const potIds = Object.keys(pots);

  // Draw within the same pots
  for (const potId of potIds) {
    allMatches.push(...drawSamePot(pots[potId]));
  }

  // Draw between different pots
  for (let i = 0; i < potIds.length; i++) {
    for (let j = i + 1; j < potIds.length; j++) {
      const potA = pots[potIds[i]];
      const potB = pots[potIds[j]];
      allMatches.push(...drawDifferentPots(potA, potB));
    }
  }

  return allMatches;
}