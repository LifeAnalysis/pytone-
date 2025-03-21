# TridimensionalDuels: Game State Management System

## 1. State Management Architecture

The game state management system is responsible for tracking and transitioning between different game states, maintaining data integrity, and providing a consistent view of the game to all systems.

### 1.1 Core State Components

The game state is composed of several interconnected components:

1. **Board State**: Current positions and conditions of all cards
2. **Player States**: Hand, deck, and discard pile for both players
3. **Card States**: Current stats, effects, and conditions of all cards
4. **Lane States**: Remaining life points for each lane
5. **Turn State**: Current phase, active player, and turn count
6. **Effect Queue**: Pending and active effects to be resolved

### 1.2 State Access Patterns

The state system uses a controlled access pattern:
- Read-only access for most systems
- Write access through state mutations
- Transaction-based state changes for atomic operations

## 2. Game State Lifecycle

### 2.1 State Initialization

```
function initializeGameState(player1, player2):
    state = new GameState()
    
    // Initialize players
    state.players = [player1, player2]
    
    // Initialize board
    state.board = createEmptyBoard()
    
    // Initialize lanes (5 HP for side lanes)
    state.lanes = [
        [5, null, 5],  // Player 1 lanes
        [5, null, 5]   // Player 2 lanes
    ]
    
    // Initialize decks and shuffle
    state.decks = [
        shuffle(player1.deck),
        shuffle(player2.deck)
    ]
    
    // Draw initial hands (5 monsters + Champion)
    state.hands = [[], []]
    drawInitialHands(state)
    
    // Place Champions automatically
    placeChampions(state)
    
    // Initialize Champion lane HP
    state.lanes[0][1] = state.board[0][1].DEF  // Player 1 Champion lane
    state.lanes[1][1] = state.board[1][1].DEF  // Player 2 Champion lane
    
    // Set starting player
    state.activePlayerIndex = determineFirstPlayer()
    
    // Initialize turn and phase
    state.turn = 1
    state.phase = PHASE.DRAW
    
    return state
```

### 2.2 Turn Cycle State Management

The state transitions through phases in a deterministic sequence:

1. **Draw Phase**:
   - activePlayer draws a card
   - Check for deck-out condition

2. **Strategy Phase**:
   - Start 30-second timer
   - Allow card placement and action selection
   - Buffer all actions until Battle Phase

3. **Battle Phase**:
   - Process all queued spell activations
   - Process all queued attacks in SPD order
   - Apply damage and resolve effects

4. **End Phase**:
   - Clean up temporary effects
   - Check win conditions
   - Transition to next turn

### 2.3 State Transitions

```
function advanceGamePhase(state):
    switch(state.phase):
        case PHASE.DRAW:
            state.phase = PHASE.STRATEGY
            startStrategyTimer(30)  // 30 seconds
            break
            
        case PHASE.STRATEGY:
            state.phase = PHASE.BATTLE
            processQueuedActions(state)
            break
            
        case PHASE.BATTLE:
            state.phase = PHASE.END
            cleanupPhaseEffects(state)
            checkWinConditions(state)
            break
            
        case PHASE.END:
            state.activePlayerIndex = 1 - state.activePlayerIndex  // Toggle player
            state.turn++
            state.phase = PHASE.DRAW
            break
```

## 3. State Tracking Systems

### 3.1 Card State Tracking

Each card maintains multiple state attributes:

1. **Base Stats**: Original ATK/DEF/SPD values
2. **Current Stats**: Modified by effects
3. **Position**: Current board coordinates or null
4. **Status Effects**: Active effects and durations
5. **Action State**: Selected action for current turn
6. **Protection State**: Whether protection is active
7. **Cooldown Tracking**: Turns until abilities are available

```
class CardState {
    // Base attributes
    id;
    name;
    type;
    baseATK;
    baseDEF;
    baseSPD;
    
    // Current attributes (modified by effects)
    currentATK;
    currentDEF;
    currentSPD;
    
    // State tracking
    position;               // {player, row, column} or null
    statusEffects = [];     // Array of {type, duration, magnitude}
    selectedAction = null;  // Action for current turn
    isProtecting = false;   // Protection state
    protectedLastTurn = false; // For cooldown tracking
    
    // Method to apply stat modifications
    applyStatEffects() {
        // Reset to base stats
        this.currentATK = this.baseATK;
        this.currentDEF = this.baseDEF;
        this.currentSPD = this.baseSPD;
        
        // Apply all active effects
        for (effect of this.statusEffects) {
            if (effect.type === "ATK_BOOST") this.currentATK += effect.magnitude;
            if (effect.type === "DEF_BOOST") this.currentDEF += effect.magnitude;
            if (effect.type === "SPD_BOOST") this.currentSPD += effect.magnitude;
            // etc.
        }
    }
}
```

### 3.2 Board State Representation

```
class BoardState {
    // 2D grid of card references
    // [player][position]
    grid = [
        [null, null, null],  // Player 1 monsters
        [null, null, null],  // Player 2 monsters
    ];
    
    // 2D grid for spell positions
    spellGrid = [
        [null, null, null],  // Player 1 spells
        [null, null, null],  // Player 2 spells
    ];
    
    placeCard(card, player, position, isSpell) {
        const targetGrid = isSpell ? this.spellGrid : this.grid;
        
        // Check if position is valid and empty
        if (position < 0 || position > 2 || targetGrid[player][position] !== null) {
            return false;
        }
        
        // Place the card
        targetGrid[player][position] = card;
        card.position = {player, row: isSpell ? 1 : 0, column: position};
        return true;
    }
    
    removeCard(player, position, isSpell) {
        const targetGrid = isSpell ? this.spellGrid : this.grid;
        const card = targetGrid[player][position];
        
        if (card) {
            targetGrid[player][position] = null;
            card.position = null;
            return card;
        }
        
        return null;
    }
}
```

### 3.3 Effect Management

```
class EffectManager {
    // Queued effects waiting to be applied
    pendingEffects = [];
    
    // Effects currently in effect
    activeEffects = [];
    
    // Queue an effect to be applied
    queueEffect(effect) {
        this.pendingEffects.push(effect);
    }
    
    // Process all pending effects
    processEffects(state) {
        // Sort by priority
        this.pendingEffects.sort((a, b) => b.priority - a.priority);
        
        for (effect of this.pendingEffects) {
            applyEffect(effect, state);
            
            if (effect.duration > 0) {
                this.activeEffects.push(effect);
            }
        }
        
        this.pendingEffects = [];
    }
    
    // Update effect durations at end of turn
    updateEffectDurations() {
        for (let i = this.activeEffects.length - 1; i >= 0; i--) {
            this.activeEffects[i].duration--;
            
            if (this.activeEffects[i].duration <= 0) {
                const effect = this.activeEffects[i];
                removeEffect(effect);
                this.activeEffects.splice(i, 1);
            }
        }
    }
}
```

## 4. State Validation and Integrity

### 4.1 State Validation Rules

1. **Card Position Validation**
   - Champions must always be in center position
   - Each position can contain at most one card
   - Cards can only be placed in legal positions

2. **Action Validation**
   - Each monster can perform only one action per turn
   - Actions must be legal for the card's class
   - Protection can't be used in consecutive turns

3. **Attack Pattern Validation**
   - Vertical attacks must target the corresponding column
   - Diagonal attacks must target adjacent columns
   - Champion attacks must obey lane breaking rules

### 4.2 State Consistency Checks

The system periodically performs integrity checks:

```
function validateGameState(state) {
    // Check board consistency
    validateBoardPositions(state);
    
    // Check lane health consistency
    validateLaneHealth(state);
    
    // Verify card stats integrity
    validateCardStats(state);
    
    // Validate effect consistency
    validateEffects(state);
    
    // Verify turn state validity
    validateTurnState(state);
}
```

## 5. State Serialization and History

### 5.1 State Serialization

The complete game state can be serialized to enable:
- Game saving and loading
- Replay functionality
- State verification between clients

```
function serializeGameState(state) {
    return {
        turn: state.turn,
        phase: state.phase,
        activePlayerIndex: state.activePlayerIndex,
        board: serializeBoard(state.board),
        hands: serializeHands(state.hands),
        decks: serializeDeckCounts(state.decks),
        discardPiles: serializeDiscardPiles(state.discardPiles),
        lanes: state.lanes,
        effectQueue: serializeEffects(state.effectManager)
    };
}
```

### 5.2 Turn History Tracking

The system maintains a limited history of previous game states:

```
class GameHistory {
    // Last X turns stored for replay/verification
    turnStates = [];
    maxHistoryLength = 5;
    
    recordTurnState(state) {
        const turnSnapshot = deepCopy(state);
        this.turnStates.push(turnSnapshot);
        
        // Maintain max history length
        if (this.turnStates.length > this.maxHistoryLength) {
            this.turnStates.shift();
        }
    }
    
    // Get specific turn state
    getTurnState(index) {
        if (index < 0 || index >= this.turnStates.length) {
            return null;
        }
        return this.turnStates[index];
    }
    
    // Useful for replaying a sequence of actions
    getActionHistory() {
        return this.turnStates.map(state => state.actions);
    }
}
```

## 6. State Reset and Error Recovery

### 6.1 State Reset Functionality

In case of serious errors, the system can perform partial or complete resets:

```
function resetToLastValidState(state, gameHistory) {
    // Get last known valid state
    const lastValid = gameHistory.getTurnState(gameHistory.turnStates.length - 1);
    
    if (lastValid) {
        // Copy valid properties
        state.board = deepCopy(lastValid.board);
        state.hands = deepCopy(lastValid.hands);
        state.lanes = deepCopy(lastValid.lanes);
        // etc.
        
        return true;
    }
    
    return false;  // No valid state available
}
```

### 6.2 Inconsistency Resolution

For minor inconsistencies, the system applies automatic fixes:

1. **Card Stat Correction**: Reset to base values + valid modifiers
2. **Position Correction**: Restore cards to legal positions
3. **Lane Health Recalculation**: Recalculate based on remaining cards and damage history

```
function resolveCardStatInconsistency(card) {
    // Reset to base stats
    card.currentATK = card.baseATK;
    card.currentDEF = card.baseDEF;
    card.currentSPD = card.baseSPD;
    
    // Reapply only validated effects
    for (effect of card.statusEffects) {
        if (validateEffect(effect)) {
            applyCardEffect(card, effect);
        } else {
            removeInvalidEffect(card, effect);
        }
    }
}
```

This comprehensive state management system ensures the game maintains consistency throughout all phases of play, properly tracks all relevant information, and handles edge cases gracefully. 