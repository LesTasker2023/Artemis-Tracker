# Entropia Universe Chat.log System Events

Complete catalogue of `[System]` events extracted from real chat.log data.

---

## 1. COMBAT - Damage Dealt

```
You inflicted X.X points of damage
You inflicted X.X points of damage. Target resisted some additional damage
Critical hit - Additional damage! You inflicted X.X points of damage
You missed
The target Dodged your attack
The target Evaded your attack
The target resisted all damage
Target out of range
```

## 2. COMBAT - Damage Received

```
You took X.X points of damage
Critical hit - Additional damage! You took X.X points of damage
Reduced X.X points of critical damage
Reduced X.X points of armor piercing damage
The attack missed you
You Evaded the attack
You Dodged the attack
```

## 3. COMBAT - Death Events

```
You were killed by the [adjective] [creature_name]
Your death location: [position:X$(...)$X,X,X$Death location]
You have been revived
You have been saved from certain death by divine intervention
```

**Adjectives:** abominable, agitated, angry, confused, enraged, exasperated, feral, ferocious, fierce, frantic, frenzied, furious, greedy, howling, hysterical, infuriated, inhuman, insane, loathsome, mad, manic, mean, nasty, nervous, psychotic, ravenous, resilient, revolting, ruthless, savage, shabby, smelly, tough, vengeful, vicious, vile

## 4. LOOT - Items Received

```
You received [Item Name] x (X) Value: X.XX PED
You received [Item Name] (Tier X.X) x (X) Value: X.XX PED
```

### Common Loot Categories:

- **Animal Parts:** Animal Hide, Animal Muscle Oil, Animal Eye Oil, Animal Heart Oil, etc.
- **Creature Parts:** [Creature] Skin, [Creature] Bone, [Creature] Claw, etc.
- **Ores/Ingots:** Lysterium Stone, Iron Stone, Gold Ingot, Belkar Stone, etc.
- **EnMatter:** Crude Oil, Melchi Water, Oil, etc.
- **Components:** Focus Lens Component, Electronic Stabilizing Component, etc.
- **Extractors:** Basic/Advanced/Strong Cloth/Metal/Mineral Extractor
- **Shrapnel:** Shrapnel x (X) Value: X.XX PED
- **Universal Ammo:** Universal Ammo x (X) Value: X.XX PED
- **PED:** Project Entropia Dollar x (X) Value: X.XX PED
- **Tokens:** Combat Token, Daily Token, Mayhem Token, etc.

## 5. SKILL GAINS

```
You have gained X.XXXX experience in your [Skill Name] skill
You have gained a new rank in [Skill Name]!
Congratulations, you have acquired a new skill; [Skill Name]
```

### Skills Observed:

Aim, Anatomy, Analysis, Animal Lore, Animal Taming, Athletics, BLP Weaponry Technology, Bioregenesis, Blueprint Comprehension, Carpentry, Clubs, Combat Reflexes, Computer, Concentration, Diagnosis, Dodge, Drilling, Electronics, Engineering, Evade, Explosive Projectile Weaponry Technology, Extraction, First Aid, Fragmentating, Gauss Weaponry Technology, Geology, Handgun, Heavy Melee Weapons, Heavy Weapons, Inflict Melee Damage, Inflict Ranged Damage, Jamming, Laser Weaponry Technology, Light Melee Weapons, Machinery, Manufacture Attachments, Manufacture Mechanical Equipment, Manufacture Metal Equipment, Marksmanship, Mechanics, Melee Combat, Mining, Mining Laser Operator, Mining Laser Technology, Plasma Weaponry Technology, Power Fist, Probing, Prospecting, Ranged Damage Assessment, Reclaiming, Rifle, Scan Animal, Scan Human, Scan Robot, Scourging, Skinning, Spacecraft Systems, Support Weapon Systems, Surveying, Sweat Gatherer, Tailoring, Texture Engineering, Translocation, Vehicle Repairing, Vehicle Technology, Weapons Handling, Whip, Zoology

## 6. ATTRIBUTE GAINS

```
You have gained X [Attribute]
Your [Attribute] has improved by X.XXXX
```

**Attributes:** Agility, Aim, Alertness, Bravado, Courage, Dexterity, Intelligence, Perception, Psyche, Serendipity, Stamina, Strength

## 7. MINING

```
You have claimed a resource! ([Resource Name])
This resource is depleted
```

## 8. HEALING

```
You healed yourself X.X points
You healed [Player Name] with X.X points
You were healed X.X points by [Player Name]
Healing is diminished while moving
You are not wounded
That person isn't wounded
```

## 9. EFFECTS OVER TIME (Buffs/Debuffs)

```
Received Effect Over Time: [Effect Name]
```

**Effects Observed:**

- Auto Loot
- Cold Damage
- Decreased Critical Damage
- Decreased Healing
- Decreased Reload Speed
- Divine Intervention
- Electric Damage
- Heal
- Heal Per Second
- Impact Damage
- Increased Critical Chance
- Increased Critical Damage
- Increased Health
- Increased Regeneration
- Increased Reload Speed
- Increased Run Speed
- Increased Skill Gain
- Increased Synchronization
- Slowed

## 10. EQUIPMENT - Tier Upgrades

```
Your [Item Name] (Tier X.X) has reached tier X.X
```

## 11. EQUIPMENT - Condition Warnings

```
Your [Item Name] (L) is close to reaching minimum condition, note that limited (L) items cannot be repaired
Your [Item Name] is close to reaching minimum condition, consider repairing it as soon as possible
```

## 12. EQUIPMENT - Enhancers

```
Your enhancer [Enhancer Name] on your [Item Name] broke. You have X enhancers remaining on the item. You received X.XX PED Shrapnel.
```

## 13. EQUIPMENT - Repairs

```
Item(s) repaired successfully
```

## 14. EQUIPMENT - Mindforce

```
The [Implant Name] Mindforce Implant was inserted successfully
```

## 15. VEHICLES

```
The vehicle ([Vehicle Name]) is returned to your Inventory
The vehicle ([Vehicle Name]) is returned to planet storage, where you can recover it
Vehicle took X.X points of damage
The vehicle's Structural Integrity restored by X.X
You restored the vehicle's Structural Integrity by X.X
Your vehicle is overloaded!
Your vehicle is no longer overloaded!
Unequipping to sit down
[Player Name] entered the vehicle
[Player Name] left the vehicle
```

## 16. TRANSACTIONS

```
The transaction was completed successfully
You have successfully traded with [Player Name]
You have bought the item: [Item Name]. X.XX PED has been withdrawn from your account.
Transfer complete! X.XX PED was transferred to your PED card.
[Item Name] was retrieved successfully from the auctioneer and placed in your carried Inventory.
Your auction has been removed
```

## 17. SOCIAL

```
[Player Name] has logged in
[Player Name] has logged out
You have added [Player Name] as a friend
You have already received a friend request from this person
You have lost your mentor
Team invite sent to [Player Name].
```

## 18. WAYPOINTS

```
Added waypoint to map: [position:X$(...)$X,X,X$Waypoint Name]
Removed waypoint from map: [position:X$(...)$X,X,X$Waypoint Name]
Reached waypoint was removed from map: [position:X$(...)$X,X,X$Waypoint Name]
```

## 19. VEHICLE GUEST LIST

```
You were added to the guest list of the [Vehicle Name] managed by [Player Name]
```

## 20. PVP KILLS

```
[Player A] killed [Player B] using a [Weapon Name]
```

## 21. WORLD EVENTS

```
Robot forces have launched an attack on [Location] at [position:...]
Suspected Robot harvest forces at [position:...]
The [Arena Name] has been challenged!
Wave event will be available again at YYYY-MM-DD HH:MM:SS
```

**Arena Names:** The Bull's Pen, The Heart of the Swamp, The Oasis, The Spawning Pools, The Warchief's Sanctuary

## 22. CREATURES

```
This creature is in a condition where it cannot be damaged or sweated
```

## 23. AFK STATUS

```
You are now away from keyboard
You are no longer away from keyboard
```

## 24. SESSION

```
Session time: H:MM:SS
```

## 25. SCREENSHOTS

```
Screenshot saved to: [path]
```

## 26. PETS

```
Your pet has been returned to your inventory
```

## 27. BLUEPRINT

```
Your blueprint Quality Rating has improved
```

## 28. MISCELLANEOUS

```
Request sent
The item is damaged
```

---

## Globals Channel Events (Not [System] but important)

```
[Globals] [] [Player Name] killed a creature ([Creature Name]) with a value of X PED!
[Globals] [] [Player Name] killed a creature ([Creature Name]) with a value of X PED! A record has been added to the Hall of Fame!
[Globals] [] [Player Name] found a deposit ([Resource Name]) with a value of X PED!
[Globals] [] [Player Name] found a deposit ([Resource Name]) with a value of X PED at [Location]!
[Globals] [] [Player Name] found a deposit ([Resource Name]) with a value of X PED! A record has been added to the Hall of Fame!
[Globals] [] [Player Name] constructed an item ([Item Name]) worth X PED!
```

---

## Regex Patterns for Parser

```typescript
// Damage dealt
/You inflicted ([\d.]+) points of damage/
/Critical hit.*You inflicted ([\d.]+) points of damage/

// Damage taken
/You took ([\d.]+) points of damage/
/Reduced ([\d.]+) points of (critical|armor piercing) damage/

// Combat results
/The target (Dodged|Evaded) your attack/
/You (Dodged|Evaded) the attack/
/The attack missed you/
/You missed/
/Target out of range/
/The target resisted all damage/

// Kill/Death
/You were killed by the (\w+) (.+)/
/Your death location: \[position:(\d+)\$\(([^)]+)\)\$(\d+),(\d+),(-?\d+)\$([^\]]*)\]/

// Loot
/You received (.+?) x \((\d+)\) Value: ([\d.]+) PED/
/You received (.+?) \((\d+)\)/

// Skills
/You have gained ([\d.]+) experience in your (.+) skill/
/You have gained a new rank in (.+)!/
/acquired a new skill; (.+)/

// Attributes
/You have gained (\d+) (\w+)/
/Your (\w+) has improved by ([\d.]+)/

// Mining
/You have claimed a resource! \((.+)\)/
/This resource is depleted/

// Healing
/You healed yourself ([\d.]+) points/
/You healed (.+) with ([\d.]+) points/
/You were healed ([\d.]+) points by (.+)/

// Effects
/Received Effect Over Time: (.+)/

// Equipment
/Your (.+) has reached tier ([\d.]+)/
/Your (.+) is close to reaching minimum condition/
/Your enhancer (.+) on your (.+) broke/

// Globals (from [Globals] channel)
/(.+) killed a creature \((.+?)\) with a value of (\d+) PED/
/(.+) found a deposit \((.+?)\) with a value of (\d+) PED/
```

---

## Event Priority for Tracking

**High Priority (Core tracking):**

1. Damage dealt/received
2. Kills (creature deaths)
3. Player deaths
4. Loot received
5. Skill gains

**Medium Priority (Session context):** 6. Healing events 7. Equipment tier ups 8. Mining claims 9. Effects/buffs

**Low Priority (Nice to have):** 10. Waypoints 11. Social events 12. Vehicle events 13. Transactions
