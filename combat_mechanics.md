# TridimensionalDuels: Combat System Logic

## 1. Combat System Core Principles

The combat system in TridimensionalDuels is the primary game mechanic that resolves conflicts between opposing cards. It follows deterministic rules based on the three-dimensional stat system (ATK/DEF/SPD).

### 1.1 Resolution Sequence

Combat resolution follows this precise sequence:
1. Determine attack order based on Speed values
2. Calculate attack outcomes and damage
3. Apply damage to cards and lanes
4. Process secondary effects

## 2. Speed-Based Initiative System

### 2.1 Attack Order Determination
1. All cards with queued attacks are sorted in descending order by SPD
2. Ties in SPD are resolved by highest ATK
3. If both SPD and ATK are tied, resolve by highest DEF
4. If all three stats are tied, the first card played attacks first

### 2.2 Speed Priority Groups
Speed values create natural attack priority groups:
- **Fast** (7+ SPD): Attack early in the combat phase
- **Medium** (4-6 SPD): Attack in the middle of the combat phase
- **Slow** (1-3 SPD): Attack late in the combat phase

### 2.3 Speed Modification Effects
1. Speed can be modified by:
   - Spell effects (+/- X SPD)
   - Pumper abilities (+1 SPD)
   - Status effects (e.g., "Slow" status reduces SPD by 2)
2. Modified speed values are recalculated at the start of each Battle Phase
3. Speed modifications expire at the End Phase unless otherwise specified

## 3. Attack Resolution Algorithm

### 3.1 Standard Combat Resolution
For each attack, the system follows these steps:

1. Identify attacking card and target
2. Compare ATK values:
   - If Attacker's ATK > Defender's ATK:
     * Defender loses (ATK difference) from DEF
     * If Defender's DEF reaches 0, the card is destroyed
     * Excess damage (damage beyond DEF) is applied to the lane
   - If Attacker's ATK = Defender's ATK:
     * Defender's DEF is reduced to 1 (if higher than 1)
     * No lane damage occurs
   - If Attacker's ATK < Defender's ATK:
     * Defender loses (Attacker's ATK) from DEF
     * No lane damage occurs

### 3.2 Protection Mechanics
When a Defender uses Protection ability:
1. Incoming attacks are reduced by the Defender's ATK value
2. Protection effect does not stack with other protection effects
3. Protection bypassing effects (e.g., "Piercing") ignore some or all of the protection value
4. Protection cooldown: Cannot be used in consecutive turns

### 3.3 Combat Formula Breakdown

```
Let A = Attacking card's ATK
Let D = Defending card's DEF
Let T = Defending card's ATK
Let P = Protection value (if applicable, otherwise 0)

Effective Attack (EA) = Max(0, A - P)

Damage to Defender = 
  If EA > T: EA - T
  If EA = T: Max(0, D - 1)
  If EA < T: EA

Damage to Lane = 
  If EA > T and (EA - T) > D: (EA - T) - D
  Otherwise: 0
```

## 4. Lane Damage System

### 4.1 Lane Damage Application
1. Lanes have hit points (5 for side lanes, variable for Champion lane)
2. Damage applied to a lane reduces its hit points directly
3. When lane hit points reach 0, the lane is considered "broken"
4. Direct attacks to empty positions damage the lane directly (no card to absorb damage)

### 4.2 Champion Lane Access Rules
1. Champion lane cannot be directly attacked if both side lanes are intact
2. Once at least one side lane is broken, the Champion becomes a valid target
3. Exception: Cards with "Champion Bypass" abilities can attack the Champion directly
4. Champion lane hit points equal the Champion's DEF value

## 5. Special Combat Interactions

### 5.1 Simultaneous Attacks
When two cards attack each other in the same turn:
1. Attacks resolve independently based on SPD order
2. Higher SPD card attacks first, potentially destroying the slower card before it can attack
3. If the slower card survives, its attack still resolves as queued

### 5.2 Area Effect Damage
Some cards have area-of-effect (AoE) attack patterns:
1. AoE damage is calculated separately for each affected target
2. Protection effects apply individually to each instance of AoE damage
3. AoE effects typically deal reduced damage to secondary targets

### 5.3 Status Effects in Combat
Combat-related status effects alter the normal attack resolution:
1. **Stun**: Prevents a card from attacking for the duration
2. **Freeze**: Reduces card's DEF by 50% (rounded down) for the duration
3. **Burn**: Deals 1 damage at end of each turn for the duration
4. **Poison**: Deals increasing damage (1, then 2, then 3) over consecutive turns

## 6. Edge Cases and Special Rules

### 6.1 Empty Position Attacks
1. Attacks targeting an empty position hit the lane directly
2. Direct lane damage equals the attacker's full ATK value
3. No protection or reduction effects apply to empty position attacks

### 6.2 Card Destruction Sequence
When a card is destroyed:
1. Card is moved to the owner's discard pile
2. Position becomes empty
3. "On destruction" effects trigger
4. "When a card is destroyed" effects trigger (both players' cards)

### 6.3 Attack Redirection
Some abilities allow attack redirection:
1. Redirected attacks use original attack values
2. Target validity is checked after redirection (some redirections may be illegal)
3. Redirections occur before damage calculation

## 7. Advanced Combat Tactics

### 7.1 Speed Control Strategy
1. Maintaining speed advantage ensures first strike capability
2. Speed control spells can alter the attack order favorably
3. Staggering speeds to create attack windows between opponent's attacks

### 7.2 Lane Pressure Calculation
Lane pressure is calculated as:
```
Lane Pressure = 
  Sum of ATK values directed at lane - 
  Sum of protection values defending lane
```

### 7.3 Attack Pattern Optimization
1. Vertical attacks provide reliable direct damage
2. Diagonal attacks (All-Rounders) offer tactical flexibility
3. Attack patterns should consider:
   - High-value targets (highest threat)
   - Lane vulnerability (lowest remaining HP)
   - Protection status (attacking unprotected positions)

