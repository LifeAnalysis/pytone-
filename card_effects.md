# TridimensionalDuels: Effect System

## 1. Effect System Architecture

The effect system manages all temporary and permanent modifications to game objects, handling how abilities, spells, and status effects alter the game state. It provides a consistent framework for applying, tracking, and removing effects.

### 1.1 Effect Types

The system supports several fundamental effect types:

1. **Stat Modifiers**: Alter ATK/DEF/SPD values of cards
2. **Status Effects**: Apply conditions like Stun, Freeze, etc.
3. **Trigger Effects**: Execute actions based on game events
4. **Persistent Effects**: Provide ongoing modifications
5. **One-Time Effects**: Execute a single action

### 1.2 Effect Properties

Each effect contains these core properties:

```
class Effect {
    id;                 // Unique identifier
    type;               // Effect type (STAT_MODIFIER, STATUS, etc.)
    source;             // Card/ability that created the effect
    targets;            // Cards/lanes affected by the effect
    duration;           // Turns remaining (null = permanent)
    magnitude;          // Effect strength value
    priority;           // Resolution order (higher = earlier)
    triggers;           // Events that activate this effect
    conditions;         // Conditions for effect to apply
    applyFunction;      // Function to execute when applied
    removeFunction;     // Function to execute when removed
    stackable;          // Whether effect stacks with similar effects
    metadata;           // Additional effect-specific data
}
```

## 2. Effect Application Pipeline

### 2.1 Effect Creation

Effects are created through these primary pathways:

1. **Card Abilities**: Inherent effects of monster cards
2. **Spell Cards**: One-time effects played from hand
3. **Champion Abilities**: Special effects from champion cards
4. **Reaction Effects**: Generated in response to game events

```
function createEffect(source, type, params) {
    const effect = new Effect();
    
    effect.id = generateUniqueId();
    effect.source = source;
    effect.type = type;
    
    // Set basic properties
    effect.targets = params.targets || [];
    effect.duration = params.duration || null;
    effect.magnitude = params.magnitude || 1;
    effect.priority = params.priority || calculateDefaultPriority(type);
    
    // Set callbacks
    effect.applyFunction = params.applyFunction;
    effect.removeFunction = params.removeFunction;
    effect.conditions = params.conditions || (() => true);
    
    // Set metadata
    effect.metadata = params.metadata || {};
    effect.stackable = params.stackable !== undefined ? params.stackable : true;
    
    return effect;
}
```

### 2.2 Effect Resolution Order

Effects resolve in a specific order:

1. **Priority-Based**: Higher priority effects resolve first
2. **Type-Based**: Different effect types have base priorities:
   - Prevention Effects (Priority 100)
   - Replacement Effects (Priority 80)
   - Trigger Effects (Priority 60)
   - Stat Modifiers (Priority 40)
   - Status Effects (Priority 20)

```
function resolveEffects(effects, gameState) {
    // Sort by priority
    const sortedEffects = [...effects].sort((a, b) => b.priority - a.priority);
    
    // Apply each effect in order
    for (const effect of sortedEffects) {
        // Check if effect conditions are met
        if (effect.conditions(gameState)) {
            // Apply the effect
            effect.applyFunction(effect, gameState);
            
            // For duration-based effects, add to active effects
            if (effect.duration !== 0) {
                gameState.effectManager.activeEffects.push(effect);
            }
        }
    }
}
```

### 2.3 Effect Stacking Rules

When multiple similar effects target the same object:

```
function applyStackingRules(newEffect, existingEffects) {
    // Find similar effects on the same targets
    const similarEffects = existingEffects.filter(e => 
        e.type === newEffect.type && 
        hasOverlappingTargets(e.targets, newEffect.targets)
    );
    
    if (similarEffects.length === 0 || newEffect.stackable) {
        // No similar effects or effect is stackable
        return newEffect;
    }
    
    // Handle non-stackable effects
    switch (newEffect.type) {
        case EFFECT_TYPE.STAT_MODIFIER:
            // Take highest value for same stat modifiers
            return handleStatModifierStacking(newEffect, similarEffects);
            
        case EFFECT_TYPE.STATUS:
            // For status effects, generally use the longer duration
            return handleStatusEffectStacking(newEffect, similarEffects);
            
        default:
            // Default behavior - replace if higher magnitude
            if (newEffect.magnitude > Math.max(...similarEffects.map(e => e.magnitude))) {
                // Remove similar effects
                return {
                    effectToAdd: newEffect,
                    effectsToRemove: similarEffects
                };
            } else {
                // Discard new effect
                return {
                    effectToAdd: null,
                    effectsToRemove: []
                };
            }
    }
}
```

## 3. Stat Modification System

### 3.1 Stat Modifier Implementation

```
function createStatModifier(source, stat, value, targets, duration = 1) {
    return createEffect(source, EFFECT_TYPE.STAT_MODIFIER, {
        targets: targets,
        duration: duration,
        magnitude: value,
        metadata: { stat: stat },
        applyFunction: applyStatModifier,
        removeFunction: removeStatModifier,
        stackable: true  // Stat modifiers typically stack
    });
}

function applyStatModifier(effect, gameState) {
    const { targets, magnitude, metadata } = effect;
    const { stat } = metadata;
    
    for (const target of targets) {
        if (isCard(target)) {
            // Track the original value for removal
            if (!effect.metadata.originalValues) {
                effect.metadata.originalValues = new Map();
                effect.metadata.originalValues.set(target.id, target[`current${stat}`]);
            }
            
            // Apply the modification
            target[`current${stat}`] += magnitude;
            
            // Ensure stats don't go below 0
            target[`current${stat}`] = Math.max(0, target[`current${stat}`]);
        }
    }
}

function removeStatModifier(effect, gameState) {
    const { targets, magnitude, metadata } = effect;
    const { stat, originalValues } = metadata;
    
    for (const target of targets) {
        if (isCard(target) && originalValues && originalValues.has(target.id)) {
            // Restore original value
            target[`current${stat}`] = originalValues.get(target.id);
        } else if (isCard(target)) {
            // Reverse the modification
            target[`current${stat}`] -= magnitude;
            
            // Ensure stats don't go below 0
            target[`current${stat}`] = Math.max(0, target[`current${stat}`]);
        }
    }
}
```

### 3.2 Calculating Final Stats

Card stats are calculated by applying all active modifiers:

```
function calculateCardStats(card, gameState) {
    // Start with base values
    card.currentATK = card.baseATK;
    card.currentDEF = card.baseDEF;
    card.currentSPD = card.baseSPD;
    
    // Get all effects that target this card
    const effects = gameState.effectManager.activeEffects.filter(e => 
        e.targets.includes(card) && e.type === EFFECT_TYPE.STAT_MODIFIER
    );
    
    // Apply effects in priority order
    const sortedEffects = [...effects].sort((a, b) => b.priority - a.priority);
    
    for (const effect of sortedEffects) {
        const { magnitude, metadata } = effect;
        const { stat } = metadata;
        
        // Apply the modification
        card[`current${stat}`] += magnitude;
    }
    
    // Ensure stats don't go below 0
    card.currentATK = Math.max(0, card.currentATK);
    card.currentDEF = Math.max(0, card.currentDEF);
    card.currentSPD = Math.max(0, card.currentSPD);
    
    return {
        ATK: card.currentATK,
        DEF: card.currentDEF,
        SPD: card.currentSPD
    };
}
```

## 4. Status Effect System

### 4.1 Common Status Effects

```
const STATUS_EFFECTS = {
    STUN: {
        name: "Stun",
        description: "Prevents the card from taking actions",
        applyFunction: (effect, gameState) => {
            for (const target of effect.targets) {
                target.statusEffects.push("STUNNED");
            }
        },
        removeFunction: (effect, gameState) => {
            for (const target of effect.targets) {
                const index = target.statusEffects.indexOf("STUNNED");
                if (index !== -1) {
                    target.statusEffects.splice(index, 1);
                }
            }
        }
    },
    
    FREEZE: {
        name: "Freeze",
        description: "Reduces DEF by 50% (rounded down)",
        applyFunction: (effect, gameState) => {
            for (const target of effect.targets) {
                if (!effect.metadata.originalValues) {
                    effect.metadata.originalValues = new Map();
                    effect.metadata.originalValues.set(target.id, target.currentDEF);
                }
                
                // Apply freeze (reduce DEF by 50%)
                target.currentDEF = Math.floor(target.currentDEF * 0.5);
                target.statusEffects.push("FROZEN");
            }
        },
        removeFunction: (effect, gameState) => {
            for (const target of effect.targets) {
                // Restore original DEF
                if (effect.metadata.originalValues && effect.metadata.originalValues.has(target.id)) {
                    target.currentDEF = effect.metadata.originalValues.get(target.id);
                }
                
                // Remove status flag
                const index = target.statusEffects.indexOf("FROZEN");
                if (index !== -1) {
                    target.statusEffects.splice(index, 1);
                }
            }
        }
    },
    
    BURN: {
        name: "Burn",
        description: "Deals 1 damage at the end of each turn",
        applyFunction: (effect, gameState) => {
            for (const target of effect.targets) {
                target.statusEffects.push("BURNING");
            }
        },
        removeFunction: (effect, gameState) => {
            for (const target of effect.targets) {
                const index = target.statusEffects.indexOf("BURNING");
                if (index !== -1) {
                    target.statusEffects.splice(index, 1);
                }
            }
        },
        endOfTurnFunction: (effect, gameState) => {
            for (const target of effect.targets) {
                if (target.statusEffects.includes("BURNING")) {
                    // Apply 1 damage
                    target.currentDEF -= 1;
                    
                    // Check if card is destroyed
                    if (target.currentDEF <= 0) {
                        destroyCard(target, gameState);
                    }
                }
            }
        }
    },
    
    POISON: {
        name: "Poison",
        description: "Deals increasing damage (1, then 2, then 3) over consecutive turns",
        applyFunction: (effect, gameState) => {
            for (const target of effect.targets) {
                target.statusEffects.push("POISONED");
                
                // Initialize poison counter if needed
                if (!target.metadata) target.metadata = {};
                target.metadata.poisonCounter = 1;
            }
        },
        removeFunction: (effect, gameState) => {
            for (const target of effect.targets) {
                const index = target.statusEffects.indexOf("POISONED");
                if (index !== -1) {
                    target.statusEffects.splice(index, 1);
                }
                
                // Clear poison counter
                if (target.metadata) {
                    delete target.metadata.poisonCounter;
                }
            }
        },
        endOfTurnFunction: (effect, gameState) => {
            for (const target of effect.targets) {
                if (target.statusEffects.includes("POISONED") && target.metadata && target.metadata.poisonCounter) {
                    // Apply poison damage based on counter
                    target.currentDEF -= target.metadata.poisonCounter;
                    
                    // Increment counter for next turn (max 3)
                    target.metadata.poisonCounter = Math.min(3, target.metadata.poisonCounter + 1);
                    
                    // Check if card is destroyed
                    if (target.currentDEF <= 0) {
                        destroyCard(target, gameState);
                    }
                }
            }
        }
    }
};
```

### 4.2 Status Effect Application

```
function applyStatusEffect(source, statusType, targets, duration = 1) {
    const statusTemplate = STATUS_EFFECTS[statusType];
    
    if (!statusTemplate) {
        console.error(`Unknown status effect: ${statusType}`);
        return null;
    }
    
    const effect = createEffect(source, EFFECT_TYPE.STATUS, {
        targets: targets,
        duration: duration,
        priority: 20, // Standard priority for status effects
        metadata: { statusType: statusType },
        applyFunction: statusTemplate.applyFunction,
        removeFunction: statusTemplate.removeFunction,
        stackable: false // Most status effects don't stack
    });
    
    // Add end of turn handler if present
    if (statusTemplate.endOfTurnFunction) {
        effect.endOfTurnFunction = statusTemplate.endOfTurnFunction;
    }
    
    return effect;
}
```

### 4.3 Status Effect Processing

```
function processEndOfTurnStatusEffects(gameState) {
    // Get all active status effects with end-of-turn functions
    const statusEffects = gameState.effectManager.activeEffects.filter(e => 
        e.type === EFFECT_TYPE.STATUS && e.endOfTurnFunction
    );
    
    // Process each effect
    for (const effect of statusEffects) {
        effect.endOfTurnFunction(effect, gameState);
    }
}
```

## 5. Triggered Effect System

### 5.1 Trigger Types

The system supports various trigger conditions:

```
const TRIGGER_TYPES = {
    ON_ATTACK: "Triggers when the card attacks",
    ON_DEFEND: "Triggers when the card is attacked",
    ON_DAMAGE: "Triggers when the card takes damage",
    ON_DESTROY: "Triggers when the card is destroyed",
    ON_PLAY: "Triggers when the card is played",
    ON_TURN_START: "Triggers at the start of a turn",
    ON_TURN_END: "Triggers at the end of a turn",
    ON_PHASE_START: "Triggers at the start of a phase",
    ON_PHASE_END: "Triggers at the end of a phase",
    WHEN_CONDITION: "Triggers when a specified condition is met"
};
```

### 5.2 Trigger Registration

```
function createTriggerEffect(source, triggerType, effectFunction, targets, duration = null) {
    return createEffect(source, EFFECT_TYPE.TRIGGER, {
        targets: targets,
        duration: duration,
        priority: 60, // High priority for triggers
        metadata: { triggerType: triggerType },
        applyFunction: (effect, gameState) => {
            // Register the trigger in the event system
            gameState.eventSystem.registerTrigger(
                effect.metadata.triggerType,
                effect.id,
                effectFunction,
                effect.targets
            );
        },
        removeFunction: (effect, gameState) => {
            // Unregister the trigger
            gameState.eventSystem.unregisterTrigger(
                effect.metadata.triggerType,
                effect.id
            );
        }
    });
}
```

### 5.3 Event Processing

```
class EventSystem {
    constructor() {
        // Map of event types to registered triggers
        this.triggers = new Map();
    }
    
    registerTrigger(eventType, triggerId, callback, targets) {
        if (!this.triggers.has(eventType)) {
            this.triggers.set(eventType, new Map());
        }
        
        this.triggers.get(eventType).set(triggerId, { callback, targets });
    }
    
    unregisterTrigger(eventType, triggerId) {
        if (this.triggers.has(eventType)) {
            this.triggers.get(eventType).delete(triggerId);
        }
    }
    
    fireEvent(eventType, eventData, gameState) {
        if (!this.triggers.has(eventType)) {
            return; // No triggers for this event type
        }
        
        // Get all relevant triggers
        const triggers = this.triggers.get(eventType);
        
        // Execute each trigger if it applies to this event
        for (const [triggerId, { callback, targets }] of triggers.entries()) {
            // Check if event applies to any of the trigger's targets
            const relevantTargets = targets.filter(target => 
                eventData.targets.includes(target)
            );
            
            if (relevantTargets.length > 0) {
                // Execute the trigger with relevant targets
                callback({
                    ...eventData,
                    relevantTargets
                }, gameState);
            }
        }
    }
}
```

## 6. Spell Card Implementation

### 6.1 Spell Card Structure

```
class SpellCard {
    constructor(id, name, description, effects, metadata = {}) {
        this.id = id;
        this.name = name;
        this.type = CARD_TYPE.SPELL;
        this.description = description;
        this.effects = effects || []; // Array of effect functions
        this.metadata = metadata;
    }
    
    // Create all effects this spell generates when played
    createEffects(gameState, player, targets) {
        return this.effects.map(effectCreator => 
            effectCreator(this, gameState, player, targets)
        );
    }
}
```

### 6.2 Common Spell Patterns

```
// Buff spell example (increases ATK)
function createAttackBuffSpell(name, buffAmount, duration) {
    return new SpellCard(
        generateUniqueId(),
        name,
        `Increases ATK of target monster by ${buffAmount} for ${duration} turns`,
        [
            (spellCard, gameState, player, targets) => 
                createStatModifier(spellCard, "ATK", buffAmount, targets, duration)
        ]
    );
}

// AOE damage spell example
function createAoeDamageSpell(name, damageAmount) {
    return new SpellCard(
        generateUniqueId(),
        name,
        `Deals ${damageAmount} damage to all enemy monsters`,
        [
            (spellCard, gameState, player) => {
                // Get all enemy monsters
                const opposingPlayer = 1 - player;
                const targets = getPlayerMonsters(gameState, opposingPlayer);
                
                // Create one-time damage effect
                return createEffect(spellCard, EFFECT_TYPE.ONE_TIME, {
                    targets: targets,
                    magnitude: damageAmount,
                    priority: 50,
                    applyFunction: (effect, gameState) => {
                        for (const target of effect.targets) {
                            target.currentDEF -= effect.magnitude;
                            
                            // Check if card is destroyed
                            if (target.currentDEF <= 0) {
                                destroyCard(target, gameState);
                            }
                        }
                    }
                });
            }
        ]
    );
}

// Lane repair spell example
function createLaneRepairSpell(name, repairAmount) {
    return new SpellCard(
        generateUniqueId(),
        name,
        `Repairs a lane by ${repairAmount} life points`,
        [
            (spellCard, gameState, player, targets) => {
                // Create one-time repair effect
                return createEffect(spellCard, EFFECT_TYPE.ONE_TIME, {
                    targets: targets, // Should be an array of lane objects
                    magnitude: repairAmount,
                    priority: 50,
                    applyFunction: (effect, gameState) => {
                        for (const target of effect.targets) {
                            if (target.type === "LANE") {
                                const laneHP = gameState.lanes[target.player][target.position];
                                
                                // Repair the lane, but don't exceed starting value
                                const maxLaneHP = target.position === 1 
                                    ? gameState.championStartingHP[target.player] 
                                    : 5; // Side lanes start with 5 HP
                                    
                                gameState.lanes[target.player][target.position] = 
                                    Math.min(maxLaneHP, laneHP + effect.magnitude);
                            }
                        }
                    }
                });
            }
        ]
    );
}
```

## 7. Champion Ability System

### 7.1 Champion Ability Structure

```
class ChampionAbility {
    constructor(name, description, usageRestrictions, effectFunction) {
        this.name = name;
        this.description = description;
        this.usageRestrictions = usageRestrictions || {}; // Phase restrictions, cooldown, etc.
        this.effectFunction = effectFunction; // Function to create the effect
        this.cooldownRemaining = 0;
    }
    
    canUse(gameState, champion) {
        // Check phase restrictions
        if (this.usageRestrictions.allowedPhases && 
            !this.usageRestrictions.allowedPhases.includes(gameState.phase)) {
            return false;
        }
        
        // Check cooldown
        if (this.cooldownRemaining > 0) {
            return false;
        }
        
        // Check custom conditions if specified
        if (this.usageRestrictions.conditions && 
            !this.usageRestrictions.conditions(gameState, champion)) {
            return false;
        }
        
        return true;
    }
    
    use(gameState, champion, targets) {
        if (!this.canUse(gameState, champion)) {
            return { success: false, reason: "Cannot use ability" };
        }
        
        // Create the effect
        const effect = this.effectFunction(champion, gameState, targets);
        
        // Apply cooldown if specified
        if (this.usageRestrictions.cooldown) {
            this.cooldownRemaining = this.usageRestrictions.cooldown;
        }
        
        // Return the created effect
        return { 
            success: true, 
            effect: effect 
        };
    }
    
    reduceCooldown() {
        if (this.cooldownRemaining > 0) {
            this.cooldownRemaining--;
        }
    }
}
```

### 7.2 Example Champion Abilities

```
// Direct damage champion ability
const directDamageAbility = new ChampionAbility(
    "Firestrike",
    "Deal 5 damage to target monster",
    {
        allowedPhases: [PHASE.STRATEGY],
        cooldown: 2,
        conditions: (gameState, champion) => champion.currentATK >= 5 // Requires minimum ATK
    },
    (champion, gameState, targets) => {
        return createEffect(champion, EFFECT_TYPE.ONE_TIME, {
            targets: targets,
            magnitude: 5,
            priority: 70,
            applyFunction: (effect, gameState) => {
                for (const target of effect.targets) {
                    target.currentDEF -= effect.magnitude;
                    
                    // Check if card is destroyed
                    if (target.currentDEF <= 0) {
                        destroyCard(target, gameState);
                    }
                }
            }
        });
    }
);

// Lane reinforcement ability
const laneReinforcementAbility = new ChampionAbility(
    "Fortify",
    "Reinforce all your lanes with +2 HP",
    {
        allowedPhases: [PHASE.STRATEGY],
        cooldown: 3
    },
    (champion, gameState, targets) => {
        // Get player's lanes
        const playerLanes = [];
        for (let i = 0; i < 3; i++) {
            playerLanes.push({ type: "LANE", player: champion.position.player, position: i });
        }
        
        return createEffect(champion, EFFECT_TYPE.ONE_TIME, {
            targets: playerLanes,
            magnitude: 2,
            priority: 70,
            applyFunction: (effect, gameState) => {
                for (const target of effect.targets) {
                    const laneHP = gameState.lanes[target.player][target.position];
                    
                    // Reinforce the lane, but don't exceed starting value
                    const maxLaneHP = target.position === 1 
                        ? gameState.championStartingHP[target.player] 
                        : 5; // Side lanes start with 5 HP
                        
                    gameState.lanes[target.player][target.position] = 
                        Math.min(maxLaneHP, laneHP + effect.magnitude);
                }
            }
        });
    }
);

// Champion bypass ability (passive)
const bypassLaneAbility = new ChampionAbility(
    "Phasing Strike",
    "Can attack enemy Champion directly, bypassing lane restrictions",
    {},
    (champion, gameState) => {
        return createEffect(champion, EFFECT_TYPE.PERSISTENT, {
            targets: [champion],
            priority: 90,
            metadata: { abilityType: "CHAMPION_BYPASS" },
            applyFunction: (effect, gameState) => {
                effect.targets[0].abilities = effect.targets[0].abilities || [];
                effect.targets[0].abilities.push({
                    type: "RULE_OVERRIDE",
                    affectsAction: ACTION_TYPE.SELECT_ATTACK,
                    metadata: { bypassChampionLaneRestriction: true }
                });
            },
            removeFunction: (effect, gameState) => {
                const champion = effect.targets[0];
                const abilityIndex = champion.abilities.findIndex(a => 
                    a.type === "RULE_OVERRIDE" && 
                    a.affectsAction === ACTION_TYPE.SELECT_ATTACK &&
                    a.metadata.bypassChampionLaneRestriction
                );
                
                if (abilityIndex !== -1) {
                    champion.abilities.splice(abilityIndex, 1);
                }
            }
        });
    }
);
```

## 8. Effect Interaction System

### 8.1 Effect Conflict Resolution

```
function resolveEffectConflicts(effects, gameState) {
    // Group effects by type and target
    const effectGroups = new Map();
    
    for (const effect of effects) {
        for (const target of effect.targets) {
            const key = `${effect.type}:${target.id}`;
            
            if (!effectGroups.has(key)) {
                effectGroups.set(key, []);
            }
            
            effectGroups.get(key).push(effect);
        }
    }
    
    // Resolve conflicts within each group
    const finalEffects = [];
    
    for (const effectGroup of effectGroups.values()) {
        if (effectGroup.length <= 1) {
            // No conflict
            finalEffects.push(...effectGroup);
            continue;
        }
        
        // Handle conflicts
        switch (effectGroup[0].type) {
            case EFFECT_TYPE.STAT_MODIFIER:
                // Group further by stat
                finalEffects.push(...resolveStatModifierConflicts(effectGroup));
                break;
                
            case EFFECT_TYPE.STATUS:
                // For status effects, keep the one with highest priority/longest duration
                finalEffects.push(resolveStatusEffectConflict(effectGroup));
                break;
                
            default:
                // Default: use priority as tiebreaker
                finalEffects.push(...effectGroup.sort((a, b) => b.priority - a.priority));
        }
    }
    
    return finalEffects;
}

function resolveStatModifierConflicts(effects) {
    // Group by stat type
    const statGroups = new Map();
    
    for (const effect of effects) {
        const stat = effect.metadata.stat;
        
        if (!statGroups.has(stat)) {
            statGroups.set(stat, []);
        }
        
        statGroups.get(stat).push(effect);
    }
    
    // For each stat, determine the final modifier
    const finalEffects = [];
    
    for (const [stat, statEffects] of statGroups.entries()) {
        if (statEffects.every(e => e.stackable)) {
            // All are stackable, keep all of them
            finalEffects.push(...statEffects);
        } else {
            // Some are non-stackable, keep the highest value
            const bestEffect = statEffects.reduce((best, current) => 
                (current.magnitude > best.magnitude) ? current : best
            );
            
            finalEffects.push(bestEffect);
        }
    }
    
    return finalEffects;
}

function resolveStatusEffectConflict(effects) {
    // For simple implementation: highest priority wins
    // In case of tie, longest duration wins
    return effects.reduce((best, current) => {
        if (current.priority > best.priority) {
            return current;
        } else if (current.priority === best.priority && current.duration > best.duration) {
            return current;
        }
        return best;
    });
}
```

### 8.2 Effect Removal System

```
function removeExpiredEffects(gameState) {
    const activeEffects = gameState.effectManager.activeEffects;
    const effectsToRemove = [];
    
    // Find expired effects
    for (let i = 0; i < activeEffects.length; i++) {
        const effect = activeEffects[i];
        
        // Skip permanent effects
        if (effect.duration === null) {
            continue;
        }
        
        // Decrement duration
        effect.duration--;
        
        // Mark for removal if expired
        if (effect.duration <= 0) {
            effectsToRemove.push(effect);
        }
    }
    
    // Remove expired effects
    for (const effect of effectsToRemove) {
        // Execute removal function if defined
        if (effect.removeFunction) {
            effect.removeFunction(effect, gameState);
        }
        
        // Remove from active effects
        const index = activeEffects.indexOf(effect);
        if (index !== -1) {
            activeEffects.splice(index, 1);
        }
    }
}

function removeEffectsFromSource(source, gameState) {
    const activeEffects = gameState.effectManager.activeEffects;
    const effectsToRemove = activeEffects.filter(e => e.source === source);
    
    for (const effect of effectsToRemove) {
        // Execute removal function if defined
        if (effect.removeFunction) {
            effect.removeFunction(effect, gameState);
        }
        
        // Remove from active effects
        const index = activeEffects.indexOf(effect);
        if (index !== -1) {
            activeEffects.splice(index, 1);
        }
    }
}

function removeEffectsFromTarget(target, gameState) {
    const activeEffects = gameState.effectManager.activeEffects;
    const effectsToRemove = activeEffects.filter(e => e.targets.includes(target));
    
    for (const effect of effectsToRemove) {
        // If effect has multiple targets, just remove this target
        if (effect.targets.length > 1) {
            const targetIndex = effect.targets.indexOf(target);
            if (targetIndex !== -1) {
                effect.targets.splice(targetIndex, 1);
            }
        } else {
            // Execute removal function if defined
            if (effect.removeFunction) {
                effect.removeFunction(effect, gameState);
            }
            
            // Remove from active effects
            const index = activeEffects.indexOf(effect);
            if (index !== -1) {
                activeEffects.splice(index, 1);
            }
        }
    }
}
```

This comprehensive effect system provides the foundation for all card abilities, spell effects, and status conditions in TridimensionalDuels, ensuring consistent handling of temporary and permanent modifications to the game state. 