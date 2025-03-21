# TridimensionalDuels: Gameplay Manual

## 1. Gameplay Mechanics

### 1.1 Core Loop
- Draw cards
- Deploy monsters and spells strategically
- Choose monster actions (attack/protect/pump)
- Resolve combat in speed order
- Assess board state and plan next move

### 1.2 Game Setup
Each player constructs a 16-card deck:
- 1 Champion Card
- 5 Monster Cards
- 10 Spell Cards

Initial setup:
- Players begin with all 5 monsters and their Champion in hand
- Champion is automatically placed in the central position
- Left and right lanes start with 5 life points each
- Champion's life points equal its Defense stat

### 1.3 Turn Structure
Each turn consists of four phases:
1. **Draw Phase**: Player draws one card from their deck
2. **Strategy Phase** (30 seconds): Player plays cards and chooses monster actions
3. **Battle Phase**: Combat resolves automatically in speed order
4. **End Phase**: Updates game state, applies damage, checks win conditions

## 2. Card Types

### 2.1 Champions
- Central card with high defense (14-25)
- Features unique special ability
- Main target that must be protected

### 2.2 Monsters
- Three primary stats: Attack, Defense, Speed
- Three classes with different abilities:
  - **Defenders**: Can attack vertically or protect (cooldown: can't protect twice in a row)
  - **Pumpers**: Can attack vertically or pump stats (+1/+1/+1)
  - **All Rounders**: Can attack vertically or diagonally
- May have additional unique effects

### 2.3 Spells
- One-time effects that activate at the start of Battle Phase
- Can be placed face-down in spell slots
- Various effects: stat boosts, control effects, board manipulation

## 3. Combat System

### 3.1 Attack Resolution
- Monsters act in order of Speed (highest to lowest)
- Attacking monster uses ATK value against defender's DEF value
- If ATK > DEF, defender is defeated and sent to graveyard
- If ATK = DEF, defender survives with 1 DEF remaining
- If ATK < DEF, defender's DEF is reduced by attacking ATK value

### 3.2 Lane Mechanics
- Side lanes have 5 life points each
- When a lane has no monster, attacks hit the lane directly
- When lane life reaches 0, that lane is destroyed
- Champion can only be attacked if at least one opposing lane is destroyed
- Some Champions have abilities that bypass this restriction

## 4. Monster Classes in Detail

### 4.1 Defenders
- **Primary Function**: Protect lanes and absorb damage
- **Action Choices**:
  - Vertical Attack: Target monster directly opposite
  - Protect: Gain defensive bonus (specific to each card)
- **Notable Mechanics**:
  - Protection cooldown (can't protect consecutive turns)
  - Most have higher DEF than ATK values
  - Some have healing abilities when protecting

### 4.2 Pumpers
- **Primary Function**: Boost stats for favorable trades
- **Action Choices**:
  - Vertical Attack: Target monster directly opposite
  - Pump: Increase all stats by +1 (+1 ATK, +1 DEF, +1 SPD)
- **Notable Mechanics**:
  - Some pumpers gain enhanced bonuses (+2 to a specific stat)
  - Temporary boosts last until end of turn
  - Generally balanced base stats

### 4.3 All Rounders
- **Primary Function**: Attack flexibility and utility
- **Action Choices**:
  - Vertical Attack: Target monster directly opposite
  - Diagonal Attack: Target either opponent monster
- **Notable Mechanics**:
  - Can target multiple lanes for strategic advantage
  - Some bypass protection or have bonus effects
  - Generally higher ATK and SPD, lower DEF

## 5. Win Conditions
- **Champion Destruction**: Reduce opponent's Champion DEF to 0
- **Deck Out**: Force opponent to draw when their deck is empty
- **Draw**: Both Champions reach 0 DEF simultaneously

## 6. System Architecture

### 6.1 High-Level Architecture
TridimensionalDuels uses a component-based architecture with the following major systems:
```
┌─────────────────────────────────────────────────────────┐
│                  Game Core Components                   │
├─────────────┬─────────────┬────────────┬───────────────┤
│ Card System │ Game State  │ Turn Logic │ Combat System │
└─────────────┴─────────────┴────────────┴───────────────┘
             ▲               ▲              ▲
             │               │              │
             ▼               ▼              ▼
┌─────────────────────────────────────────────────────────┐
│                  Service Components                     │
├─────────────┬─────────────┬────────────┬───────────────┤
│ Card Data   │  Player     │ Rules      │ Event         │
│ Service     │  Service    │ Service    │ Service       │
└─────────────┴─────────────┴────────────┴───────────────┘
             ▲               ▲              ▲
             │               │              │
             ▼               ▼              ▼
┌─────────────────────────────────────────────────────────┐
│                  Frontend Components                    │
├─────────────┬─────────────┬────────────┬───────────────┤
│ Game Board  │ Card        │ Animation  │ UI            │
│ View        │ View        │ System     │ Controller    │
└─────────────┴─────────────┴────────────┴───────────────┘
```
