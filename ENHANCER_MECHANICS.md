# Weapon Enhancer Mechanics

Based on analysis of entropia-calc.com data with A-3 Justifier Mk. 2, Improved.

## Base Stats (No Enhancers)

- Total Damage: 72.00
- Range: 110.2m
- Critical Chance: 2.0%
- Decay: 0.2550 PEC
- Ammo Burn: 1500
- Cost: 15.2550 PEC

## Enhancer Types and Effects

### 1. Damage Enhancers

Each damage enhancer adds:

- **+10% Total Damage** (multiplicative)
- **+10% Decay** (of base weapon decay)
- **+10% Ammo Burn** (of base weapon ammo)

Examples:

- 1 damage: 79.20 dmg (+10%), 0.2805 decay, 1650 ammo
- 2 damage: 86.40 dmg (+20%), 0.3060 decay, 1800 ammo
- 3 damage: 93.60 dmg (+30%), 0.3315 decay, 1950 ammo

Formula:

```
damage = base_damage × (1 + 0.10 × damage_enhancers)
decay_increase = base_decay × 0.10 × damage_enhancers
ammo_increase = base_ammo × 0.10 × damage_enhancers
```

### 2. Accuracy Enhancers

Each accuracy enhancer adds:

- **+0.2% Critical Chance**
- No effect on decay, ammo, or cost

Examples:

- 1 accuracy: 2.2% crit (+0.2%)
- 2 accuracy: 2.4% crit (+0.4%)
- 3 accuracy: 2.6% crit (+0.6%)

Formula:

```
crit_chance = base_crit + (0.002 × accuracy_enhancers)
```

### 3. Range Enhancers

Each range enhancer adds:

- **+5% Range**
- No effect on damage, decay, or cost

Examples:

- 1 range: 115.8m (+5.1%)
- 2 range: 121.3m (+10.1%)
- 3 range: 126.8m (+15.1%)

Formula:

```
range = base_range × (1 + 0.05 × range_enhancers)
```

### 4. Economy Enhancers

Each economy enhancer provides:

- **-1.1% Decay** (multiplicative reduction)
- **-1.1% Ammo Burn** (multiplicative reduction)
- Applied AFTER other enhancer effects

Examples:

- 1 economy: 0.2522 decay (-1.1%), 1483 ammo (-1.13%)
- 2 economy: 0.2493 decay (-2.2%), 1467 ammo (-2.2%)
- 3 economy: 0.2465 decay (-3.3%), 1450 ammo (-3.3%)

Formula (applied after all other enhancers):

```
final_decay = calculated_decay × (0.989 ^ economy_enhancers)
final_ammo = calculated_ammo × (0.989 ^ economy_enhancers)
```

Note: Economy reduces by 1.1% per enhancer, so multiplier is 0.989 (1 - 0.011).

## Combined Effects

When mixing enhancer types, apply in this order:

1. **Damage enhancers** - Apply to base damage, decay, and ammo
2. **Accuracy enhancers** - Add to crit chance
3. **Range enhancers** - Apply to base range
4. **Economy enhancers** - Reduce decay and ammo (multiplicative)

### Example: 1 of Each Type

- Damage: 72 × 1.10 = 79.20 ✓
- Range: 110.2 × 1.05 = 115.71m ✓
- Crit: 2.0% + 0.2% = 2.2% ✓
- Decay: (0.2550 + 0.0255) × 0.989 = 0.2774 ✓
- Ammo: (1500 + 150) × 0.989 = 1632 ✓

### Example: 3 of Each Type

- Damage: 72 × 1.30 = 93.60 ✓
- Range: 110.2 × 1.15 = 126.73m ✓
- Crit: 2.0% + 0.6% = 2.6% ✓
- Decay: (0.2550 + 0.0765) × (0.989^3) = 0.3205 ✓
- Ammo: (1500 + 450) × (0.989^3) = 1885 ✓

## Implementation Notes

1. **10 Total Slots**: Players can mix and match any combination up to 10 enhancers
2. **Damage is multiplicative**: Each damage enhancer multiplies total damage by 1.10
3. **Economy is multiplicative**: Each economy enhancer multiplies cost by 0.989 (reduces by 1.1%)
4. **Accuracy is additive**: Each accuracy enhancer adds flat 0.2% to crit chance
5. **Range is multiplicative**: Each range enhancer multiplies range by 1.05
6. **Order matters**: Economy reductions apply AFTER damage increases
