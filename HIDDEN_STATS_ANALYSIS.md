## CALCULATED BUT NOT DISPLAYED STATS

### **Combat Breakdown Stats**

**Available in `stats.combat` but NOT shown on configurable dashboard or main areas:**

1. **targetMissed** - Simple misses (not dodge/evade)
   - Status: ✅ SHOWN in LiveDashboard
2. **targetResisted** - Attacks resisted by target
   - Status: ✅ SHOWN in LiveDashboard but NOT selectable for hero stats
3. **maxDamageHit** - Highest single hit damage
   - Status: ✅ SHOWN in CombatAnalytics page
   - Status: ❌ NOT in configurable hero stats
4. **ammoConsumed** - Total ammo consumed (calculated from shots)
   - Status: ✅ SHOWN in Dashboard but calculated separately
   - Status: ❌ NOT in hero stats
5. **totalIncomingAttacks** - Total attacks against you
   - Status: ❌ FULLY HIDDEN - calculated but never displayed
6. **armorHits** - Attacks that hit armor (damage_taken + deflects)
   - Status: ❌ FULLY HIDDEN - calculated but never displayed
7. **healthRegen** - Natural/passive health regeneration
   - Status: ❌ FULLY HIDDEN - defined but never populated/displayed
8. **healCount** - Number of heal actions (for FAP decay)
   - Status: ❌ FULLY HIDDEN - calculated but never displayed
9. **killsInferred** - Kills inferred from loot patterns
   - Status: ✅ Used for `stats.kills` but value itself not shown

---

### **Skill Breakdown Stats**

**Available in `stats.skills` but NOT displayed individually:**

1. **skillRanks** - New ranks achieved
   - Status: ✅ SHOWN in SkillsProgress and LiveDashboard
2. **newSkillsUnlocked** - New skills acquired
   - Status: ✅ SHOWN in SkillsProgress, LiveDashboard, SkillsDeepDive
3. **byCategory** - Total skill gains per category (combat, attributes, profession, support, other)
   - Status: ❌ FULLY HIDDEN - available in breakdown but never displayed
   - Categories tracked: combat, attributes, profession, support, other
4. **bySkill** - Per-skill breakdown with stats for each individual skill
   - Status: ❌ MOSTLY HIDDEN - only shown in SkillsDeepDive detail view
   - Contains: skillName, totalGain, gainCount, averageGain, firstGain timestamp, lastGain timestamp

---

### **Loot Breakdown Stats**

**Available in `stats.loot` but NOT displayed:**

1. **byItem** - Detailed breakdown per item (itemName, count, totalValue, quantity)
   - Status: ✅ SHOWN in LootAnalysis component with detailed view
2. **shrapnelValue** - Special tracking for shrapnel (always received as loot)
   - Status: ❌ FULLY HIDDEN - calculated but never displayed
3. **ammoValue** - Universal ammo received (excluded from real loot but tracked)
   - Status: ❌ FULLY HIDDEN - calculated but never displayed
4. **uniqueItems** - Count of different item types
   - Status: ❌ FULLY HIDDEN - calculated but never displayed

---

### **Efficiency Metrics**

**Available in `stats.skillEfficiency` but NOT displayed:**

1. **skillPerPedSpent** - Skill points per PED spent
   - Status: ✅ Available as "Skills/PED" in hero stats selector
2. **skillPerShot** - Skill points per shot fired
   - Status: ❌ CALCULATED BUT NOT DISPLAYED ANYWHERE
3. **skillPerHour** - Skill points per hour
   - Status: ✅ Available as "Skills/Hour" in hero stats
4. **skillPerKill** - Skill points per kill
   - Status: ✅ Available as "Skills/Kill" in hero stats
5. **skillPerLoot** - Skill points per PED of loot
   - Status: ❌ CALCULATED BUT NOT DISPLAYED ANYWHERE
6. **skillToLootRatio** - Skill value vs loot value comparison
   - Status: ❌ CALCULATED BUT NOT DISPLAYED ANYWHERE
7. **avgSkillPerEvent** - Average skill gain per event
   - Status: ❌ CALCULATED BUT NOT DISPLAYED ANYWHERE

---

### **Main Defensive Stats NOT in Hero Stats Selector**

Even though these are displayed in LiveDashboard/other views, they're NOT available as configurable hero stats:

- **playerDodges** - You dodged incoming attacks
- **playerEvades** - You evaded incoming attacks
- **enemyMisses** - Enemy missed you
- **damageReduced** - Armor/buff damage reduction
- **deflects** - Armor fully deflected the attack
- **healingReceived** - Healing you received
- **healingGiven** - Healing you gave to others
- **selfHealing** - Healing you performed on yourself

---

### **Suggested Hidden Stats to Expose**

**Quick Wins (Low Priority, Data Already Visible):**

- Skill category breakdown (combat, attributes, profession, etc.)
- Shrapnel value
- Unique items count
- Total incoming attacks
- Armor hits count

**Medium Priority (Useful Metrics):**

- skillPerShot (skill efficiency per shot)
- skillPerLoot (skill vs loot ratio)
- skillToLootRatio (comparison metric)
- avgSkillPerEvent (average skill per gain)
- healCount (heal actions taken)

**High Priority (Missing Key Defensive Insights):**

- totalIncomingAttacks (critical for dodge/evade/miss analysis)
- armorHits (shows how much armor was engaged)
- healthRegen (passive healing received)
- Enemy miss rate calculation (misses / totalIncomingAttacks as %)

---

### **Summary**

**Currently Displayed:** ~15-20 stats
**Calculated But Hidden:** ~25-30 stats
**Total Available:** 40-50 stats

**Key Gap:** Many defensive and efficiency metrics exist but aren't surfaced to the user. The live dashboard shows some, but the configurable hero stats (top 3 cards) only expose a subset.
