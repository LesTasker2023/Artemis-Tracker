# ARTEMIS v3 - Comprehensive Tracking System

## Overview

The tracking system captures **every meaningful event** from Entropia Universe's chat.log, providing:

- Real-time session statistics
- Detailed skill breakdown by skill and category
- Loot itemization
- Combat efficiency metrics
- Kill inference from loot patterns

---

## Event Flow

```
chat.log → electron/main.ts (parser) → IPC → useLogEvents hook
                                              ↓
                                    useSession hook → parser.ts (normalize)
                                              ↓
                                    session.ts (calculateSessionStats)
                                              ↓
                                    SessionStats with full breakdowns
```

---

## Tracked Event Types

### Combat - Offensive

| Log Message                     | Main Process Type | Session Type      | Counts As             |
| ------------------------------- | ----------------- | ----------------- | --------------------- |
| `You inflicted X damage`        | `HIT`             | `damage_dealt`    | Shot + Hit            |
| `Critical hit...You inflicted`  | `CRITICAL_HIT`    | `damage_dealt`    | Shot + Hit + Critical |
| `You missed`                    | `MISS`            | `miss`            | Shot + Miss           |
| `The target Dodged your attack` | `TARGET_DODGED`   | `target_dodged`   | Shot + Miss           |
| `The target Evaded your attack` | `TARGET_EVADED`   | `target_evaded`   | Shot + Miss           |
| `Target resisted all damage`    | `TARGET_RESISTED` | `target_resisted` | Shot                  |
| `Target out of range`           | `OUT_OF_RANGE`    | `out_of_range`    | Shot + Miss           |

### Combat - Defensive

| Log Message                  | Main Process Type       | Session Type                   |
| ---------------------------- | ----------------------- | ------------------------------ |
| `You took X damage`          | `DAMAGE_TAKEN`          | `damage_taken`                 |
| `Critical hit...You took`    | `CRITICAL_DAMAGE_TAKEN` | `damage_taken` (critical flag) |
| `Reduced X points of damage` | `DAMAGE_REDUCED`        | `damage_reduced`               |
| `You Dodged the attack`      | `PLAYER_DODGED`         | `player_dodged`                |
| `You Evaded the attack`      | `PLAYER_EVADED`         | `player_evaded`                |
| `The attack missed you`      | `ENEMY_MISSED`          | `enemy_missed`                 |

### Death & Revival

| Log Message             | Main Process Type     | Session Type          |
| ----------------------- | --------------------- | --------------------- |
| `You were killed by...` | `PLAYER_DEATH`        | `death`               |
| `You have been revived` | `REVIVED`             | `revived`             |
| `Divine intervention`   | `DIVINE_INTERVENTION` | `divine_intervention` |

### Healing

| Log Message                     | Main Process Type | Session Type |
| ------------------------------- | ----------------- | ------------ |
| `You healed yourself X points`  | `SELF_HEAL`       | `self_heal`  |
| `You healed [player] with X`    | `HEAL_OTHER`      | `heal_other` |
| `You were healed X by [player]` | `HEALED_BY`       | `healed_by`  |

### Loot

| Log Message                                | Main Process Type | Session Type   | Data                  |
| ------------------------------------------ | ----------------- | -------------- | --------------------- |
| `You received [item] x (qty) Value: X PED` | `LOOT`            | `loot`         | item, quantity, value |
| `You have claimed a resource! ([name])`    | `CLAIM`           | `mining_claim` | resource name         |

### Skills

| Log Message                                    | Main Process Type   | Session Type     | Data               |
| ---------------------------------------------- | ------------------- | ---------------- | ------------------ |
| `You have gained X.XXXX experience in [skill]` | `SKILL_GAIN`        | `skill_gain`     | skill name, amount |
| `You have gained a new rank in [skill]!`       | `SKILL_RANK`        | `skill_rank`     | skill name         |
| `...acquired a new skill; [skill]`             | `SKILL_ACQUIRED`    | `skill_acquired` | skill name         |
| `You have gained X [attribute]`                | `ATTRIBUTE_GAIN`    | `attribute_gain` | attribute, amount  |
| `Your [attribute] has improved by X`           | `ATTRIBUTE_IMPROVE` | `attribute_gain` | attribute, amount  |

### Globals

| Log Message                                  | Main Process Type | Session Type    |
| -------------------------------------------- | ----------------- | --------------- |
| `[Globals] [player] killed creature...X PED` | `GLOBAL_KILL`     | `global`        |
| `[Globals] ...Hall of Fame`                  | `GLOBAL_HOF`      | `hof`           |
| `[Globals] ...found a deposit`               | `GLOBAL_MINING`   | `global_mining` |

---

## Skill Categories

Skills are automatically classified into categories:

| Category       | Skills                                                              |
| -------------- | ------------------------------------------------------------------- |
| **combat**     | Rifle, Handgun, Marksmanship, Aim, Melee Combat, Dodge, Evade, etc. |
| **attributes** | Agility, Strength, Stamina, Intelligence, Psyche, etc.              |
| **profession** | Mining, Crafting, Blueprint skills, Anatomy, etc.                   |
| **support**    | First Aid, Vehicle skills, Animal Taming, etc.                      |
| **other**      | Anything not classified                                             |

See `src/core/types.ts` → `SKILL_CATEGORIES` for full mapping.

---

## Session Statistics Structure

### SessionStats

```typescript
interface SessionStats {
  // Time
  duration: number; // seconds

  // Combat (backwards compatible)
  shots: number;
  hits: number;
  misses: number;
  kills: number;
  criticals: number;
  damageDealt: number;
  damageTaken: number;
  dodges: number;
  evades: number;
  healed: number;
  deaths: number;

  // Economy
  lootCount: number;
  lootValue: number;
  totalSpend: number;
  profit: number;
  returnRate: number; // (lootValue / spend) * 100

  // Skills
  skillGains: number; // Total skill point value
  globalCount: number;
  hofs: number;

  // DETAILED BREAKDOWNS (NEW)
  combat: CombatBreakdown;
  skills: SkillBreakdown;
  skillEfficiency: SkillEfficiency;
  loot: LootBreakdown;
  loadoutBreakdown: LoadoutBreakdown[];
}
```

### SkillBreakdown

```typescript
interface SkillBreakdown {
  totalSkillGains: number; // Sum of all skill points
  totalSkillEvents: number; // Count of skill gain events
  skillRanks: number; // New ranks achieved
  newSkillsUnlocked: number; // New skills acquired
  bySkill: Record<string, SkillStats>;
  byCategory: Record<SkillCategory, number>;
}

interface SkillStats {
  skillName: string;
  category: SkillCategory;
  totalGain: number;
  gainCount: number;
  averageGain: number;
  firstGain: number; // timestamp
  lastGain: number; // timestamp
}
```

### SkillEfficiency

```typescript
interface SkillEfficiency {
  skillPerPedSpent: number; // Skill points per PED spent
  skillPerShot: number; // Skill points per shot fired
  skillPerHour: number; // Skill points per hour
  skillPerKill: number; // Skill points per kill
  skillToLootRatio: number; // Skill value vs loot value
}
```

### CombatBreakdown

```typescript
interface CombatBreakdown {
  // Offensive
  totalShots: number;
  hits: number;
  misses: number;
  criticals: number;
  targetDodged: number;
  targetEvaded: number;
  targetResisted: number;
  outOfRange: number;

  // Damage
  damageDealt: number;
  criticalDamage: number;
  averageDamagePerHit: number;
  dps: number;

  // Defensive
  damageTaken: number;
  criticalDamageTaken: number;
  playerDodges: number;
  playerEvades: number;
  enemyMisses: number;
  damageReduced: number;

  // Healing
  selfHealing: number;
  healingReceived: number;
  healingGiven: number;

  // Results
  kills: number;
  deaths: number;
  killsInferred: number; // Kills detected from loot patterns
}
```

### LootBreakdown

```typescript
interface LootBreakdown {
  totalValue: number;
  totalItems: number;
  uniqueItems: number;
  byItem: Record<
    string,
    {
      count: number;
      totalValue: number;
      quantity: number;
    }
  >;
  shrapnelValue: number;
  ammoValue: number;
}
```

---

## Kill Inference

Since Entropia Universe doesn't log explicit kill messages, kills are **inferred from loot patterns**:

1. Track `damageEventsSinceLastLoot` counter
2. When loot is received and counter > 0:
   - Increment `kills` and `killsInferred`
   - Reset counter

This works because:

- You only get loot from things you killed
- Damage → Loot sequence implies a kill happened

---

## Helper Functions

```typescript
// Get top N skills by total gain
getTopSkills(stats: SessionStats, limit: number = 10): SkillStats[]

// Get skills grouped by category
getSkillsByCategory(stats: SessionStats): Record<SkillCategory, SkillStats[]>

// Calculate skill gain rate per time period
getSkillGainRate(stats: SessionStats, periodMinutes: number = 60): number
```

---

## Usage Examples

### Access Skill Breakdown

```typescript
const stats = calculateSessionStats(session);

// Total skill points gained
console.log(stats.skills.totalSkillGains);

// Rifle skill specifically
console.log(stats.skills.bySkill["Rifle"]?.totalGain);

// All combat skills total
console.log(stats.skills.byCategory.combat);

// Skills per PED spent
console.log(stats.skillEfficiency.skillPerPedSpent);
```

### Access Loot Breakdown

```typescript
// Shrapnel received
console.log(stats.loot.shrapnelValue);

// Specific item
console.log(stats.loot.byItem["Animal Hide"]?.totalValue);
```

### Access Combat Details

```typescript
// How many times target dodged your attacks
console.log(stats.combat.targetDodged);

// Critical damage dealt
console.log(stats.combat.criticalDamage);

// Average damage per hit
console.log(stats.combat.averageDamagePerHit);

// Max single hit
console.log(stats.combat.maxDamageHit);
```

---

## UI Components

### Tab Layout

The main application has 7 tabs for comprehensive analytics:

| Tab          | Component             | Description                                                              |
| ------------ | --------------------- | ------------------------------------------------------------------------ |
| **Live**     | `LiveDashboard.tsx`   | Real-time dashboard with hero stats, combat/defense cards, skill summary |
| **Combat**   | `CombatAnalytics.tsx` | Deep dive into hit rate, miss breakdown, damage output, KDR              |
| **Skills**   | `SkillsDeepDive.tsx`  | Full skill breakdown by category, efficiency metrics, searchable list    |
| **Loot**     | `LootAnalysis.tsx`    | Item breakdown, value distribution, loot/hour analysis                   |
| **Economy**  | `EconomyTracker.tsx`  | Profit/loss, return rate, per-hour/kill/shot efficiency, breakeven       |
| **Loadouts** | `LoadoutManager.tsx`  | Equipment loadout management                                             |
| **Sessions** | `SessionsPage.tsx`    | Session history and detailed session view                                |

### Key Features Per Tab

**Live Dashboard** - Real-time overview with status bar, hero stats row, offense/defense cards, skill summary with category bars, top skills list.

**Combat Analytics** - Hit/crit rate cards, shot accuracy visualization, miss type breakdown (dodged/evaded/missed/resisted), damage stats, kill efficiency, survivability, avoidance, healing.

**Skills Deep Dive** - Header stats, 6-metric efficiency panel, category overview with filters, searchable/sortable skill list with collapsible sections.

**Loot Analysis** - Hero stats, analysis metrics, value distribution bars, searchable items list with percentage bars.

**Economy Tracker** - Profit hero with glow effect, spent vs loot comparison, efficiency metrics, loot composition, true value analysis, breakeven progress.

---

## Files

| File                                 | Purpose                                          |
| ------------------------------------ | ------------------------------------------------ |
| `src/core/types.ts`                  | All type definitions, skill categories           |
| `src/core/parser.ts`                 | Event type normalization, LogEvent → ParsedEvent |
| `src/core/session.ts`                | Session management, stats calculation            |
| `src/hooks/useLogEvents.ts`          | React hook for receiving events                  |
| `src/hooks/useSession.ts`            | React hook for session management                |
| `src/hooks/useTotals.ts`             | Running totals accumulator                       |
| `electron/main.ts`                   | Chat.log parser, event detection                 |
| `src/components/LiveDashboard.tsx`   | Real-time live stats view                        |
| `src/components/CombatAnalytics.tsx` | Detailed combat breakdown                        |
| `src/components/SkillsDeepDive.tsx`  | Full skill analysis                              |
| `src/components/LootAnalysis.tsx`    | Loot itemization view                            |
| `src/components/EconomyTracker.tsx`  | PED flow analysis                                |
| `src/App.tsx`                        | Main app with 7-tab navigation                   |
