# Entropia Universe Loadout Mechanics

Complete documentation of cost, decay, damage, and enhancer calculations.
**Verified against EntropiaNexus control application.**

---

## Currency System

- **100 PEC = 1 PED** (Project Entropia Cent / Dollar)
- Decay in API/JSON is stored as PEC
- Internal calculations use PED, display converts to PEC

---

## Base Equipment Stats

### Weapon Properties

| Property     | Description                                              |
| ------------ | -------------------------------------------------------- |
| `Decay`      | PEC lost per shot                                        |
| `AmmoBurn`   | Ammo units consumed per shot                             |
| `MaxTT`      | Maximum Trade Terminal value (full durability)           |
| `MinTT`      | Minimum TT value (repair threshold for unlimited items)  |
| `Range`      | Effective distance in meters                             |
| `Efficiency` | Affects loot composition (higher = more ammo in returns) |

### Amplifier Properties

Same as weapon, but damage enhancers do NOT affect amp decay or ammo.

---

## Weapon Enhancers (10 Slots Total)

| Type         | Effect per Enhancer                                     | Ammo Cost per Shot   |
| ------------ | ------------------------------------------------------- | -------------------- |
| **Damage**   | +10% weapon damage, +10% weapon decay, +10% weapon ammo | 103 PEC (0.0103 PED) |
| **Economy**  | -1.1% decay (multiplicative) on weapon AND amp          | 0 PEC                |
| **Range**    | +5% range (multiplicative)                              | 0 PEC                |
| **Accuracy** | +0.2% crit chance (additive)                            | 0 PEC                |

---

## Core Formulas

### Multipliers

```
DamageMultiplier = 1 + (DamageEnhancers × 0.10)
EconomyMultiplier = 0.989 ^ EconomyEnhancers
RangeMultiplier = 1 + (RangeEnhancers × 0.05)
```

### Cost Per Shot

```
WeaponAmmoCost = AmmoBurn × DamageMultiplier × EconomyMultiplier × 0.0001 PED
WeaponDecayCost = Decay × DamageMultiplier × EconomyMultiplier

WeaponCost = WeaponAmmoCost + WeaponDecayCost

AmpCost = (AmmoBurn × 0.0001) + (Decay × EconomyMultiplier)

EnhancerCost = DamageEnhancers × 0.0103 PED

TotalCost = WeaponCost + AmpCost + EnhancerCost
```

**Important:** Damage enhancers only affect WEAPON costs, not amp costs.
Economy enhancers affect BOTH weapon and amp decay.

### Total Decay Display

```
ModifiedWeaponDecay = WeaponDecay × DamageMultiplier × EconomyMultiplier
ModifiedAmpDecay = AmpDecay × EconomyMultiplier

TotalDecay = ModifiedWeaponDecay + ModifiedAmpDecay
```

### Total Uses (Limiting Factor)

```
WeaponUses = (WeaponMaxTT - WeaponMinTT) / ModifiedWeaponDecay
AmpUses = (AmpMaxTT - AmpMinTT) / ModifiedAmpDecay

TotalUses = MIN(WeaponUses, AmpUses)
```

**Key Insight:** Whichever equipment piece runs out first determines practical Total Uses.

### Damage

```
BaseDamage = WeaponDamage + AmpDamage
EnhancedDamage = (WeaponDamage × DamageMultiplier) + AmpDamage
```

**Note:** Damage enhancers only boost WEAPON damage, not amp damage.

### Range

```
Range = WeaponBaseRange × RangeMultiplier
```

### Critical Chance

```
CritChance = BaseCrit + (AccuracyEnhancers × 0.002)
```

### DPP (Damage Per PED)

```
DPP = EnhancedDamage / TotalCost
```

---

## Worked Examples

### Example 1: ArMatrix BC-30 (L) + B-Amp 20P (L) + 3 Damage Enhancers

**Base Stats:**

- Weapon: Decay 0.896 PEC, Ammo 1105, MaxTT 65, MinTT 1.95
- Amp: Decay 0.32 PEC, Ammo 420, MaxTT 40, MinTT 1.2

**Calculations:**

| Step                  | Formula                | Result                        |
| --------------------- | ---------------------- | ----------------------------- |
| Damage Multiplier     | 1 + (3 × 0.10)         | **1.30**                      |
| Modified Weapon Decay | 0.00896 × 1.30         | **0.011648 PED**              |
| Modified Amp Decay    | 0.0032 (unchanged)     | **0.0032 PED**                |
| Total Decay           | 0.011648 + 0.0032      | **0.014848 PED = 1.4848 PEC** |
| Weapon Uses           | (65 - 1.95) / 0.011648 | **5,414**                     |
| Amp Uses              | (40 - 1.2) / 0.0032    | **12,125**                    |
| Total Uses            | MIN(5414, 12125)       | **5,412** (weapon limited)    |

### Example 2: A-3 Justifier + Omegaton A105 + 10 Damage Enhancers

**Base Stats:**

- Weapon: Decay 0.255 PEC, Ammo 1500, MaxTT 1000, MinTT 30
- Amp: Decay 0.473 PEC, Ammo 362, MaxTT 184, MinTT 0

**Calculations:**

| Step                  | Formula              | Result                      |
| --------------------- | -------------------- | --------------------------- |
| Damage Multiplier     | 1 + (10 × 0.10)      | **2.00**                    |
| Modified Weapon Decay | 0.00255 × 2.0        | **0.0051 PED**              |
| Modified Amp Decay    | 0.00473 (unchanged)  | **0.00473 PED**             |
| Total Decay           | 0.0051 + 0.00473     | **0.00983 PED = 0.983 PEC** |
| Weapon Uses           | (1000 - 30) / 0.0051 | **190,196**                 |
| Amp Uses              | (184 - 0) / 0.00473  | **38,900**                  |
| Total Uses            | MIN(190196, 38900)   | **38,900** (amp limited)    |

---

## Implementation Notes

1. **10 Total Slots**: Players can mix and match any combination up to 10 enhancers total
2. **Damage is multiplicative**: Each damage enhancer multiplies weapon stats by 1.10
3. **Economy is multiplicative**: Each economy enhancer multiplies decay by 0.989 (reduces by 1.1%)
4. **Accuracy is additive**: Each accuracy enhancer adds flat 0.2% to crit chance
5. **Range is multiplicative**: Each range enhancer multiplies range by 1.05
6. **Order of operations**:
   - First: Apply damage enhancer multiplier to weapon
   - Then: Apply economy enhancer multiplier to both weapon and amp
7. **Amp protection**: Amp decay/ammo is NOT affected by damage enhancers
8. **Limiting factor**: Total Uses shows whichever equipment runs out first

---

## Data Sources

- Equipment data: EntropiaNexus API (`api.entropianexus.com`)
- Formulas verified against: EntropiaNexus loadout calculator
- Last verified: January 2026
