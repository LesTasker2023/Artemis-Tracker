# ARTEMIS Stats Audit

**Complete list of all statistics generated from session data**

---

## 📊 DASHBOARD TAB

### Hero Stats (Top 4 Cards)

1. **Return Rate** = `(lootValue / totalCost) × 100`

   - With Markup: `(lootValueWithMarkup / totalCost) × 100`
   - Color: Green ≥100%, Yellow ≥90%, Red <90%

2. **Profit/Loss** = `lootValue - totalCost`

   - With Markup: `lootValueWithMarkup - totalCost`
   - totalCost = `totalSpend + manualArmorCost + manualFapCost + manualMiscCost`
   - Color: Green if ≥0, Red if <0

3. **Kills** = Count of kills (inferred from loot drops)

   - Unit: `kills/hr` = `(kills / duration) × 3600`

4. **Hit Rate** = `(hits / shots) × 100`
   - Unit: `hits/shots`
   - Color: Green ≥70%, Yellow ≥50%, Red <50%

### Economy Panel (7 Stats)

5. **Total Spent** = `totalSpend` (ammo + weapon decay + enhancers)
6. **Total Loot** = `lootValue` (or `lootValueWithMarkup` if markup enabled)
7. **PED/Hour** = `(profit / duration) × 3600`
8. **Cost/Kill** = `totalSpend / kills`
9. **Loot/Kill** = `lootValue / kills`
10. **Armor Decay** = `armorHits × (decayPerHit / 100)`
11. **FAP Decay** = `healCount × (decayPerHeal / 100)`

### Globals/HOFs Row

12. **Global Count** = Count of global events (filtered by player name)
13. **HOF Count** = Count of HOF events (filtered by player name)

### Expandable Details - Combat

14. **Criticals** = Count of critical hits
15. **Crit Rate** = `(criticals / hits) × 100`
16. **Damage Dealt** = Sum of all damage_dealt events
17. **DPS** = `damageDealt / combatDuration`
    - combatDuration = time from first shot to last shot
18. **Deaths** = Count of death events

### Expandable Details - Efficiency

19. **Cost/Shot** = `totalSpend / shots`
20. **Ammo Used** = Count of ammo-consuming events
21. **Avg Dmg/Hit** = `damageDealt / hits`
22. **Dmg Reduced** = Sum of damage_reduced events
23. **Self Healed** = Sum of self_heal events

### Loadout Comparison (if multiple loadouts)

24. **Per-Loadout Return Rate** = `(loadout.lootValue / loadout.spend) × 100`
    - Breakdown by loadout ID showing shots and return %

---

## ⚔️ COMBAT TAB

### Hero Stats (Top 4 Cards)

25. **Hit Rate** = `(hits / shots) × 100`

    - Unit: `hits / shots`
    - Same as Dashboard #4

26. **Crit Rate** = `(criticals / hits) × 100`

    - Unit: `criticals` count
    - Same as Dashboard #15

27. **Kills** = Total kills

    - Unit: `kills/hr`
    - Same as Dashboard #3

28. **K/D Ratio** = `kills / deaths` (or just `kills` if deaths = 0)
    - Unit: `killsK / deathsD`
    - Color: Green ≥10, Yellow ≥1, Red <1

### Shot Accuracy Visualization

29. **Hits Percentage** = `(hits / shots) × 100`
30. **Misses Percentage** = `100 - hitRate`

### Quick Stats Row (5 Stats)

31. **Combat DPS** = `damageDealt / combatDuration`
32. **Avg Dmg/Hit** = `damageDealt / hits`
33. **Dmg/Kill** = `damageDealt / kills`
34. **Total Damage** = `damageDealt` sum
35. **Ammo Used** = `ammoConsumed` count

### Expandable Details - Offense

36. **Total Shots** = `combat.totalShots`
37. **Hits** = `combat.hits`
38. **Misses** = `combat.misses`
39. **Critical Hits** = `combat.criticals`
40. **Critical Damage** = `combat.criticalDamage`
41. **Max Single Hit** = `combat.maxDamageHit`

### Expandable Details - Defense

42. **Deaths** = `combat.deaths`
43. **Damage Taken** = `combat.damageTaken`
44. **Damage Reduced** = `combat.damageReduced`
45. **Your Dodges** = `combat.playerDodges`
46. **Your Evades** = `combat.playerEvades`
47. **Self Healed** = `combat.selfHealing`

---

## 📈 SKILLS TAB

### Hero Stats (Top 4 Cards)

48. **Skills Gained** = `skills.totalSkillGains`

    - Total skill points accumulated

49. **Per Hour** = `skillEfficiency.skillPerHour`

    - Formula: `(totalSkillGains / duration) × 3600`

50. **Per PED** = `skillEfficiency.skillPerPedSpent`

    - Formula: `totalSkillGains / totalSpend`

51. **Per Kill** = `skillEfficiency.skillPerKill`
    - Formula: `totalSkillGains / kills`

### Progress Summary (4 Stats)

52. **Skill Events** = `skills.totalSkillEvents`

    - Count of all skill gain events

53. **Rank Ups** = `skills.skillRanks`

    - Count of rank-up events

54. **New Skills** = `skills.newSkillsUnlocked`

    - Count of skill_acquired events

55. **Unique Skills** = Count of unique skill names
    - `Object.keys(skills.bySkill).length`

### Combat Improvement (2 Progress Bars)

56. **Hit Rate** = `(hits / shots) × 100`

    - Same as Combat #25

57. **Crit Rate** = `(criticals / hits) × 100`
    - Same as Combat #26

### Combat Stats Indicators

58. **Kills** = Total kills
59. **DPS** = Combat DPS

### Top Skills Visual (Top 5 Skills)

For each skill (ranked 1-5): 60. **Skill Name** = From `skills.bySkill[skillName]` 61. **Total Gain** = `skill.totalGain` 62. **Event Count** = `skill.gainCount` 63. **Avg Per Event** = `skill.totalGain / skill.gainCount`

### All Skills List (Remaining Skills)

64. **Rank** = Position in sorted list
65. **Skill Name** = Skill identifier
66. **Event Count** = Number of times skill gained
67. **Total Gain** = Total points for that skill

---

## 🪟 POPOUT WINDOW

### Available Stats (from stat-definitions.ts)

#### COMBAT Category

68. **kills** = `d.kills`
69. **shots** = `d.shots`
70. **hits** = `d.hits`
71. **hitRate** = `(d.hits / d.shots) × 100`
72. **criticals** = `d.criticals`
73. **critRate** = `(d.criticals / d.hits) × 100`
74. **deaths** = `d.deaths`
75. **kdr** = `d.kills / d.deaths` (or `d.kills` if deaths = 0)
76. **damageDealt** = `d.damageDealt`
77. **damageTaken** = `d.damageTaken`
78. **damageReduced** = `d.damageReduced`
79. **deflects** = `d.deflects`

#### ECONOMY Category

80. **netProfit** = `d.netProfit` (or `d.netProfitWithMarkup` if markup enabled)

    - Formula: `lootValue - totalCost - decay`

81. **lootValue** = `d.lootValue` (or `d.lootValueWithMarkup` if markup)
82. **returnRate** = `d.returnRate` (or `d.returnRateWithMarkup` if markup)
83. **weaponCost** = `d.weaponCost` (ammo + weapon decay + enhancers)
84. **totalCost** = `d.totalCost` (weapon + armor + fap + misc costs)

#### SKILLS Category

85. **skillGains** = `d.skillGains`
86. **skillEvents** = `d.skillEvents`
87. **avgSkillPerEvent** = `d.skillGains / d.skillEvents`

#### EFFICIENCY Category

88. **killsPerHour** = `(d.kills / d.duration) × 3600`
89. **lootPerHour** = `(lootValue / d.duration) × 3600`
90. **skillPerHour** = `(d.skillGains / d.duration) × 3600`
91. **profitPerHour** = `(d.profit / d.duration) × 3600`
92. **avgLootPerKill** = `lootValue / d.kills`
93. **costPerKill** = `(d.totalSpend + d.decay) / d.kills`
94. **costPerHour** = `((d.totalSpend + d.decay) / d.duration) × 3600`
95. **dps** = Realistic DPS calculation
    - If `usesPerMinute` available: `(damageDealt / shots) × (usesPerMinute / 60)`
    - Formula: Average damage per shot × weapon firing rate
    - Fallback: `damageDealt / duration` (session average)
96. **dpp** = Realistic DPP calculation
    - If `usesPerMinute` available: `(damageDealt / shots) / [(totalSpend / shots) × 100]`
    - Formula: Average damage per shot / cost per shot in PEC
    - Fallback: `damageDealt / (totalSpend × 100)` (session average)
    - Shows damage efficiency per PEC spent

#### TIME Category

97. **duration** = Formatted as `H:MM:SS` or `M:SS`
    - Raw value: `endTime - startTime - pausedTime`

---

## 🧮 DERIVED CALCULATIONS

### Base Calculations

- **totalSpend** = `Σ(loadout.shots × loadout.costPerShot)`

  - costPerShot includes: ammo burn + weapon decay + amp decay + scope decay + sight decay + enhancer costs

- **totalCost** = `totalSpend + manualArmorCost + manualFapCost + manualMiscCost`

- **decay** = `armorDecay + fapDecay`

  - armorDecay = `armorHits × (decayPerHit / 100)` [PEC → PED conversion]
  - fapDecay = `healCount × (decayPerHeal / 100)` [PEC → PED conversion]
  - armorHits = `damage_taken events + deflect events`

- **profit** = `lootValue - totalCost`

- **netProfit** = `profit - decay` = `lootValue - totalCost - decay`

- **returnRate** = `(lootValue / totalCost) × 100`

### Markup Adjustments (when enabled)

- **markupValue** = `Σ(item.ttValue × (item.markupPercent - 100) / 100)`

  - Per item: `itemValue × ((markup% - 100) / 100)`
  - Uses markup library or default 100% (no markup)

- **lootValueWithMarkup** = `lootValue + markupValue`

- **profitWithMarkup** = `lootValueWithMarkup - totalCost`

- **netProfitWithMarkup** = `profitWithMarkup - decay`

- **returnRateWithMarkup** = `(lootValueWithMarkup / totalCost) × 100`

### Combat Metrics

- **hitRate** = `(hits / shots) × 100`

- **critRate** = `(criticals / hits) × 100`

- **averageDamagePerHit** = `damageDealt / hits`

- **combatDPS** = `damageDealt / combatDuration`

  - combatDuration = `(lastCombatTime - firstCombatTime) / 1000`
  - Excludes idle time between combat

- **kdr** = `deaths > 0 ? kills / deaths : kills`

### Kill Inference

- **kills** = Count of inferred kills
  - Logic: If damage events occurred before loot event, count as kill
  - Also includes explicit kill events

### Time Calculations

- **duration** = `(endTime - startTime - totalPausedTime - currentPauseDuration) / 1000`

  - Excludes all paused time
  - Converts milliseconds to seconds

- **hoursPlayed** = `duration / 3600`

### Efficiency Ratios

- **skillPerPedSpent** = `totalSkillGains / totalSpend`
- **skillPerShot** = `totalSkillGains / shots`
- **skillPerHour** = `totalSkillGains / hoursPlayed`
- **skillPerKill** = `totalSkillGains / kills`
- **avgSkillPerEvent** = `totalSkillGains / totalSkillEvents`

---

## 📋 EVENT TYPES TRACKED

### Combat - Offensive

- `damage_dealt` - Hit with damage amount
- `miss` - Simple miss
- `target_dodged` - Target dodged attack
- `target_evaded` - Target evaded attack
- `target_resisted` - Target resisted damage
- `out_of_range` - Shot out of range

### Combat - Defensive

- `damage_taken` - Damage received
- `damage_reduced` - Damage absorbed by armor
- `deflect` - Full armor deflection
- `player_dodged` - You dodged enemy attack
- `player_evaded` - You evaded enemy attack
- `enemy_missed` - Enemy missed you

### Healing

- `self_heal` - Healed yourself (FAP usage)
- `healed_by` - Healed by teammate
- `heal_other` - Healed teammate

### Loot

- `loot` - Item looted with value
- `mining_claim` - Mining claim value

### Skills

- `skill_gain` - Skill increased
- `attribute_gain` - Attribute increased
- `skill_rank` - Rank up event
- `skill_acquired` - New skill unlocked

### Globals

- `global` - Global loot event
- `global_mining` - Mining global
- `global_craft` - Crafting global
- `hof` - Hall of Fame event
- `hof_mining` - Mining HOF

### Other

- `death` - Player death

---

## 🎯 STAT CATEGORIZATION

### By Display Location

- **Dashboard Only**: Economy panel stats, loadout comparison
- **Combat Only**: Detailed offense/defense breakdowns
- **Skills Only**: Per-skill tracking, category breakdown
- **Popout Only**: Configurable tile selection
- **Shared**: Hit rate, kills, DPS, crit rate, profit, return rate

### By Category

- **Combat (23)**: Shots, hits, misses, kills, criticals, damage, dodges, evades, deflects, deaths, KDR, accuracy, crits
- **Economy (15)**: Loot value, spend, costs, profit, return rate, decay, markup values
- **Skills (11)**: Skill gains, events, ranks, new skills, per-skill breakdown, efficiency ratios
- **Time (1)**: Duration with pause exclusion
- **Efficiency (14)**: Per-hour rates, per-kill averages, per-PED ratios, DPS, DPP

### By Complexity

- **Raw Counts (18)**: kills, shots, hits, misses, deaths, criticals, deflects, etc.
- **Simple Ratios (15)**: Hit rate, crit rate, KDR, avg per kill/hour/event
- **Compound Calculations (12)**: Return rate, profit, DPS, skill efficiency
- **Markup-Dependent (5)**: Markup-adjusted loot, profit, return rate values
- **Loadout-Dependent (4)**: Per-loadout breakdowns, cost per shot variations

---

## 💡 TOTAL STAT COUNT: **97 unique statistics**

**Breakdown by Source:**

- Dashboard: 24 stats
- Combat: 47 stats (includes detailed breakdowns)
- Skills: 67 stats (includes per-skill tracking)
- Popout: 97 stats (configurable, includes all categories)

**Note**: Many stats appear in multiple locations but are calculated once and reused.
