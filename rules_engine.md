# TridimensionalDuels: Rule Enforcement System

## 1. Rule Enforcement Architecture

The rule enforcement system is responsible for ensuring that all game actions conform to the established rules of TridimensionalDuels. This system acts as a validation layer between player inputs and the game state manager.

### 1.1 Core Principles

1. **Complete Validation**: Every action is validated before execution
2. **Deterministic Enforcement**: Rules are applied consistently in all situations
3. **Separation of Concerns**: Validation logic is separate from game mechanics
4. **Contextual Awareness**: Rules consider the full game context

### 1.2 System Components

The rule enforcement system consists of:

1. **Rule Validators**: Specialized components that validate specific action types
2. **Constraint Checkers**: Validate game state invariants
3. **Action Pipeline**: Sequential processing of action validation and execution 
4. **Rule Exception Manager**: Handles rule-breaking special abilities

## 2. Action Validation Framework

### 2.1 Validation Pipeline

All actions pass through a standardized validation pipeline:

```
function validateAction(action, gameState) {
    // 1. Check if the action type is valid
    if (!isValidActionType(action.type)) {
        return { valid: false, reason: "INVALID_ACTION_TYPE" };
    }
    
    // 2. Check if the action is being performed at a valid time
    if (!isValidActionTiming(action, gameState)) {
        return { valid: false, reason: "INVALID_ACTION_TIMING" };
    }
    
    // 3. Check if the actor can perform this action
    if (!canActorPerformAction(action.actor, action, gameState)) {
        return { valid: false, reason: "ACTOR_CANNOT_PERFORM" };
    }
    
    // 4. Check if the action targets are valid
    if (!areTargetsValid(action.targets, action, gameState)) {
        return { valid: false, reason: "INVALID_TARGETS" };
    }
    
    // 5. Check action-specific rules
    const specificValidation = validateSpecificAction(action, gameState);
    if (!specificValidation.valid) {
        return specificValidation;
    }
    
    // 6. Check for rule-breaking special abilities
    const exceptions = checkRuleExceptions(action, gameState);
    if (exceptions.overridesRules) {
        return { valid: true, exceptionApplied: true };
    }
    
    // Action is valid
    return { valid: true };
}
```

### 2.2 Action Type Validators

Each action type has specific validation logic:

#### Card Placement Validation

```
function validateCardPlacement(action, gameState) {
    const { card, player, position, isSpell } = action;
    
    // Validate player
    if (player !== gameState.activePlayerIndex) {
        return { valid: false, reason: "NOT_ACTIVE_PLAYER" };
    }
    
    // Validate phase
    if (gameState.phase !== PHASE.STRATEGY) {
        return { valid: false, reason: "WRONG_PHASE" };
    }
    
    // Check if position is valid
    if (position < 0 || position > 2) {
        return { valid: false, reason: "INVALID_POSITION" };
    }
    
    // Check if position is empty
    const targetGrid = isSpell ? gameState.board.spellGrid : gameState.board.grid;
    if (targetGrid[player][position] !== null) {
        return { valid: false, reason: "POSITION_OCCUPIED" };
    }
    
    // Champion-specific rules
    if (card.type === CARD_TYPE.CHAMPION && position !== 1) {
        return { valid: false, reason: "CHAMPION_MUST_BE_CENTER" };
    }
    
    // Check if card is in hand
    if (!isCardInHand(card, player, gameState)) {
        return { valid: false, reason: "CARD_NOT_IN_HAND" };
    }
    
    return { valid: true };
}
```

#### Attack Action Validation

```
function validateAttackAction(action, gameState) {
    const { attacker, target, attackType } = action;
    
    // Validate attacker can attack
    if (!canCardAttack(attacker, gameState)) {
        return { valid: false, reason: "CANNOT_ATTACK" };
    }
    
    // Validate attack type is supported by attacker
    if (!supportsAttackType(attacker, attackType)) {
        return { valid: false, reason: "UNSUPPORTED_ATTACK_TYPE" };
    }
    
    // Validate attack pattern
    if (!isValidAttackPattern(attacker, target, attackType)) {
        return { valid: false, reason: "INVALID_ATTACK_PATTERN" };
    }
    
    // Validate champion attack rules
    if (target.type === CARD_TYPE.CHAMPION) {
        if (!canAttackChampion(attacker, gameState)) {
            return { valid: false, reason: "CANNOT_ATTACK_CHAMPION" };
        }
    }
    
    return { valid: true };
}

function supportsAttackType(card, attackType) {
    switch (attackType) {
        case ATTACK_TYPE.VERTICAL:
            return true; // All cards can attack vertically
            
        case ATTACK_TYPE.DIAGONAL:
            return card.class === CARD_CLASS.ALL_ROUNDER; // Only All-Rounders can attack diagonally
            
        default:
            return false;
    }
}

function isValidAttackPattern(attacker, target, attackType) {
    const attackerPos = attacker.position;
    const targetPos = target.position;
    
    switch (attackType) {
        case ATTACK_TYPE.VERTICAL:
            // Must be in same column
            return attackerPos.column === targetPos.column;
            
        case ATTACK_TYPE.DIAGONAL:
            // Must be in adjacent column
            return Math.abs(attackerPos.column - targetPos.column) === 1;
            
        default:
            return false;
    }
}

function canAttackChampion(attacker, gameState) {
    // Get opponent player index
    const opponentIndex = 1 - attacker.position.player;
    
    // Check if at least one side lane is broken
    const leftLaneHP = gameState.lanes[opponentIndex][0];
    const rightLaneHP = gameState.lanes[opponentIndex][2];
    
    if (leftLaneHP <= 0 || rightLaneHP <= 0) {
        return true;
    }
    
    // Check for special abilities that bypass lane restrictions
    return hasChampionBypassAbility(attacker);
}
```

#### Protection Action Validation

```
function validateProtectionAction(action, gameState) {
    const { card } = action;
    
    // Only Defenders can use protection
    if (card.class !== CARD_CLASS.DEFENDER) {
        return { valid: false, reason: "NOT_A_DEFENDER" };
    }
    
    // Cannot protect in consecutive turns
    if (card.protectedLastTurn) {
        return { valid: false, reason: "PROTECTION_ON_COOLDOWN" };
    }
    
    return { valid: true };
}
```

#### Pump Action Validation

```
function validatePumpAction(action, gameState) {
    const { card } = action;
    
    // Only Pumpers can use pump
    if (card.class !== CARD_CLASS.PUMPER) {
        return { valid: false, reason: "NOT_A_PUMPER" };
    }
    
    return { valid: true };
}
```

## 3. Rule Constraints and Invariants

### 3.1 Global Game Constraints

These constraints must always be maintained:

1. **Champion Position**: Champions must always be in the center position (index 1)
2. **One Action Per Card**: Each monster can only take one action per turn
3. **Turn Sequence**: Game phases must follow the defined progression
4. **Card Uniqueness**: Each card instance must exist in exactly one place

### 3.2 Invariant Validators

```
function validateGameInvariants(gameState) {
    const errors = [];
    
    // Check champion positions
    const player1Champion = findChampion(gameState, 0);
    const player2Champion = findChampion(gameState, 1);
    
    if (player1Champion && player1Champion.position.column !== 1) {
        errors.push("Player 1 Champion not in center");
    }
    
    if (player2Champion && player2Champion.position.column !== 1) {
        errors.push("Player 2 Champion not in center");
    }
    
    // Check card uniqueness (no duplicates)
    const cardLocations = new Map();
    
    // Check board
    for (let player = 0; player < 2; player++) {
        for (let pos = 0; pos < 3; pos++) {
            checkCardUniqueness(gameState.board.grid[player][pos], "board", cardLocations, errors);
            checkCardUniqueness(gameState.board.spellGrid[player][pos], "spellGrid", cardLocations, errors);
        }
    }
    
    // Check hands
    for (let player = 0; player < 2; player++) {
        for (let i = 0; i < gameState.hands[player].length; i++) {
            checkCardUniqueness(gameState.hands[player][i], "hand", cardLocations, errors);
        }
    }
    
    // Check decks
    for (let player = 0; player < 2; player++) {
        for (let i = 0; i < gameState.decks[player].length; i++) {
            checkCardUniqueness(gameState.decks[player][i], "deck", cardLocations, errors);
        }
    }
    
    return {
        valid: errors.length === 0,
        errors: errors
    };
}

function checkCardUniqueness(card, location, cardLocations, errors) {
    if (!card) return;
    
    if (cardLocations.has(card.id)) {
        errors.push(`Card ${card.id} exists in multiple locations: ${cardLocations.get(card.id)} and ${location}`);
    } else {
        cardLocations.set(card.id, location);
    }
}
```

### 3.3 Rule Exceptions

Some card abilities may explicitly break normal rules. These are handled by the exception system:

```
function checkRuleExceptions(action, gameState) {
    const { actor, actionType } = action;
    const exceptions = [];
    
    // Check for special abilities that override rules
    if (actor.abilities) {
        for (const ability of actor.abilities) {
            if (ability.type === "RULE_OVERRIDE" && ability.affectsAction === actionType) {
                exceptions.push(ability);
            }
        }
    }
    
    // Check for status effects that override rules
    for (const effect of actor.statusEffects) {
        if (effect.type === "RULE_OVERRIDE" && effect.affectsAction === actionType) {
            exceptions.push(effect);
        }
    }
    
    return {
        overridesRules: exceptions.length > 0,
        exceptions: exceptions
    };
}
```

## 4. Turn Structure Enforcement

### 4.1 Phase Transition Rules

```
function canTransitionToPhase(currentPhase, targetPhase, gameState) {
    switch (currentPhase) {
        case PHASE.DRAW:
            return targetPhase === PHASE.STRATEGY;
            
        case PHASE.STRATEGY:
            return targetPhase === PHASE.BATTLE;
            
        case PHASE.BATTLE:
            return targetPhase === PHASE.END;
            
        case PHASE.END:
            return targetPhase === PHASE.DRAW;
            
        default:
            return false;
    }
}
```

### 4.2 Phase-Specific Action Validation

```
function isActionAllowedInPhase(action, phase) {
    switch (action.type) {
        case ACTION_TYPE.DRAW_CARD:
            return phase === PHASE.DRAW;
            
        case ACTION_TYPE.PLACE_CARD:
        case ACTION_TYPE.SELECT_ATTACK:
        case ACTION_TYPE.SELECT_PROTECT:
        case ACTION_TYPE.SELECT_PUMP:
            return phase === PHASE.STRATEGY;
            
        case ACTION_TYPE.USE_CHAMPION_ABILITY:
            // Some champion abilities can be used in specific phases only
            return action.ability.allowedPhases.includes(phase);
            
        default:
            return false;
    }
}
```

## 5. Decision Point Validation

### 5.1 Valid Target Determination

```
function getValidTargets(action, gameState) {
    const { actor, actionType } = action;
    const validTargets = [];
    
    switch (actionType) {
        case ACTION_TYPE.SELECT_ATTACK:
            // Get valid attack targets based on card class and position
            if (actor.class === CARD_CLASS.ALL_ROUNDER) {
                // Can attack vertically and diagonally
                validTargets.push(...getVerticalTargets(actor, gameState));
                validTargets.push(...getDiagonalTargets(actor, gameState));
            } else {
                // Can only attack vertically
                validTargets.push(...getVerticalTargets(actor, gameState));
            }
            
            // Filter targets based on champion attack rules
            return validTargets.filter(target => {
                if (target.type !== CARD_TYPE.CHAMPION) {
                    return true;
                }
                return canAttackChampion(actor, gameState);
            });
            
        case ACTION_TYPE.PLACE_CARD:
            // Get valid placement positions
            if (actor.type === CARD_TYPE.CHAMPION) {
                // Champion can only be placed in center
                return [{ player: gameState.activePlayerIndex, position: 1 }];
            } else if (actor.type === CARD_TYPE.MONSTER) {
                // Monsters can be placed in empty front row positions
                const positions = [];
                for (let i = 0; i < 3; i++) {
                    if (gameState.board.grid[gameState.activePlayerIndex][i] === null) {
                        positions.push({ player: gameState.activePlayerIndex, position: i });
                    }
                }
                return positions;
            } else if (actor.type === CARD_TYPE.SPELL) {
                // Spells can be placed in empty back row positions
                const positions = [];
                for (let i = 0; i < 3; i++) {
                    if (gameState.board.spellGrid[gameState.activePlayerIndex][i] === null) {
                        positions.push({ player: gameState.activePlayerIndex, position: i });
                    }
                }
                return positions;
            }
            break;
            
        // Other action types...
    }
    
    return validTargets;
}

function getVerticalTargets(card, gameState) {
    const targets = [];
    const opposingPlayer = 1 - card.position.player;
    const opposingColumn = card.position.column;
    
    // Check if there's a card in the opposing position
    const opposingCard = gameState.board.grid[opposingPlayer][opposingColumn];
    if (opposingCard) {
        targets.push(opposingCard);
    } else {
        // Target the lane directly
        targets.push({ type: "LANE", player: opposingPlayer, position: opposingColumn });
    }
    
    return targets;
}

function getDiagonalTargets(card, gameState) {
    const targets = [];
    const opposingPlayer = 1 - card.position.player;
    const column = card.position.column;
    
    // Check left diagonal if not leftmost column
    if (column > 0) {
        const leftDiagonal = gameState.board.grid[opposingPlayer][column - 1];
        if (leftDiagonal) {
            targets.push(leftDiagonal);
        } else {
            targets.push({ type: "LANE", player: opposingPlayer, position: column - 1 });
        }
    }
    
    // Check right diagonal if not rightmost column
    if (column < 2) {
        const rightDiagonal = gameState.board.grid[opposingPlayer][column + 1];
        if (rightDiagonal) {
            targets.push(rightDiagonal);
        } else {
            targets.push({ type: "LANE", player: opposingPlayer, position: column + 1 });
        }
    }
    
    return targets;
}
```

### 5.2 Decision Tree Validation

For complex decision points involving multiple steps:

```
function validateDecisionSequence(decisions, gameState) {
    let currentState = deepCopy(gameState);
    
    for (const decision of decisions) {
        // Validate decision against current state
        const validation = validateAction(decision, currentState);
        
        if (!validation.valid) {
            return {
                valid: false,
                failedDecision: decision,
                reason: validation.reason
            };
        }
        
        // Apply decision to current state
        applyDecisionToState(decision, currentState);
    }
    
    return { valid: true };
}
```

## 6. Special Case Rules

### 6.1 Champion Rules

```
function validateChampionRules(gameState) {
    // Each player must have exactly one Champion
    for (let player = 0; player < 2; player++) {
        const champions = findAllChampions(gameState, player);
        
        if (champions.length !== 1) {
            return {
                valid: false,
                reason: `Player ${player} has ${champions.length} Champions (must have exactly 1)`
            };
        }
        
        // Champion must be in center position
        const champion = champions[0];
        if (champion.position.column !== 1) {
            return {
                valid: false,
                reason: `Player ${player}'s Champion is not in center position`
            };
        }
    }
    
    return { valid: true };
}
```

### 6.2 Lane Breaking Rules

```
function validateLaneAttack(attacker, targetLane, gameState) {
    const opponentIndex = 1 - attacker.position.player;
    const targetPosition = targetLane.position;
    
    // Check if attacking a Champion lane
    if (targetPosition === 1) {
        // Verify at least one side lane is broken
        const leftLaneHP = gameState.lanes[opponentIndex][0];
        const rightLaneHP = gameState.lanes[opponentIndex][2];
        
        if (leftLaneHP > 0 && rightLaneHP > 0) {
            // Special ability check
            if (!hasChampionBypassAbility(attacker)) {
                return {
                    valid: false,
                    reason: "CANNOT_ATTACK_CHAMPION_LANE"
                };
            }
        }
    }
    
    return { valid: true };
}
```

## 7. Implementation Guidelines

### 7.1 Rule Enforcement Integration

To integrate the rule system with the game logic:

```
// In the game loop
function handlePlayerAction(action, gameState) {
    // 1. Validate the action
    const validation = validateAction(action, gameState);
    
    if (!validation.valid) {
        return {
            success: false,
            error: validation.reason
        };
    }
    
    // 2. Apply the action to the game state
    applyActionToGameState(action, gameState);
    
    // 3. Validate invariants after action
    const invariantCheck = validateGameInvariants(gameState);
    
    if (!invariantCheck.valid) {
        // Critical error - state is invalid after action
        restoreGameState();
        return {
            success: false,
            error: "CRITICAL_ERROR",
            details: invariantCheck.errors
        };
    }
    
    return { success: true };
}
```

### 7.2 Validation Error Handling

```
function handleValidationError(error, action, gameState) {
    // Log the error
    logValidationError(error, action, gameState);
    
    // Depending on error severity
    if (isRecoverableError(error)) {
        // Provide feedback and allow retry
        return {
            type: "RETRY",
            message: getErrorMessage(error)
        };
    } else {
        // Critical error
        return {
            type: "CRITICAL",
            message: "A critical error has occurred"
        };
    }
}
```

This rule enforcement system ensures that all actions follow the established rules of TridimensionalDuels, maintaining game integrity and providing clear validation messages when rules are broken. 