/**
 * Stat Definitions for Configurable Popout Tiles
 * Each stat has a key, label, icon, formatting function, and optional color logic
 */

import {
  Target,
  DollarSign,
  Skull,
  Crosshair,
  TrendingUp,
  Zap,
  Shield,
  Package,
  Clock,
  ArrowDownRight,
  Heart,
  Flame,
  Activity,
  Percent,
  Timer,
  Swords,
  type LucideIcon,
} from "lucide-react";
import { colors } from "../ui";

export interface StatValue {
  value: string | number;
  unit?: string;
  color: string;
  numericValue: number; // For charts
}

export interface StatDefinition {
  key: string;
  label: string;
  icon: LucideIcon;
  category: "combat" | "economy" | "skills" | "efficiency" | "time" | "hourly";
  description: string;
  getValue: (data: StatData) => StatValue;
}

export interface StatData {
  // Raw values from LiveStats
  profit: number;
  netProfit: number;
  shots: number;
  hits: number;
  kills: number;
  deaths: number;
  criticals: number;
  lootValue: number;
  totalSpend: number;
  weaponCost?: number;
  armorCost?: number;
  fapCost?: number;
  totalCost?: number;
  returnRate: number;
  damageDealt: number;
  damageTaken: number;
  damageReduced: number;
  deflects: number;
  decay: number;
  armorDecay?: number;
  fapDecay?: number;
  repairBill: number;
  skillGains: number;
  skillEvents: number;
  duration: number;
  totalEvents?: number; // Total log events count
  // Weapon stats for realistic DPS
  usesPerMinute?: number;  // Attack speed from active loadout
  // Markup-adjusted values
  lootValueWithMarkup?: number;
  netProfitWithMarkup?: number;
  returnRateWithMarkup?: number;
  markupEnabled?: boolean;
  // UI state passed from popout
  showMarkup?: boolean;
}

// Color helper functions
const profitColor = (val: number) => (val >= 0 ? colors.success : colors.danger);
const returnColor = (val: number) =>
  val >= 100 ? colors.success : val >= 85 ? colors.warning : colors.danger;
const hitRateColor = (val: number) =>
  val >= 70 ? colors.success : val >= 50 ? colors.warning : colors.danger;
const critColor = (val: number) => (val >= 10 ? colors.warning : colors.textPrimary);
const kdrColor = (val: number) =>
  val >= 10 ? colors.success : val >= 1 ? colors.warning : colors.danger;

// Format helpers
const formatPed = (val: number) => val.toFixed(2);
const formatPercent = (val: number) => `${val.toFixed(1)}%`;
const formatDecimal = (val: number, decimals = 2) => val.toFixed(decimals);

export const STAT_DEFINITIONS: StatDefinition[] = [
  // ==================== COMBAT ====================
  {
    key: "kills",
    label: "KILLS",
    icon: Skull,
    category: "combat",
    description: "Total creatures killed",
    getValue: (d) => ({
      value: d.kills,
      color: colors.warning,
      numericValue: d.kills,
    }),
  },
  {
    key: "shots",
    label: "SHOTS",
    icon: Crosshair,
    category: "combat",
    description: "Total shots fired",
    getValue: (d) => ({
      value: d.shots,
      color: colors.info,
      numericValue: d.shots,
    }),
  },
  {
    key: "hits",
    label: "HITS",
    icon: Target,
    category: "combat",
    description: "Shots that hit target",
    getValue: (d) => ({
      value: d.hits,
      color: colors.success,
      numericValue: d.hits,
    }),
  },
  {
    key: "hitRate",
    label: "HIT RATE",
    icon: Target,
    category: "combat",
    description: "Accuracy percentage",
    getValue: (d) => {
      const rate = d.shots > 0 ? (d.hits / d.shots) * 100 : 0;
      return {
        value: formatPercent(rate),
        unit: `${d.hits}/${d.shots}`,
        color: hitRateColor(rate),
        numericValue: rate,
      };
    },
  },
  {
    key: "criticals",
    label: "CRITS",
    icon: Zap,
    category: "combat",
    description: "Critical hits landed",
    getValue: (d) => ({
      value: d.criticals,
      color: colors.warning,
      numericValue: d.criticals,
    }),
  },
  {
    key: "critRate",
    label: "CRIT RATE",
    icon: Zap,
    category: "combat",
    description: "Critical hit percentage",
    getValue: (d) => {
      const rate = d.hits > 0 ? (d.criticals / d.hits) * 100 : 0;
      return {
        value: formatPercent(rate),
        unit: `${d.criticals} crits`,
        color: critColor(rate),
        numericValue: rate,
      };
    },
  },
  {
    key: "deaths",
    label: "DEATHS",
    icon: Heart,
    category: "combat",
    description: "Times you died",
    getValue: (d) => ({
      value: d.deaths,
      color: d.deaths > 0 ? colors.danger : colors.success,
      numericValue: d.deaths,
    }),
  },
  {
    key: "kdr",
    label: "K/D RATIO",
    icon: Shield,
    category: "combat",
    description: "Kill to death ratio",
    getValue: (d) => {
      const kdr = d.deaths > 0 ? d.kills / d.deaths : d.kills;
      return {
        value: formatDecimal(kdr, 1),
        unit: `${d.kills}K/${d.deaths}D`,
        color: kdrColor(kdr),
        numericValue: kdr,
      };
    },
  },
  {
    key: "damageDealt",
    label: "DMG DEALT",
    icon: Swords,
    category: "combat",
    description: "Total damage dealt",
    getValue: (d) => ({
      value: formatDecimal(d.damageDealt, 0),
      color: colors.warning,
      numericValue: d.damageDealt,
    }),
  },
  {
    key: "damageTaken",
    label: "DMG TAKEN",
    icon: Shield,
    category: "combat",
    description: "Total damage received",
    getValue: (d) => ({
      value: formatDecimal(d.damageTaken, 0),
      color: colors.danger,
      numericValue: d.damageTaken,
    }),
  },
  {
    key: "damageReduced",
    label: "DMG BLOCKED",
    icon: Shield,
    category: "combat",
    description: "Damage absorbed by armor",
    getValue: (d) => ({
      value: formatDecimal(d.damageReduced, 0),
      color: colors.info,
      numericValue: d.damageReduced,
    }),
  },
  {
    key: "deflects",
    label: "DEFLECTS",
    icon: Shield,
    category: "combat",
    description: "Full armor deflections",
    getValue: (d) => ({
      value: d.deflects,
      color: colors.success,
      numericValue: d.deflects,
    }),
  },

  // ==================== ECONOMY ====================
  {
    key: "netProfit",
    label: "PROFIT",
    icon: DollarSign,
    category: "economy",
    description: "Net profit after all costs (loot - spent - armor decay)",
    getValue: (d) => {
      const profit = d.showMarkup && d.markupEnabled && d.netProfitWithMarkup !== undefined
        ? d.netProfitWithMarkup
        : d.netProfit;
      return {
        value: `${profit >= 0 ? "+" : ""}${formatPed(profit)}`,
        unit: "PED",
        color: profitColor(profit),
        numericValue: profit,
      };
    },
  },
  {
    key: "lootValue",
    label: "LOOT VALUE",
    icon: Package,
    category: "economy",
    description: "Total loot collected",
    getValue: (d) => {
      const loot = d.showMarkup && d.markupEnabled && d.lootValueWithMarkup !== undefined
        ? d.lootValueWithMarkup
        : d.lootValue;
      return {
        value: formatPed(loot),
        unit: "PED",
        color: colors.success,
        numericValue: loot,
      };
    },
  },
  {
    key: "returnRate",
    label: "RETURN RATE",
    icon: TrendingUp,
    category: "economy",
    description: "Loot vs spend percentage",
    getValue: (d) => {
      const rate = d.showMarkup && d.markupEnabled && d.returnRateWithMarkup !== undefined
        ? d.returnRateWithMarkup
        : d.returnRate;
      return {
        value: formatPercent(rate),
        color: returnColor(rate),
        numericValue: rate,
      };
    },
  },
  {
    key: "weaponCost",
    label: "WEAPON COST",
    icon: Crosshair,
    category: "economy",
    description: "Ammo + weapon decay + enhancers",
    getValue: (d) => ({
      value: (d.weaponCost ?? 0).toFixed(5),
      unit: "PED",
      color: colors.danger,
      numericValue: d.weaponCost ?? 0,
    }),
  },
  // DISABLED: Armor decay calculation needs work
  // {
  //   key: "armorCost",
  //   label: "ARMOR COST",
  //   icon: Shield,
  //   category: "economy",
  //   description: "Armor decay cost",
  //   getValue: (d) => ({
  //     value: (d.armorCost ?? 0).toFixed(5),
  //     unit: "PED",
  //     color: colors.danger,
  //     numericValue: d.armorCost ?? 0,
  //   }),
  // },
  // DISABLED: FAP decay calculation needs work
  // {
  //   key: "fapCost",
  //   label: "FAP COST",
  //   icon: Heart,
  //   category: "economy",
  //   description: "FAP decay cost",
  //   getValue: (d) => ({
  //     value: (d.fapCost ?? 0).toFixed(5),
  //     unit: "PED",
  //     color: colors.danger,
  //     numericValue: d.fapCost ?? 0,
  //   }),
  // },
  {
    key: "totalCost",
    label: "TOTAL COST",
    icon: DollarSign,
    category: "economy",
    description: "Total weapon ammo costs",
    getValue: (d) => ({
      value: (d.totalCost ?? 0).toFixed(5),
      unit: "PED",
      color: colors.danger,
      numericValue: d.totalCost ?? 0,
    }),
  },
  // DISABLED: Repair bill calculation needs work
  // {
  //   key: "repairBill",
  //   label: "REPAIR BILL",
  //   icon: Wrench,
  //   category: "economy",
  //   description: "Est. repair cost (excludes L items)",
  //   getValue: (d) => ({
  //     value: formatPed(d.repairBill),
  //     unit: "PED",
  //     color: colors.danger,
  //     numericValue: d.repairBill,
  //   }),
  // },

  // ==================== SKILLS ====================
  {
    key: "skillGains",
    label: "SKILL GAINS",
    icon: TrendingUp,
    category: "skills",
    description: "Total skill points gained",
    getValue: (d) => ({
      value: `+${formatDecimal(d.skillGains, 4)}`,
      unit: "pts",
      color: colors.purple,
      numericValue: d.skillGains,
    }),
  },
  {
    key: "skillEvents",
    label: "SKILL EVENTS",
    icon: Activity,
    category: "skills",
    description: "Number of skill gain events",
    getValue: (d) => ({
      value: d.skillEvents,
      color: colors.info,
      numericValue: d.skillEvents,
    }),
  },
  {
    key: "avgSkillPerEvent",
    label: "AVG/EVENT",
    icon: Percent,
    category: "skills",
    description: "Average skill gain per event",
    getValue: (d) => {
      const avg = d.skillEvents > 0 ? d.skillGains / d.skillEvents : 0;
      return {
        value: `+${formatDecimal(avg, 6)}`,
        color: colors.purple,
        numericValue: avg,
      };
    },
  },

  // ==================== HOURLY RATES ====================
  {
    key: "killsPerHour",
    label: "KILLS/HR",
    icon: Timer,
    category: "hourly",
    description: "Kill rate per hour",
    getValue: (d) => {
      const rate = d.duration > 0 ? (d.kills / d.duration) * 3600 : 0;
      return {
        value: formatDecimal(rate, 1),
        color: colors.warning,
        numericValue: rate,
      };
    },
  },
  {
    key: "lootPerHour",
    label: "LOOT/HR",
    icon: Clock,
    category: "hourly",
    description: "Loot collected per hour",
    getValue: (d) => {
      const loot = d.showMarkup && d.markupEnabled && d.lootValueWithMarkup !== undefined
        ? d.lootValueWithMarkup
        : d.lootValue;
      const rate = d.duration > 0 ? (loot / d.duration) * 3600 : 0;
      return {
        value: formatDecimal(rate, 0),
        unit: "PED",
        color: colors.success,
        numericValue: rate,
      };
    },
  },
  {
    key: "skillPerHour",
    label: "SKILL/HR",
    icon: TrendingUp,
    category: "hourly",
    description: "Skill points gained per hour",
    getValue: (d) => {
      const rate = d.duration > 0 ? (d.skillGains / d.duration) * 3600 : 0;
      return {
        value: `+${formatDecimal(rate, 4)}`,
        color: colors.purple,
        numericValue: rate,
      };
    },
  },
  {
    key: "profitPerHour",
    label: "PROFIT/HR",
    icon: DollarSign,
    category: "hourly",
    description: "Net profit per hour",
    getValue: (d) => {
      const rate = d.duration > 0 ? (d.profit / d.duration) * 3600 : 0;
      return {
        value: `${rate >= 0 ? "+" : ""}${formatDecimal(rate, 0)}`,
        unit: "PED",
        color: profitColor(rate),
        numericValue: rate,
      };
    },
  },
  {
    key: "avgLootPerKill",
    label: "LOOT/KILL",
    icon: Package,
    category: "efficiency",
    description: "Average loot value per kill",
    getValue: (d) => {
      const loot = d.showMarkup && d.markupEnabled && d.lootValueWithMarkup !== undefined
        ? d.lootValueWithMarkup
        : d.lootValue;
      const avg = d.kills > 0 ? loot / d.kills : 0;
      return {
        value: formatDecimal(avg, 2),
        unit: "PED",
        color: colors.success,
        numericValue: avg,
      };
    },
  },
  {
    key: "costPerKill",
    label: "COST/KILL",
    icon: ArrowDownRight,
    category: "efficiency",
    description: "Average cost per kill (spend + decay)",
    getValue: (d) => {
      const totalCost = d.totalSpend + d.decay;
      const avg = d.kills > 0 ? totalCost / d.kills : 0;
      return {
        value: formatDecimal(avg, 2),
        unit: "PED",
        color: colors.danger,
        numericValue: avg,
      };
    },
  },
  {
    key: "costPerHour",
    label: "COST/HR",
    icon: ArrowDownRight,
    category: "hourly",
    description: "Cost per hour (spend + decay)",
    getValue: (d) => {
      const totalCost = d.totalSpend + d.decay;
      const rate = d.duration > 0 ? (totalCost / d.duration) * 3600 : 0;
      return {
        value: formatDecimal(rate, 0),
        unit: "PED",
        color: colors.danger,
        numericValue: rate,
      };
    },
  },
  {
    key: "dps",
    label: "DPS",
    icon: Flame,
    category: "efficiency",
    description: "Realistic damage per second (avgDmg × firing rate)",
    getValue: (d) => {
      // Calculate using realistic formula: (avgDamagePerShot) × (usesPerMin / 60)
      if (d.usesPerMinute && d.usesPerMinute > 0 && d.shots > 0) {
        const avgDmgPerShot = d.damageDealt / d.shots;
        const dps = avgDmgPerShot * (d.usesPerMinute / 60);
        return {
          value: formatDecimal(dps, 1),
          unit: "realistic",
          color: colors.warning,
          numericValue: dps,
        };
      }
      // Fallback: use combat duration if usesPerMinute not available
      const dps = d.duration > 0 ? d.damageDealt / d.duration : 0;
      return {
        value: formatDecimal(dps, 1),
        unit: "session avg",
        color: colors.warning,
        numericValue: dps,
      };
    },
  },
  {
    key: "dpp",
    label: "DPP",
    icon: Swords,
    category: "efficiency",
    description: "Realistic damage per PEC (DPS / cost per second)",
    getValue: (d) => {
      // Realistic formula matching DPS: (actual dmg efficiency) × (firing rate)
      if (d.usesPerMinute && d.usesPerMinute > 0 && d.shots > 0) {
        const avgDmgPerShot = d.damageDealt / d.shots;
        const costPerShotPEC = (d.totalSpend / d.shots) * 100; // PED to PEC
        const dpp = avgDmgPerShot / costPerShotPEC;
        return {
          value: formatDecimal(dpp, 2),
          unit: "dmg/PEC",
          color: colors.warning,
          numericValue: dpp,
        };
      }
      // Fallback: simple damage per PEC spent
      const totalSpendPEC = d.totalSpend * 100;
      const dpp = totalSpendPEC > 0 ? d.damageDealt / totalSpendPEC : 0;
      return {
        value: formatDecimal(dpp, 2),
        unit: "session avg",
        color: colors.warning,
        numericValue: dpp,
      };
    },
  },
  {
    key: "duration",
    label: "DURATION",
    icon: Clock,
    category: "time",
    description: "Session duration",
    getValue: (d) => {
      const hours = Math.floor(d.duration / 3600);
      const mins = Math.floor((d.duration % 3600) / 60);
      const secs = d.duration % 60;
      const formatted =
        hours > 0
          ? `${hours}:${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`
          : `${mins}:${secs.toString().padStart(2, "0")}`;
      return {
        value: formatted,
        color: colors.textPrimary,
        numericValue: d.duration,
      };
    },
  },

  // ==================== ADDITIONAL HOURLY ====================
  {
    key: "dmgPerHour",
    label: "DMG/HR",
    icon: Swords,
    category: "hourly",
    description: "Damage output per hour",
    getValue: (d) => {
      const rate = d.duration > 0 ? (d.damageDealt / d.duration) * 3600 : 0;
      return {
        value: formatDecimal(rate, 0),
        color: colors.warning,
        numericValue: rate,
      };
    },
  },

  // ==================== ADDITIONAL EFFICIENCY ====================
  {
    key: "shotsPerKill",
    label: "SHOTS/KILL",
    icon: Crosshair,
    category: "efficiency",
    description: "Average shots needed per kill",
    getValue: (d) => {
      const avg = d.kills > 0 ? d.shots / d.kills : 0;
      return {
        value: formatDecimal(avg, 1),
        color: colors.info,
        numericValue: avg,
      };
    },
  },
  {
    key: "avgDmgPerHit",
    label: "DMG/HIT",
    icon: Target,
    category: "efficiency",
    description: "Average damage per successful hit",
    getValue: (d) => {
      const avg = d.hits > 0 ? d.damageDealt / d.hits : 0;
      return {
        value: formatDecimal(avg, 1),
        color: colors.warning,
        numericValue: avg,
      };
    },
  },
  {
    key: "killsPerPed",
    label: "KILLS/PED",
    icon: Skull,
    category: "efficiency",
    description: "Kills per PED spent",
    getValue: (d) => {
      const rate = d.totalSpend > 0 ? d.kills / d.totalSpend : 0;
      return {
        value: formatDecimal(rate, 2),
        color: colors.warning,
        numericValue: rate,
      };
    },
  },
  {
    key: "skillsPerKill",
    label: "SKILLS/KILL",
    icon: TrendingUp,
    category: "skills",
    description: "Average skill gains per kill",
    getValue: (d) => {
      const rate = d.kills > 0 ? d.skillGains / d.kills : 0;
      return {
        value: `+${formatDecimal(rate, 4)}`,
        color: colors.purple,
        numericValue: rate,
      };
    },
  },
  {
    key: "skillsPerPed",
    label: "SKILLS/PED",
    icon: TrendingUp,
    category: "skills",
    description: "Skill gains per PED spent",
    getValue: (d) => {
      const rate = d.totalSpend > 0 ? d.skillGains / d.totalSpend : 0;
      return {
        value: `+${formatDecimal(rate, 4)}`,
        color: colors.purple,
        numericValue: rate,
      };
    },
  },
  {
    key: "totalEvents",
    label: "EVENTS",
    icon: Activity,
    category: "time",
    description: "Total log events recorded",
    getValue: (d) => ({
      value: d.totalEvents ?? 0,
      color: colors.textPrimary,
      numericValue: d.totalEvents ?? 0,
    }),
  },
];

// Create lookup map for easy access
export const STAT_MAP = new Map(STAT_DEFINITIONS.map((s) => [s.key, s]));

// Group by category for settings UI
export const STATS_BY_CATEGORY = {
  combat: STAT_DEFINITIONS.filter((s) => s.category === "combat"),
  economy: STAT_DEFINITIONS.filter((s) => s.category === "economy"),
  skills: STAT_DEFINITIONS.filter((s) => s.category === "skills"),
  efficiency: STAT_DEFINITIONS.filter((s) => s.category === "efficiency"),
  hourly: STAT_DEFINITIONS.filter((s) => s.category === "hourly"),
  time: STAT_DEFINITIONS.filter((s) => s.category === "time"),
};

// Default tile configuration
export const DEFAULT_TILE_CONFIG = [
  "netProfit",
  "returnRate",
  "kills",
  "hitRate",
];

// Default expanded dashboard configuration
export const DEFAULT_EXPANDED_HERO = [
  "netProfit",
  "returnRate",
  "kills",
  "hitRate",
];

export const DEFAULT_EXPANDED_GRID = [
  "shots",
  "criticals",
  "damageDealt",
  "lootValue",
  "totalSpend",
  "decay",
  "deflects",
  "skillGains",
];
