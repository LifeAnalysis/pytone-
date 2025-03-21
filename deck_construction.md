# TridimensionalDuels: Deck Building System

## 1. Deck Building Architecture

The deck building system provides a framework for creating, validating, and managing decks for TridimensionalDuels. It ensures that decks adhere to game rules while allowing players to express strategic preferences.

### 1.1 Core Components

1. **Deck Manager**: Central component for deck operations
2. **Validation Engine**: Enforces deck building rules
3. **Card Collection**: Manages available cards
4. **Deck Storage**: Handles persistence of deck data
5. **Deck Analysis**: Provides statistical insights

### 1.2 Deck Structure

A valid deck in TridimensionalDuels consists of exactly 16 cards following this structure:

```
class Deck {
    constructor(name = "New Deck") {
        this.id = generateUniqueId();
        this.name = name;
        this.champion = null;         // Must have exactly 1
        this.monsters = [];           // Must have exactly 5
        this.spells = [];             // Must have exactly 10
        this.timestamp = Date.now();  // Creation/modification timestamp
        this.metadata = {};           // Additional deck data (tags, notes, etc.)
    }
    
    get isValid() {
        return this.champion !== null && 
               this.monsters.length === 5 && 
               this.spells.length === 10;
    }
    
    get totalCards() {
        return (this.champion ? 1 : 0) + this.monsters.length + this.spells.length;
    }
    
    // Convert to array form for use in game
    toCardArray() {
        return [
            this.champion,
            ...this.monsters,
            ...this.spells
        ];
    }
}
```

## 2. Deck Building Rules

### 2.1 Core Constraints

```
const DECK_CONSTRAINTS = {
    TOTAL_CARDS: 16,
    CHAMPION_COUNT: 1,
    MONSTER_COUNT: 5,
    SPELL_COUNT: 10,
    MAX_DUPLICATE_MONSTERS: 2,  // Maximum copies of the same monster
    MAX_DUPLICATE_SPELLS: 3     // Maximum copies of the same spell
};
```

### 2.2 Validation Logic

```
function validateDeck(deck) {
    const errors = [];
    const warnings = [];
    
    // 1. Check card counts
    if (!deck.champion) {
        errors.push("Deck must contain exactly 1 champion card");
    }
    
    if (deck.monsters.length !== DECK_CONSTRAINTS.MONSTER_COUNT) {
        errors.push(`Deck must contain exactly ${DECK_CONSTRAINTS.MONSTER_COUNT} monster cards`);
    }
    
    if (deck.spells.length !== DECK_CONSTRAINTS.SPELL_COUNT) {
        errors.push(`Deck must contain exactly ${DECK_CONSTRAINTS.SPELL_COUNT} spell cards`);
    }
    
    // 2. Check for duplicate constraints
    const monsterCounts = countCardOccurrences(deck.monsters);
    const spellCounts = countCardOccurrences(deck.spells);
    
    for (const [cardId, count] of monsterCounts.entries()) {
        if (count > DECK_CONSTRAINTS.MAX_DUPLICATE_MONSTERS) {
            errors.push(`Cannot have more than ${DECK_CONSTRAINTS.MAX_DUPLICATE_MONSTERS} copies of the same monster`);
        }
    }
    
    for (const [cardId, count] of spellCounts.entries()) {
        if (count > DECK_CONSTRAINTS.MAX_DUPLICATE_SPELLS) {
            errors.push(`Cannot have more than ${DECK_CONSTRAINTS.MAX_DUPLICATE_SPELLS} copies of the same spell`);
        }
    }
    
    // 3. Check monster class balance
    const classDistribution = countMonsterClasses(deck.monsters);
    
    if (!classDistribution.DEFENDER) {
        warnings.push("Deck has no Defender monsters, which may weaken defensive capabilities");
    }
    
    if (!classDistribution.PUMPER) {
        warnings.push("Deck has no Pumper monsters, which may limit scaling potential");
    }
    
    if (!classDistribution.ALL_ROUNDER) {
        warnings.push("Deck has no All-Rounder monsters, which may reduce attack flexibility");
    }
    
    // 4. Verify champion/monster synergy
    if (deck.champion) {
        const synergy = evaluateChampionSynergy(deck.champion, deck.monsters);
        if (synergy.score < 0.3) {
            warnings.push("Low synergy between champion and monster cards");
        }
    }
    
    return {
        isValid: errors.length === 0,
        errors: errors,
        warnings: warnings,
        deckSize: deck.totalCards
    };
}

function countCardOccurrences(cards) {
    const counts = new Map();
    
    for (const card of cards) {
        const count = counts.get(card.id) || 0;
        counts.set(card.id, count + 1);
    }
    
    return counts;
}

function countMonsterClasses(monsters) {
    const distribution = {
        DEFENDER: 0,
        PUMPER: 0,
        ALL_ROUNDER: 0
    };
    
    for (const monster of monsters) {
        distribution[monster.class]++;
    }
    
    return distribution;
}
```

### 2.3 Champion Synergy Analysis

```
function evaluateChampionSynergy(champion, monsters) {
    let synergyScore = 0;
    const synergiesFound = [];
    
    // Check for class synergies
    if (champion.synergies && champion.synergies.classes) {
        for (const monster of monsters) {
            if (champion.synergies.classes.includes(monster.class)) {
                synergyScore += 0.1;
                synergiesFound.push(`${champion.name} synergizes with ${monster.class} class`);
            }
        }
    }
    
    // Check for attribute synergies
    if (champion.synergies && champion.synergies.attributes) {
        for (const monster of monsters) {
            if (monster.attributes) {
                for (const attribute of monster.attributes) {
                    if (champion.synergies.attributes.includes(attribute)) {
                        synergyScore += 0.1;
                        synergiesFound.push(`${champion.name} synergizes with ${attribute} attribute`);
                    }
                }
            }
        }
    }
    
    // Check for specific card synergies
    if (champion.synergies && champion.synergies.cards) {
        for (const monster of monsters) {
            if (champion.synergies.cards.includes(monster.id)) {
                synergyScore += 0.2;
                synergiesFound.push(`${champion.name} has direct synergy with ${monster.name}`);
            }
        }
    }
    
    // Normalize score (0 to 1)
    synergyScore = Math.min(1, synergyScore);
    
    return {
        score: synergyScore,
        synergies: synergiesFound
    };
}
```

## 3. Deck Manager API

### 3.1 Core Deck Operations

```
class DeckManager {
    constructor(cardCollection) {
        this.decks = new Map();  // id -> deck mapping
        this.cardCollection = cardCollection;
    }
    
    createDeck(name = "New Deck") {
        const deck = new Deck(name);
        this.decks.set(deck.id, deck);
        return deck;
    }
    
    getDeck(deckId) {
        return this.decks.get(deckId) || null;
    }
    
    getAllDecks() {
        return Array.from(this.decks.values());
    }
    
    deleteDeck(deckId) {
        return this.decks.delete(deckId);
    }
    
    // Update entire deck
    updateDeck(deckId, deckData) {
        if (!this.decks.has(deckId)) {
            return false;
        }
        
        const deck = this.decks.get(deckId);
        
        // Update basic properties
        if (deckData.name) deck.name = deckData.name;
        if (deckData.metadata) deck.metadata = deckData.metadata;
        
        // Update cards if provided
        if (deckData.champion) deck.champion = deckData.champion;
        if (deckData.monsters) deck.monsters = [...deckData.monsters];
        if (deckData.spells) deck.spells = [...deckData.spells];
        
        // Update timestamp
        deck.timestamp = Date.now();
        
        return true;
    }
    
    // Validate a deck
    validateDeck(deckId) {
        const deck = this.decks.get(deckId);
        if (!deck) return null;
        
        return validateDeck(deck);
    }
}
```

### 3.2 Card Management Methods

```
// Card addition/removal methods
class DeckManager {
    // ... existing methods
    
    addCardToDeck(deckId, card) {
        const deck = this.decks.get(deckId);
        if (!deck) return false;
        
        // Determine card type and add to appropriate array
        if (card.type === CARD_TYPE.CHAMPION) {
            if (deck.champion !== null) {
                return false; // Champion already exists
            }
            deck.champion = card;
        } else if (card.type === CARD_TYPE.MONSTER) {
            if (deck.monsters.length >= DECK_CONSTRAINTS.MONSTER_COUNT) {
                return false; // Monster slots full
            }
            
            // Check for duplicates
            const existingCount = deck.monsters.filter(m => m.id === card.id).length;
            if (existingCount >= DECK_CONSTRAINTS.MAX_DUPLICATE_MONSTERS) {
                return false; // Max duplicates reached
            }
            
            deck.monsters.push(card);
        } else if (card.type === CARD_TYPE.SPELL) {
            if (deck.spells.length >= DECK_CONSTRAINTS.SPELL_COUNT) {
                return false; // Spell slots full
            }
            
            // Check for duplicates
            const existingCount = deck.spells.filter(s => s.id === card.id).length;
            if (existingCount >= DECK_CONSTRAINTS.MAX_DUPLICATE_SPELLS) {
                return false; // Max duplicates reached
            }
            
            deck.spells.push(card);
        } else {
            return false; // Unknown card type
        }
        
        // Update timestamp
        deck.timestamp = Date.now();
        return true;
    }
    
    removeCardFromDeck(deckId, cardId, index) {
        const deck = this.decks.get(deckId);
        if (!deck) return false;
        
        // Check if it's the champion
        if (deck.champion && deck.champion.id === cardId) {
            deck.champion = null;
            deck.timestamp = Date.now();
            return true;
        }
        
        // Check monsters
        const monsterIndex = index !== undefined 
            ? index 
            : deck.monsters.findIndex(m => m.id === cardId);
            
        if (monsterIndex !== -1) {
            deck.monsters.splice(monsterIndex, 1);
            deck.timestamp = Date.now();
            return true;
        }
        
        // Check spells
        const spellIndex = index !== undefined 
            ? index 
            : deck.spells.findIndex(s => s.id === cardId);
            
        if (spellIndex !== -1) {
            deck.spells.splice(spellIndex, 1);
            deck.timestamp = Date.now();
            return true;
        }
        
        return false; // Card not found
    }
}
```

### 3.3 Deck Analysis

```
// Deck statistics and analysis
class DeckManager {
    // ... existing methods
    
    analyzeDeck(deckId) {
        const deck = this.decks.get(deckId);
        if (!deck) return null;
        
        // Basic card counts
        const cardCount = {
            champion: deck.champion ? 1 : 0,
            monsters: deck.monsters.length,
            spells: deck.spells.length,
            total: deck.totalCards
        };
        
        // Monster class distribution
        const classDistribution = countMonsterClasses(deck.monsters);
        
        // Average monster stats
        const monsterStats = calculateAverageMonsterStats(deck.monsters);
        
        // Spell type distribution
        const spellTypes = analyzeSpellTypes(deck.spells);
        
        // Analyze ATK/DEF/SPD curve
        const statCurves = analyzeStatCurves(deck.monsters);
        
        // Deck strategy assessment
        const strategyProfile = assessDeckStrategy(deck);
        
        // Champion synergy
        const championSynergy = deck.champion 
            ? evaluateChampionSynergy(deck.champion, deck.monsters)
            : { score: 0, synergies: [] };
        
        return {
            cardCount,
            classDistribution,
            monsterStats,
            spellTypes,
            statCurves,
            strategyProfile,
            championSynergy,
            validationResult: validateDeck(deck)
        };
    }
    
    // Generate a recommended deck based on a champion
    generateRecommendedDeck(championId) {
        const champion = this.cardCollection.getCard(championId);
        if (!champion || champion.type !== CARD_TYPE.CHAMPION) return null;
        
        const deck = this.createDeck(`${champion.name}'s Deck`);
        deck.champion = champion;
        
        // Select monsters with synergy
        const recommendedMonsters = this.cardCollection.findSynergisticMonsters(champion);
        deck.monsters = recommendedMonsters.slice(0, DECK_CONSTRAINTS.MONSTER_COUNT);
        
        // Select complementary spells
        const recommendedSpells = this.cardCollection.findComplementarySpells(champion, deck.monsters);
        deck.spells = recommendedSpells.slice(0, DECK_CONSTRAINTS.SPELL_COUNT);
        
        return deck;
    }
}

function calculateAverageMonsterStats(monsters) {
    if (monsters.length === 0) return { ATK: 0, DEF: 0, SPD: 0 };
    
    let totalATK = 0, totalDEF = 0, totalSPD = 0;
    
    for (const monster of monsters) {
        totalATK += monster.baseATK;
        totalDEF += monster.baseDEF;
        totalSPD += monster.baseSPD;
    }
    
    return {
        ATK: totalATK / monsters.length,
        DEF: totalDEF / monsters.length,
        SPD: totalSPD / monsters.length
    };
}

function analyzeSpellTypes(spells) {
    const types = {
        BUFF: 0,
        DEBUFF: 0,
        DAMAGE: 0,
        CONTROL: 0,
        UTILITY: 0
    };
    
    for (const spell of spells) {
        if (spell.spellType) {
            types[spell.spellType]++;
        }
    }
    
    return types;
}

function analyzeStatCurves(monsters) {
    // Sort monsters by each stat
    const byATK = [...monsters].sort((a, b) => a.baseATK - b.baseATK);
    const byDEF = [...monsters].sort((a, b) => a.baseDEF - b.baseDEF);
    const bySPD = [...monsters].sort((a, b) => a.baseSPD - b.baseSPD);
    
    // Extract stat curves
    return {
        ATK: byATK.map(m => m.baseATK),
        DEF: byDEF.map(m => m.baseDEF),
        SPD: bySPD.map(m => m.baseSPD)
    };
}

function assessDeckStrategy(deck) {
    // Calculate key indicators
    const monsterStats = calculateAverageMonsterStats(deck.monsters);
    const classDistribution = countMonsterClasses(deck.monsters);
    const spellTypes = analyzeSpellTypes(deck.spells);
    
    // Strategy profile scores (0-1 range)
    const scores = {
        aggressive: 0,
        defensive: 0,
        control: 0,
        tempo: 0,
        combo: 0
    };
    
    // Evaluate aggressive tendencies
    scores.aggressive = calculateNormalizedScore(
        (monsterStats.ATK * 1.5) + 
        (monsterStats.SPD * 1.0) + 
        (classDistribution.ALL_ROUNDER * 2) + 
        (spellTypes.DAMAGE * 3),
        50  // Max reasonable value
    );
    
    // Evaluate defensive tendencies
    scores.defensive = calculateNormalizedScore(
        (monsterStats.DEF * 1.5) + 
        (classDistribution.DEFENDER * 2) + 
        (spellTypes.BUFF * 2),
        50  // Max reasonable value
    );
    
    // Evaluate control tendencies
    scores.control = calculateNormalizedScore(
        (spellTypes.CONTROL * 3) + 
        (spellTypes.DEBUFF * 2) + 
        (classDistribution.DEFENDER * 1),
        30  // Max reasonable value
    );
    
    // Evaluate tempo tendencies
    scores.tempo = calculateNormalizedScore(
        (monsterStats.SPD * 1.5) + 
        (classDistribution.PUMPER * 2) + 
        (spellTypes.BUFF * 1),
        40  // Max reasonable value
    );
    
    // Evaluate combo tendencies
    if (deck.champion && deck.champion.synergies) {
        const synergy = evaluateChampionSynergy(deck.champion, deck.monsters);
        scores.combo = synergy.score;
    }
    
    // Determine primary and secondary strategies
    const rankedStrategies = Object.entries(scores)
        .sort((a, b) => b[1] - a[1]);
    
    return {
        primaryStrategy: rankedStrategies[0][0],
        secondaryStrategy: rankedStrategies[1][0],
        scores: scores
    };
}

function calculateNormalizedScore(value, maxValue) {
    return Math.min(1, Math.max(0, value / maxValue));
}
```

## 4. Local Testing Utilities

### 4.1 Predefined Test Decks

```
function generateTestDecks(cardCollection) {
    const deckManager = new DeckManager(cardCollection);
    
    // Aggressive test deck
    const aggressiveDeck = deckManager.createDeck("Aggressive Test Deck");
    aggressiveDeck.champion = cardCollection.findCardByName("Blazing Phoenix");
    aggressiveDeck.monsters = [
        cardCollection.findCardByName("Fleetfoot Rogue"),
        cardCollection.findCardByName("Shadow Assassin"),
        cardCollection.findCardByName("Stealthy Assassin"),
        cardCollection.findCardByName("Frenzied Berserker"),
        cardCollection.findCardByName("Dark Knight")
    ];
    aggressiveDeck.spells = [
        cardCollection.findCardByName("Fireball Spell"),
        cardCollection.findCardByName("Lightning Strike Spell"),
        cardCollection.findCardByName("Fireball Spell"),
        cardCollection.findCardByName("Lightning Strike Spell"),
        cardCollection.findCardByName("Poison Spell"),
        cardCollection.findCardByName("Teleport Spell"),
        cardCollection.findCardByName("Fireball Spell"),
        cardCollection.findCardByName("Lightning Strike Spell"),
        cardCollection.findCardByName("Poison Spell"),
        cardCollection.findCardByName("Teleport Spell")
    ];
    
    // Defensive test deck
    const defensiveDeck = deckManager.createDeck("Defensive Test Deck");
    defensiveDeck.champion = cardCollection.findCardByName("Ironclad Sentinel");
    defensiveDeck.monsters = [
        cardCollection.findCardByName("Shielded Golem"),
        cardCollection.findCardByName("Stone Gargoyle"),
        cardCollection.findCardByName("Soulbound Protector"),
        cardCollection.findCardByName("Frost Giant"),
        cardCollection.findCardByName("Venomous Serpent")
    ];
    defensiveDeck.spells = [
        cardCollection.findCardByName("Heal Spell"),
        cardCollection.findCardByName("Frostbolt Spell"),
        cardCollection.findCardByName("Heal Spell"),
        cardCollection.findCardByName("Frostbolt Spell"),
        cardCollection.findCardByName("Heal Spell"),
        cardCollection.findCardByName("Teleport Spell"),
        cardCollection.findCardByName("Frostbolt Spell"),
        cardCollection.findCardByName("Poison Spell"),
        cardCollection.findCardByName("Teleport Spell"),
        cardCollection.findCardByName("Poison Spell")
    ];
    
    // Balanced test deck
    const balancedDeck = deckManager.createDeck("Balanced Test Deck");
    balancedDeck.champion = cardCollection.findCardByName("Arcane Wizard");
    balancedDeck.monsters = [
        cardCollection.findCardByName("Shielded Golem"),
        cardCollection.findCardByName("Fleetfoot Rogue"),
        cardCollection.findCardByName("Venomous Serpent"),
        cardCollection.findCardByName("Time Manipulator"),
        cardCollection.findCardByName("Healing Fairy")
    ];
    balancedDeck.spells = [
        cardCollection.findCardByName("Fireball Spell"),
        cardCollection.findCardByName("Heal Spell"),
        cardCollection.findCardByName("Frostbolt Spell"),
        cardCollection.findCardByName("Lightning Strike Spell"),
        cardCollection.findCardByName("Poison Spell"),
        cardCollection.findCardByName("Teleport Spell"),
        cardCollection.findCardByName("Fireball Spell"),
        cardCollection.findCardByName("Heal Spell"),
        cardCollection.findCardByName("Frostbolt Spell"),
        cardCollection.findCardByName("Lightning Strike Spell")
    ];
    
    return [aggressiveDeck, defensiveDeck, balancedDeck];
}
```

### 4.2 Deck Testing Functions

```
function testDeckPerformance(deck, iterations = 100) {
    const results = {
        wins: 0,
        losses: 0,
        draws: 0,
        avgTurnsToWin: 0,
        avgDamageDealt: 0,
        avgCardsPlayed: 0
    };
    
    let totalTurns = 0;
    let totalDamage = 0;
    let totalCards = 0;
    
    for (let i = 0; i < iterations; i++) {
        // Run a simulated game with this deck vs. a balanced opponent
        const gameResult = simulateDeckVsAI(deck);
        
        if (gameResult.winner === PLAYER_INDEX) {
            results.wins++;
        } else if (gameResult.winner === AI_PLAYER_INDEX) {
            results.losses++;
        } else {
            results.draws++;
        }
        
        totalTurns += gameResult.turnCount;
        totalDamage += gameResult.damageDealt[PLAYER_INDEX];
        totalCards += gameResult.cardsPlayed[PLAYER_INDEX];
    }
    
    // Calculate averages
    results.avgTurnsToWin = results.wins > 0 ? totalTurns / results.wins : 0;
    results.avgDamageDealt = totalDamage / iterations;
    results.avgCardsPlayed = totalCards / iterations;
    
    return results;
}

function simulateDeckVsAI(deck) {
    // Initialize game with the test deck vs. an AI deck
    const gameState = initializeGameState(
        { deck: deck.toCardArray() },
        { deck: generateAIDeck() }
    );
    
    const result = {
        winner: null,
        turnCount: 0,
        damageDealt: [0, 0],  // Player, AI
        cardsPlayed: [0, 0]   // Player, AI
    };
    
    // Simulate up to 30 turns
    for (let turn = 1; turn <= 30; turn++) {
        result.turnCount = turn;
        
        // Process player turn with simple strategy
        processPlayerTurn(gameState, result);
        
        // Check win condition
        if (checkWinCondition(gameState)) {
            result.winner = determineWinner(gameState);
            break;
        }
        
        // Process AI turn
        processAITurn(gameState, result);
        
        // Check win condition again
        if (checkWinCondition(gameState)) {
            result.winner = determineWinner(gameState);
            break;
        }
    }
    
    // If no winner after 30 turns, it's a draw
    if (result.winner === null) {
        result.winner = "DRAW";
    }
    
    return result;
}

function generateRandomTestDeck(cardCollection) {
    const deckManager = new DeckManager(cardCollection);
    const deck = deckManager.createDeck("Random Test Deck");
    
    // Select random champion
    const champions = cardCollection.getCardsByType(CARD_TYPE.CHAMPION);
    deck.champion = champions[Math.floor(Math.random() * champions.length)];
    
    // Select random monsters
    const monsters = cardCollection.getCardsByType(CARD_TYPE.MONSTER);
    const shuffledMonsters = [...monsters].sort(() => Math.random() - 0.5);
    deck.monsters = shuffledMonsters.slice(0, DECK_CONSTRAINTS.MONSTER_COUNT);
    
    // Select random spells
    const spells = cardCollection.getCardsByType(CARD_TYPE.SPELL);
    const shuffledSpells = [...spells].sort(() => Math.random() - 0.5);
    deck.spells = shuffledSpells.slice(0, DECK_CONSTRAINTS.SPELL_COUNT);
    
    return deck;
}
```

## 5. Deck Building Strategy Guidelines

### 5.1 Common Deck Archetypes

```
const DECK_ARCHETYPES = {
    AGGRO: {
        description: "Focus on high ATK and SPD values to quickly damage opponent",
        recommendedClasses: {
            ALL_ROUNDER: 3,   // Recommended count
            PUMPER: 2,
            DEFENDER: 0
        },
        recommendedSpells: ["DAMAGE", "BUFF"],
        statPriority: ["ATK", "SPD", "DEF"]
    },
    
    CONTROL: {
        description: "Focus on controlling the board and restricting opponent options",
        recommendedClasses: {
            DEFENDER: 2,
            ALL_ROUNDER: 1,
            PUMPER: 2
        },
        recommendedSpells: ["CONTROL", "DEBUFF", "DAMAGE"],
        statPriority: ["DEF", "SPD", "ATK"]
    },
    
    MIDRANGE: {
        description: "Balanced approach with flexible options",
        recommendedClasses: {
            DEFENDER: 1,
            ALL_ROUNDER: 2,
            PUMPER: 2
        },
        recommendedSpells: ["BUFF", "DAMAGE", "UTILITY"],
        statPriority: ["SPD", "ATK", "DEF"]
    },
    
    COMBO: {
        description: "Focus on card synergies and powerful combinations",
        recommendedClasses: {
            PUMPER: 3,
            ALL_ROUNDER: 1,
            DEFENDER: 1
        },
        recommendedSpells: ["BUFF", "UTILITY", "CONTROL"],
        statPriority: ["SPD", "ATK", "DEF"]
    }
};

function getDeckArchetypeRecommendations(deck) {
    // Analyze the current deck
    const deckManager = new DeckManager();
    const analysis = deckManager.analyzeDeck(deck);
    
    // Find closest archetype
    let bestMatch = null;
    let bestMatchScore = -1;
    
    for (const [archetypeName, archetype] of Object.entries(DECK_ARCHETYPES)) {
        const matchScore = calculateArchetypeMatchScore(analysis, archetype);
        
        if (matchScore > bestMatchScore) {
            bestMatch = archetypeName;
            bestMatchScore = matchScore;
        }
    }
    
    // Generate recommendations
    const recommendations = {
        closestArchetype: bestMatch,
        matchScore: bestMatchScore,
        suggestions: []
    };
    
    // Add suggestions based on archetype
    const archetype = DECK_ARCHETYPES[bestMatch];
    
    // Class balance recommendations
    const classDistribution = analysis.classDistribution;
    for (const [className, recommendedCount] of Object.entries(archetype.recommendedClasses)) {
        const currentCount = classDistribution[className];
        if (currentCount < recommendedCount) {
            recommendations.suggestions.push(
                `Consider adding ${recommendedCount - currentCount} more ${className} monster(s)`
            );
        }
    }
    
    // Stat recommendations
    const firstPriorityStat = archetype.statPriority[0];
    if (analysis.monsterStats[firstPriorityStat] < getRecommendedStatValue(firstPriorityStat)) {
        recommendations.suggestions.push(
            `Increase average ${firstPriorityStat} value by adding stronger ${firstPriorityStat} monsters`
        );
    }
    
    return recommendations;
}

function calculateArchetypeMatchScore(deckAnalysis, archetype) {
    let score = 0;
    
    // Class distribution match
    for (const [className, recommendedCount] of Object.entries(archetype.recommendedClasses)) {
        const currentCount = deckAnalysis.classDistribution[className];
        // Higher score for closer match
        score += (5 - Math.abs(recommendedCount - currentCount)) * 2;
    }
    
    // Spell type match
    for (const spellType of archetype.recommendedSpells) {
        const spellCount = deckAnalysis.spellTypes[spellType];
        score += spellCount * 1.5;
    }
    
    // Stat priority match
    const primaryStat = archetype.statPriority[0];
    const secondaryStat = archetype.statPriority[1];
    
    // Higher score if stats align with priority
    if (deckAnalysis.monsterStats[primaryStat] > 
        deckAnalysis.monsterStats[archetype.statPriority[2]]) {
        score += 5;
    }
    
    if (deckAnalysis.monsterStats[secondaryStat] > 
        deckAnalysis.monsterStats[archetype.statPriority[2]]) {
        score += 3;
    }
    
    return score;
}

function getRecommendedStatValue(statName) {
    switch (statName) {
        case "ATK": return 6.5;  // Recommended average ATK
        case "DEF": return 7.0;  // Recommended average DEF
        case "SPD": return 6.0;  // Recommended average SPD
        default: return 0;
    }
}
```

The deck building system provides a comprehensive framework for creating, validating, and testing decks for TridimensionalDuels. It ensures that decks adhere to the game's rules while supporting diverse strategic approaches. 