# TridimensionalDuels: A Comprehensive Game Description

## 1. Introduction
TridimensionalDuels is a strategic card game that combines elements of lane-based combat, resource management, and tactical positioning. The game features a unique 3D combat system where cards have three core stats (Attack, Defense, and Speed) that determine their effectiveness in battle.

## 2. Core Game Concept
Players compete in a head-to-head battle using specialized decks containing monsters, spells, and a powerful ChampionCard. The objective is to destroy the opponent's ChampionCard by strategically deploying monsters and spells across a structured game board. The game blends careful positioning with timing-based decisions, creating a chess-like experience with cards.

## 3. Game Board Layout
The board is structured with two rows of positions for each player:

- **Front Row**: Contains monster cards placed on the left and right sides, with the ChampionCard in the center
- **Back Row**: Contains spell cards that can be placed behind monsters and the ChampionCard

## 4. Card Types and Dimensions

### 4.1 Card Stats
Every card in TridimensionalDuels has three primary dimensions:

Attack (ATK): Determines offensive power in combat
Defense (DEF): Represents durability and health
Speed (SPD): Determines attack priority during battle phase

### 4.2 Card Classes
There are three monster classes, each with unique abilities:

#### Defenders:
- Can attack vertically
- Can protect (defensive stance) but not in consecutive turns
- Often have higher defense stats

#### Pumpers:
- Can attack vertically
- Can "pump" themselves (+1 ATK, +1 DEF, +1 SPD)
- Often have balanced stats

#### All-Rounders:
- Can attack vertically and diagonally
- Most versatile attack patterns
- Often have higher attack and speed stats

### 4.3 ChampionCards
Each player has one ChampionCard with:

- Unique special abilities
- Higher baseline stats than regular monsters
- Specific life points based on defense value
- Acts as the main win condition

### 4.4 Spell Cards
Spell cards provide various effects:

- Can be placed face-down
- Activate at the start of a turn
- Provide buffs, debuffs, or special actions
- Not directly involved in combat

## 5. Game Flow

### 5.1 Setup

Each player begins with a 16-card deck:

- 5 monster cards
- 10 spell cards
- 1 ChampionCard

Initial setup steps:
- Players draw an initial hand of 6 cards (5 monsters + ChampionCard)
- All monsters and the ChampionCard are revealed to both players
- The ChampionCard is automatically placed in the center position

### 5.2 Turn Structure
Each turn progresses through three distinct phases:

#### Strategy Phase (30 seconds):
- Draw one card
- Play monster cards to empty positions
- Place spell cards face-down
- Choose monster actions (attack/protect/pump)
- Plan your strategy

#### Battle Phase:

Spells activate in priority
Monsters attack in order of speed (highest to lowest)
Attack outcomes are resolved
Damage is calculated

#### End Phase:

Apply damage to cards and lanes
Move defeated cards to graveyard
Update defense values on damaged cards
Check win conditions

Combat Mechanics

Attack Priority: Cards attack in descending order of speed
Damage Calculation:

When two cards battle, the one with higher attack wins
Difference in attack points is subtracted from lane life points
If a card survives an attack, its defense is reduced accordingly

Attack Patterns:

Vertical attacks target the card directly opposite
Diagonal attacks (All-Rounders only) can target cards at an angle
Special champion abilities may modify attack patterns

Lane System

Each player has three lanes: two side lanes and the center lane
Side lanes start with 5 life points each
Champion lane life points equal the Champion's defense stat
Players must destroy at least one side lane before attacking the Champion
When a lane reaches 0 life points, it's considered destroyed

Win Conditions
The game ends when one of these conditions is met:

A player's ChampionCard is reduced to 0 life points (opponent wins)
Both ChampionCards reach 0 life points simultaneously (draw)
A player runs out of cards in their deck (opponent wins)

Strategic Elements
Class Synergies

Defenders protect valuable cards and lanes
Pumpers increase in power over time
All-Rounders provide tactical flexibility

Resource Management

Limited number of cards (16 per deck)
Strategic deployment of spells versus monsters
Timing of special abilities

Positional Strategy

Lane prioritization (which to attack/defend)
Card placement considering attack patterns
Protecting vulnerable positions

Timing Decisions

When to attack versus protect
When to use limited-use abilities
When to play powerful spell cards

Unique Game Features

Three-Dimensional Stats: The core ATK/DEF/SPD system creates a rock-paper-scissors dynamic
Class-Based Abilities: Each monster class provides distinct tactical options
Speed Priority System: Creates an initiative order similar to turn-based strategy games
Lane-Based Combat: Positional element adds a spatial dimension to strategy
Timed Phases: 30-second strategy phases create pressure and excitement
Transparent Monster Reveal: Known monster cards but hidden spells balances information

This comprehensive system creates a game that rewards careful planning, tactical positioning, and adaptive strategy, all centered around the core three-dimensional card stats.

Expanded Game Phases
Pre-Game Preparations

Deck Construction

Players build 16-card decks with strategic consideration of:

Monster class distribution (Defenders/Pumpers/All-Rounders balance)
Attack curves (high ATK vs. balanced stats)
Speed advantages (first-strike potential)
Champion synergy (building around champion abilities)

Optimal deck composition typically includes:

2-3 Defenders for protection
1-2 Pumpers for scaling threats
1-2 All-Rounders for flexible attacks
Champion that complements overall strategy
10 spells offering control, buff, and utility options

Initial Hand Revelation

The 5 monsters and ChampionCard reveal creates a "known information game"
Players can immediately analyze opponent's monster composition
Early strategic planning begins based on monster matchups
The hidden spell cards create an element of uncertainty

Detailed Turn Cycle

Draw Phase

Draw one card from deck (typically a spell after initial setup)
Check for deck-out condition (lose if no cards remain)
Evaluate new options based on drawn card

Strategy Phase (30-second timer)

Card Deployment:

Place monster cards in empty positions on your side
Position spell cards face-down in back row

Action Selection:

For each monster, choose exactly ONE action:

Vertical Attack: Target opposing card in same column
Diagonal Attack (All-Rounders only): Target adjacent diagonal position
Protect (Defenders only): Enter defensive stance, cannot be used in consecutive turns
Pump (Pumpers only): Gain +1 ATK, +1 DEF, +1 SPD for the turn

Champion Activation:

Determine whether to use champion's unique ability
Some champion abilities can bypass normal attack restrictions

Battle Phase (Automated Resolution)

Priority Step:

Spells activate first in play order
Monsters and Champions attack in strict SPD order (highest to lowest)
Tied SPD values resolved by ATK, then DEF as tiebreakers

Combat Resolution:

For each attack, calculate ATK differential
Apply damage to losing card's DEF
Apply excess damage to lane life points
Apply any additional effects (splash damage, etc.)

Status Effect Application:

Apply freeze, stun, buff, debuff effects
Track effect durations and cooldowns

End Phase

Damage Application:

Update DEF values on all damaged cards
Remove destroyed cards to graveyard
Update lane life point totals

Effect Resolution:

Decrement duration of ongoing effects
Trigger end-of-turn effects
Reset protection cooldowns

Win Condition Check:

Check Champion life points (0 = loss)
Check deck count (0 = loss)
Verify if game continues to next turn

Advanced Combat Dynamics
Speed System Intricacies

Speed-Based Initiative

Attack order follows strict speed hierarchy
Higher speed allows "first strike" advantage
Speed advantages can be decisive when equal ATK/DEF values exist
Speed modifications from spells and effects change attack order

Speed Thresholds

Cards with 7+ SPD typically attack before opponent can react
4-6 SPD range represents average initiative
1-3 SPD cards usually attack last, but often have compensating high ATK/DEF

Damage Calculation Details

Standard Combat Resolution

Attacker's ATK vs. Defender's ATK
Higher value wins combat
Damage formula: Winner's ATK - Loser's ATK = Damage
Damage reduces defender's DEF permanently
Excess damage (beyond defender's DEF) goes to lane life points

Complex Combat Scenarios

Simultaneous Attacks: If two cards attack each other in the same turn, both attacks resolve independently
Protected Targets: Defenders in protect mode reduce incoming damage by their ATK value
Splash Damage: Some effects damage adjacent cards for reduced values
Penetration Effects: Certain cards can bypass protection or deal direct lane damage

Lane Mechanics

Lane Integrity

Side lanes start with 5 life points
Champion lane has life points equal to Champion's DEF
When a lane reaches 0 life points, it's "broken"
Broken side lanes allow direct attacks on Champion

Lane Recovery

Some spell effects can restore lane life points
Certain Champion abilities can reinforce lanes
Lane repair strategies are crucial for defensive play

Class-Specific Mechanics

Defender Dynamics

Protection cooldown management is critical
Protection value equals card's ATK stat
Can alternate protection between turns for consistent defense
Protection typically prevents diagonal attacks

Pumper Strategies

Cumulative pumping can create exponential threats
Early-game pumpers create late-game advantages
Some pumpers have specialized stat increases (+2 to one stat instead of +1 to all)
Pump effects only last for the current turn

All-Rounder Tactics

Diagonal attacks allow targeting multiple threats
Can threaten multiple lanes simultaneously
May bypass Defender protection in certain scenarios
Versatility compensates for generally lower raw stats

Spell System Mechanics

Spell Timing

All spells activate at start of battle phase
Multiple spells resolve in order played
Spell effects typically last for one full turn
Counter-spells can negate other spell effects

Spell Categories

Buff Spells: Enhance friendly card stats
Debuff Spells: Reduce enemy card effectiveness
Utility Spells: Card draw, position swapping, etc.
Control Spells: Disable or redirect enemy actions
Direct Damage Spells: Bypass combat to deal damage

Spell Stacking Rules

Multiple buff/debuff effects stack additively
Status effects (freeze, stun) don't stack in duration
Contradictory effects follow "last applied" rule

Champion Card Mechanics

Champion Positioning

Always placed in center slot
Cannot be moved from position
Acts as primary defense and win condition

Champion Abilities

Unique effects change game dynamics
Some have passive always-on abilities
Others have activated abilities with cooldowns
Champion abilities often bypass normal game restrictions

Champion Synergies

Each Champion favors certain monster/spell combinations
Building around Champion strengths is key to optimal strategy
Counter-strategies exist for each Champion archetype

Advanced Strategic Concepts

Tempo Control

Managing attack initiative through speed advantages
Creating and maintaining board pressure
Forcing opponent into reactive rather than proactive plays

Card Economy

Managing limited 16-card resource
Trading efficiently (1-for-1 or better exchanges)
Preserving key cards for optimal timing

Information Management

Tracking used/remaining cards
Deducing opponent's spell composition
Setting up and avoiding traps

Positional Advantage

Controlling key board positions
Setting up beneficial attack angles
Denying opponent favorable positions

Tactical Adaptability

Shifting between aggressive and defensive postures
Adjusting to opponent's revealed strategy
Capitalizing on unexpected opportunities

Game State Complexity

Short-Term Memory Requirements

Current board state (8 positions)
Active effects and durations
Protection cooldowns
Cards in hand

Long-Term Memory Requirements

Used spells vs. remaining spells
Graveyard contents
Previous turn patterns
Opponent tendencies

This document expands on the core game mechanics to provide a deeper understanding of the strategic depth and tactical options in TridimensionalDuels. The game combines elements of chess-like positional play with the resource management of card games, creating a unique and engaging competitive experience.