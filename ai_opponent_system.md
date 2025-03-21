# TridimensionalDuels: AI Opponent Logic

## 1. AI Architecture Overview

The AI system provides opponents for local testing and single-player scenarios. It follows a modular architecture that simulates human-like decision-making while allowing for configurable difficulty levels.

### 1.1 Core AI Components

1. **Strategic Evaluator**: Assesses board state and calculates optimal plays
2. **Card Valuation Engine**: Assigns dynamic value to cards based on context
3. **Decision Tree Generator**: Creates possible action sequences
4. **Action Selector**: Chooses final actions based on evaluation and difficulty
5. **Memory System**: Tracks game history for adaptive play

### 1.2 Difficulty Levels

The AI supports multiple difficulty levels through parameter adjustments:

```
const AI_DIFFICULTY = {
    EASY: {
        lookAheadTurns: 1,
        perfectMemory: false,
        suboptimalPlayChance: 0.3,
        randomnessWeight: 0.4,
        valueOptimalPlays: false
    },
    MEDIUM: {
        lookAheadTurns: 2,
        perfectMemory: true,
        suboptimalPlayChance: 0.15,
        randomnessWeight: 0.2,
        valueOptimalPlays: true
    },
    HARD: {
        lookAheadTurns: 3,
        perfectMemory: true,
        suboptimalPlayChance: 0.05,
        randomnessWeight: 0.1,
        valueOptimalPlays: true
    },
    EXPERT: {
        lookAheadTurns: 4,
        perfectMemory: true,
        suboptimalPlayChance: 0,
        randomnessWeight: 0,
        valueOptimalPlays: true
    }
};
```

## 2. Decision-Making Pipeline

### 2.1 AI Turn Processing

The AI's turn follows a structured pipeline:

```
function processAITurn(gameState, difficulty) {
    // 1. Analyze current game state
    const analysis = analyzeGameState(gameState);
    
    // 2. Generate possible actions
    const possibleActions = generatePossibleActions(gameState, analysis);
    
    // 3. Evaluate each action's potential outcome
    const evaluatedActions = evaluateActions(possibleActions, gameState, difficulty);
    
    // 4. Select final actions based on difficulty settings
    const selectedActions = selectActions(evaluatedActions, difficulty);
    
    // 5. Execute selected actions
    return executeActions(selectedActions, gameState);
}
```

### 2.2 Game State Analysis

```
function analyzeGameState(gameState) {
    return {
        boardAnalysis: analyzeBoardState(gameState),
        handAnalysis: analyzeHand(gameState, AI_PLAYER_INDEX),
        threatAnalysis: analyzeThreatLevel(gameState, AI_PLAYER_INDEX),
        opportunityAnalysis: analyzeOpportunities(gameState, AI_PLAYER_INDEX),
        phaseStrategy: determinePhaseStrategy(gameState)
    };
}

function analyzeBoardState(gameState) {
    // Calculate board control metrics
    const playerBoard = getBoardStrength(gameState, AI_PLAYER_INDEX);
    const opponentBoard = getBoardStrength(gameState, 1 - AI_PLAYER_INDEX);
    
    return {
        controlAdvantage: playerBoard - opponentBoard,
        emptyPositions: getEmptyPositions(gameState, AI_PLAYER_INDEX),
        vulnerableCards: findVulnerableCards(gameState),
        threatCards: findThreatCards(gameState),
        laneHealth: analyzeLaneHealth(gameState)
    };
}
```

### 2.3 Action Generation

```
function generatePossibleActions(gameState, analysis) {
    const actions = [];
    
    // Card playing actions
    const playableCards = getPlayableCards(gameState);
    for (const card of playableCards) {
        const validPositions = getValidPositions(card, gameState);
        for (const position of validPositions) {
            actions.push({
                type: ACTION_TYPE.PLACE_CARD,
                card: card,
                position: position
            });
        }
    }
    
    // Attack actions
    const attackers = getAvailableAttackers(gameState);
    for (const attacker of attackers) {
        const validTargets = getValidAttackTargets(attacker, gameState);
        for (const target of validTargets) {
            actions.push({
                type: ACTION_TYPE.SELECT_ATTACK,
                attacker: attacker,
                target: target,
                attackType: determineAttackType(attacker, target)
            });
        }
    }
    
    // Special actions (protect, pump)
    const defenders = getDefenders(gameState);
    for (const defender of defenders) {
        if (canProtect(defender, gameState)) {
            actions.push({
                type: ACTION_TYPE.SELECT_PROTECT,
                card: defender
            });
        }
    }
    
    const pumpers = getPumpers(gameState);
    for (const pumper of pumpers) {
        actions.push({
            type: ACTION_TYPE.SELECT_PUMP,
            card: pumper
        });
    }
    
    // Champion ability actions
    const champion = getChampion(gameState, AI_PLAYER_INDEX);
    if (champion && champion.abilities) {
        for (const ability of champion.abilities) {
            if (ability.canUse(gameState, champion)) {
                const validTargets = getValidAbilityTargets(ability, gameState);
                for (const target of validTargets) {
                    actions.push({
                        type: ACTION_TYPE.USE_CHAMPION_ABILITY,
                        ability: ability,
                        targets: target
                    });
                }
            }
        }
    }
    
    return actions;
}
```

### 2.4 Action Evaluation

Actions are evaluated using a weighted scoring system:

```
function evaluateActions(actions, gameState, difficulty) {
    const evaluatedActions = [];
    
    for (const action of actions) {
        // Create a deep copy of the game state to simulate action
        const simulatedState = deepCopy(gameState);
        
        // Apply the action to the simulated state
        applyAction(action, simulatedState);
        
        // Look ahead based on difficulty setting
        const score = evaluateGameState(
            simulatedState, 
            difficulty.lookAheadTurns, 
            AI_PLAYER_INDEX
        );
        
        // Add randomness based on difficulty
        const randomFactor = Math.random() * difficulty.randomnessWeight;
        const finalScore = score * (1 - difficulty.randomnessWeight) + randomFactor;
        
        evaluatedActions.push({
            action: action,
            score: finalScore,
            baseScore: score
        });
    }
    
    // Sort by score (highest first)
    return evaluatedActions.sort((a, b) => b.score - a.score);
}

function evaluateGameState(gameState, depth, playerIndex) {
    if (depth === 0) {
        return calculateStateScore(gameState, playerIndex);
    }
    
    // Generate potential opponent responses
    const opponentIndex = 1 - playerIndex;
    const opponentActions = generateSimplifiedActions(gameState, opponentIndex);
    
    // Find the best opponent action (worst for us)
    let worstScore = Infinity;
    
    for (const action of opponentActions) {
        const simulatedState = deepCopy(gameState);
        applyAction(action, simulatedState);
        
        // Recursively evaluate resulting state
        const score = evaluateGameState(simulatedState, depth - 1, playerIndex);
        worstScore = Math.min(worstScore, score);
    }
    
    return worstScore;
}

function calculateStateScore(gameState, playerIndex) {
    const score = {
        // Board control
        boardControl: evaluateBoardControl(gameState, playerIndex) * 1.5,
        
        // Lane health
        laneHealth: evaluateLaneHealth(gameState, playerIndex) * 2.0,
        
        // Card advantage
        cardAdvantage: evaluateCardAdvantage(gameState, playerIndex) * 1.0,
        
        // Stat advantage
        statAdvantage: evaluateStatAdvantage(gameState, playerIndex) * 1.2,
        
        // Position advantage
        positionAdvantage: evaluatePositionAdvantage(gameState, playerIndex) * 0.8,
        
        // Threat assessment
        threatAssessment: evaluateThreats(gameState, playerIndex) * 1.8
    };
    
    // Calculate total score
    return Object.values(score).reduce((sum, value) => sum + value, 0);
}
```

### 2.5 Action Selection

The final action selection depends on difficulty level:

```
function selectActions(evaluatedActions, difficulty) {
    // Determine whether to play suboptimally based on difficulty
    const playSuboptimal = Math.random() < difficulty.suboptimalPlayChance;
    
    if (playSuboptimal) {
        // Select a non-optimal but reasonable action
        const actionCount = evaluatedActions.length;
        const selectionIndex = Math.floor(Math.random() * (actionCount / 3)) + 1;
        return evaluatedActions[selectionIndex].action;
    } else {
        // Select the highest-scored action
        return evaluatedActions[0].action;
    }
}
```

## 3. Strategic Algorithms

### 3.1 Board Control Evaluation

```
function evaluateBoardControl(gameState, playerIndex) {
    const playerCards = getPlayerCards(gameState, playerIndex);
    const opponentCards = getPlayerCards(gameState, 1 - playerIndex);
    
    let playerStrength = 0;
    let opponentStrength = 0;
    
    // Calculate total effective strength (ATK + DEF + SPD/2)
    for (const card of playerCards) {
        playerStrength += card.currentATK + card.currentDEF + (card.currentSPD / 2);
    }
    
    for (const card of opponentCards) {
        opponentStrength += card.currentATK + card.currentDEF + (card.currentSPD / 2);
    }
    
    // Calculate normalized advantage (-1.0 to 1.0)
    const totalStrength = playerStrength + opponentStrength;
    if (totalStrength === 0) return 0;
    
    return (playerStrength - opponentStrength) / totalStrength;
}
```

### 3.2 Threat Assessment

```
function evaluateThreats(gameState, playerIndex) {
    const opponentIndex = 1 - playerIndex;
    const opponentCards = getPlayerCards(gameState, opponentIndex);
    const playerChampion = getChampion(gameState, playerIndex);
    
    let threatLevel = 0;
    
    // Calculate threat level based on potential damage to champion
    for (const card of opponentCards) {
        // Check if card can attack champion
        const canAttackChampion = canCardAttackChampion(card, gameState);
        
        if (canAttackChampion) {
            // Higher ATK = higher threat
            threatLevel += card.currentATK * 2;
        } else {
            // Can still break lanes
            threatLevel += card.currentATK * 0.5;
        }
        
        // Special abilities that target champion
        if (hasChampionTargetingAbility(card)) {
            threatLevel += 5;
        }
    }
    
    // Normalize threat level (0 to 1)
    return Math.min(1, threatLevel / 30);
}
```

### 3.3 Card Valuation

This algorithm dynamically evaluates cards based on game context:

```
function evaluateCardValue(card, gameState, playerIndex) {
    // Base value from stats
    let value = (card.currentATK * 1.0) + (card.currentDEF * 0.8) + (card.currentSPD * 0.6);
    
    // Context-specific modifiers
    const boardAnalysis = analyzeBoardState(gameState);
    
    // Adjust for current needs
    if (boardAnalysis.controlAdvantage < -0.2) {
        // We're behind, value defensive cards more
        if (card.class === CARD_CLASS.DEFENDER) {
            value *= 1.5;
        }
    } else if (boardAnalysis.controlAdvantage > 0.2) {
        // We're ahead, value offensive cards more
        if (hasHighAttack(card)) {
            value *= 1.3;
        }
    }
    
    // Lane health considerations
    const laneHealth = analyzeLaneHealth(gameState);
    if (laneHealth.playerLanes.some(hp => hp <= 2)) {
        // At risk of lane break, value lane-reinforcing cards
        if (hasLaneReinforcementAbility(card)) {
            value *= 1.8;
        }
    }
    
    // Check for counter cards
    const opponentCards = getPlayerCards(gameState, 1 - playerIndex);
    for (const opponentCard of opponentCards) {
        if (isEffectiveCounter(card, opponentCard)) {
            value *= 1.4;
        }
    }
    
    return value;
}
```

### 3.4 Positional Strategy

```
function determineBestPosition(card, gameState, playerIndex) {
    const emptyPositions = getEmptyPositions(gameState, playerIndex);
    if (emptyPositions.length === 0) return null;
    
    // Champion always goes in center
    if (card.type === CARD_TYPE.CHAMPION) {
        return 1; // Center position
    }
    
    // For other cards, evaluate each position
    const positionScores = [];
    
    for (const position of emptyPositions) {
        let score = 0;
        
        // Consider opposing card
        const opposingCard = getOpposingCard(gameState, playerIndex, position);
        if (opposingCard) {
            // Check if we win this matchup
            if (card.currentATK > opposingCard.currentATK) {
                score += 10;
            } else if (card.currentATK === opposingCard.currentATK) {
                score += 5;
            } else {
                score -= 5;
            }
            
            // Speed advantage
            if (card.currentSPD > opposingCard.currentSPD) {
                score += 5;
            }
        } else {
            // Empty opposing position means direct lane damage
            score += 3;
        }
        
        // Consider adjacency benefits
        const adjacentCards = getAdjacentCards(gameState, playerIndex, position);
        for (const adjacentCard of adjacentCards) {
            if (hasAdjacentBenefit(card, adjacentCard)) {
                score += 5;
            }
            
            // Defender protecting key cards
            if (card.class === CARD_CLASS.DEFENDER && isHighValueCard(adjacentCard)) {
                score += 8;
            }
        }
        
        // Lane priority
        const laneHealth = analyzeLaneHealth(gameState);
        const opponentLaneHealth = laneHealth.opponentLanes[position];
        
        // Prioritize attacking weak lanes
        if (opponentLaneHealth < 3) {
            score += (5 - opponentLaneHealth) * 3;
        }
        
        positionScores.push({ position, score });
    }
    
    // Return highest scored position
    positionScores.sort((a, b) => b.score - a.score);
    return positionScores[0].position;
}
```

## 4. Action Execution

### 4.1 Strategy Phase Decision Making

```
function executeStrategyPhase(gameState, difficulty) {
    const actions = [];
    
    // 1. Place cards
    const cardPlacementActions = planCardPlacements(gameState, difficulty);
    actions.push(...cardPlacementActions);
    
    // 2. Assign monster actions
    const monsterActionPlans = planMonsterActions(gameState, difficulty);
    actions.push(...monsterActionPlans);
    
    // 3. Use champion ability if appropriate
    const championAction = planChampionAction(gameState, difficulty);
    if (championAction) {
        actions.push(championAction);
    }
    
    return actions;
}

function planCardPlacements(gameState, difficulty) {
    const placementActions = [];
    const playableCards = getPlayableCards(gameState);
    
    // Sort cards by value
    const valuedCards = playableCards.map(card => ({
        card,
        value: evaluateCardValue(card, gameState, AI_PLAYER_INDEX)
    }));
    
    valuedCards.sort((a, b) => b.value - a.value);
    
    // Place highest value cards first
    for (const { card } of valuedCards) {
        const position = determineBestPosition(card, gameState, AI_PLAYER_INDEX);
        
        if (position !== null) {
            placementActions.push({
                type: ACTION_TYPE.PLACE_CARD,
                card: card,
                position: position,
                isSpell: card.type === CARD_TYPE.SPELL
            });
            
            // Update simulated game state to reflect this placement
            const simulatedState = deepCopy(gameState);
            applyCardPlacement(simulatedState, card, AI_PLAYER_INDEX, position);
            gameState = simulatedState;
        }
    }
    
    return placementActions;
}
```

### 4.2 Attack Target Prioritization

```
function planMonsterActions(gameState, difficulty) {
    const actions = [];
    const monsters = getPlayerMonsters(gameState, AI_PLAYER_INDEX);
    
    for (const monster of monsters) {
        // Skip if card can't act
        if (isStunned(monster) || !canTakeAction(monster)) {
            continue;
        }
        
        if (monster.class === CARD_CLASS.DEFENDER) {
            // Decide whether to attack or protect
            const shouldProtect = evaluateDefenderProtection(monster, gameState);
            
            if (shouldProtect && !monster.protectedLastTurn) {
                actions.push({
                    type: ACTION_TYPE.SELECT_PROTECT,
                    card: monster
                });
            } else {
                // Attack
                const target = selectBestAttackTarget(monster, gameState);
                if (target) {
                    actions.push({
                        type: ACTION_TYPE.SELECT_ATTACK,
                        attacker: monster,
                        target: target,
                        attackType: ATTACK_TYPE.VERTICAL
                    });
                }
            }
        } else if (monster.class === CARD_CLASS.PUMPER) {
            // Decide whether to attack or pump
            const shouldPump = evaluatePumperPump(monster, gameState);
            
            if (shouldPump) {
                actions.push({
                    type: ACTION_TYPE.SELECT_PUMP,
                    card: monster
                });
            } else {
                // Attack
                const target = selectBestAttackTarget(monster, gameState);
                if (target) {
                    actions.push({
                        type: ACTION_TYPE.SELECT_ATTACK,
                        attacker: monster,
                        target: target,
                        attackType: ATTACK_TYPE.VERTICAL
                    });
                }
            }
        } else if (monster.class === CARD_CLASS.ALL_ROUNDER) {
            // Select best attack target (vertical or diagonal)
            const { target, attackType } = selectBestAllRounderAttack(monster, gameState);
            
            if (target) {
                actions.push({
                    type: ACTION_TYPE.SELECT_ATTACK,
                    attacker: monster,
                    target: target,
                    attackType: attackType
                });
            }
        }
    }
    
    return actions;
}

function selectBestAttackTarget(monster, gameState) {
    const validTargets = getValidAttackTargets(monster, gameState);
    
    if (validTargets.length === 0) {
        return null;
    }
    
    // Score each target
    const scoredTargets = validTargets.map(target => ({
        target,
        score: evaluateAttackValue(monster, target, gameState)
    }));
    
    scoredTargets.sort((a, b) => b.score - a.score);
    return scoredTargets[0].target;
}

function evaluateAttackValue(attacker, target, gameState) {
    let score = 0;
    
    // Check if attack will destroy target
    if (target.type === "CARD") {
        const willDestroy = attacker.currentATK > target.currentDEF;
        
        if (willDestroy) {
            // Destroying cards is valuable
            score += 20;
            
            // Even more valuable for high-threat targets
            if (target.currentATK > 5) {
                score += 10;
            }
        } else {
            // Damage value
            const damage = Math.min(attacker.currentATK, target.currentDEF);
            score += damage;
        }
    } else if (target.type === "LANE") {
        // Direct lane damage
        score += 5 + attacker.currentATK;
        
        // Breaking a lane is very valuable
        const laneHP = getLaneHealth(gameState, 1 - attacker.position.player, target.position);
        if (attacker.currentATK >= laneHP) {
            score += 25;
            
            // Breaking center lane has extra value
            if (target.position === 1) {
                score += 15;
            }
        }
    }
    
    return score;
}
```

## 5. Testing and Configuration

### 5.1 AI Testing Utilities

```
function simulateAIGame(iterations = 100, aiSettings = AI_DIFFICULTY.MEDIUM) {
    const results = {
        aiWins: 0,
        playerWins: 0,
        draws: 0,
        turnCount: 0,
        aiDamageDealt: 0,
        playerDamageDealt: 0
    };
    
    for (let i = 0; i < iterations; i++) {
        const gameResult = runAIGame(aiSettings);
        
        // Record results
        if (gameResult.winner === AI_PLAYER_INDEX) {
            results.aiWins++;
        } else if (gameResult.winner === 1 - AI_PLAYER_INDEX) {
            results.playerWins++;
        } else {
            results.draws++;
        }
        
        results.turnCount += gameResult.turnCount;
        results.aiDamageDealt += gameResult.damageDealt[AI_PLAYER_INDEX];
        results.playerDamageDealt += gameResult.damageDealt[1 - AI_PLAYER_INDEX];
    }
    
    // Calculate averages
    results.averageTurnCount = results.turnCount / iterations;
    results.averageAIDamage = results.aiDamageDealt / iterations;
    results.averagePlayerDamage = results.playerDamageDealt / iterations;
    
    return results;
}
```

### 5.2 AI Configuration Options

The AI system can be configured for different testing scenarios:

```
const AI_CONFIG = {
    // Strategy weights
    STRATEGY_WEIGHTS: {
        AGGRESSIVE: {
            attackWeight: 0.7,
            defenseWeight: 0.3,
            laneWeight: 0.5,
            championWeight: 0.8
        },
        BALANCED: {
            attackWeight: 0.5,
            defenseWeight: 0.5,
            laneWeight: 0.5,
            championWeight: 0.6
        },
        DEFENSIVE: {
            attackWeight: 0.3,
            defenseWeight: 0.7,
            laneWeight: 0.6,
            championWeight: 0.4
        }
    },
    
    // Card evaluation settings
    CARD_EVALUATION: {
        ATK_WEIGHT: 1.0,
        DEF_WEIGHT: 0.8,
        SPD_WEIGHT: 0.6,
        ABILITY_WEIGHT: 1.2
    },
    
    // Decision making modifiers
    DECISION_MODIFIERS: {
        OPTIMAL_CHANCE: 0.8,     // Chance to make optimal play
        SUBOPTIMAL_RANGE: 0.3,   // How far from optimal is suboptimal
        RANDOM_FACTOR: 0.1       // Pure randomness factor
    }
};
```

The AI opponent logic provides a framework for testing the game's core mechanics in a local environment without requiring a human opponent. By adjusting difficulty settings, various scenarios can be simulated to validate game balance and mechanics implementation. 