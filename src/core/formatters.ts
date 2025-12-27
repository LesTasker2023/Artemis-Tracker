/**
 * ARTEMIS v3 - Event Formatter
 */

import type { LogEvent } from './types';

export function formatEventData(event: LogEvent): string {
  const d = event.data;
  switch (event.type) {
    // Combat
    case 'HIT':
    case 'CRITICAL_HIT':
      return `${d.damage} dmg${d.critical ? ' CRIT!' : ''}${d.resisted ? ' (resisted)' : ''}`;
    case 'MISS':
      return 'Missed';
    case 'DAMAGE_TAKEN':
    case 'CRITICAL_DAMAGE_TAKEN':
      return `Took ${d.damage} dmg${d.critical ? ' CRIT!' : ''}`;
    case 'DAMAGE_REDUCED':
      return `Reduced ${d.amount} ${d.damageType} dmg`;
    case 'TARGET_DODGED':
      return 'Target dodged';
    case 'TARGET_EVADED':
      return 'Target evaded';
    case 'TARGET_RESISTED':
      return 'Target resisted all';
    case 'PLAYER_EVADED':
      return 'You evaded';
    case 'PLAYER_DODGED':
      return 'You dodged';
    case 'ENEMY_MISSED':
      return 'Enemy missed';
    case 'OUT_OF_RANGE':
      return 'Out of range';
    // Death
    case 'PLAYER_DEATH':
      return `Killed by ${d.adjective} ${d.creature}`;
    case 'DEATH_LOCATION':
      return `Death at [${d.x}, ${d.y}]`;
    case 'REVIVED':
      return 'Revived';
    case 'DIVINE_INTERVENTION':
      return 'Divine intervention!';
    // Loot
    case 'LOOT':
      return `${d.item} x${d.quantity}${d.value ? ` (${d.value} PED)` : ''}`;
    // Skills
    case 'SKILL_GAIN':
      return `+${d.amount} ${d.skill}`;
    case 'SKILL_RANK':
      return `New rank: ${d.skill}`;
    case 'SKILL_ACQUIRED':
      return `New skill: ${d.skill}`;
    case 'ATTRIBUTE_GAIN':
    case 'ATTRIBUTE_IMPROVE':
      return `+${d.amount} ${d.attribute}`;
    // Mining
    case 'CLAIM':
      return `Claimed: ${d.resource}`;
    case 'DEPLETED':
      return 'Resource depleted';
    case 'NO_FIND':
      return 'No find';
    // Healing
    case 'SELF_HEAL':
      return `Healed ${d.amount} HP`;
    case 'HEAL_OTHER':
      return `Healed ${d.target} ${d.amount} HP`;
    case 'HEALED_BY':
      return `Healed ${d.amount} HP by ${d.healer}`;
    case 'HEAL_DIMINISHED':
      return 'Healing diminished (moving)';
    // Effects
    case 'BUFF':
    case 'DEBUFF':
      return `[${event.type}] ${d.effect}`;
    // Equipment
    case 'TIER_UP':
      return `${d.item} -> Tier ${d.tier}`;
    case 'LOW_CONDITION':
    case 'LOW_CONDITION_LIMITED':
      return `[WARN] ${d.item} low condition`;
    case 'ENHANCER_BROKE':
      return `[BROKE] ${d.enhancer} (${d.remaining} left)`;
    case 'REPAIRED':
      return 'Items repaired';
    // Globals
    case 'GLOBAL_KILL':
    case 'GLOBAL_HOF':
      return `${d.player}: ${d.creature} (${d.value} PED)${d.hof ? ' [HOF]' : ''}`;
    case 'GLOBAL_MINING':
    case 'GLOBAL_MINING_HOF':
      return `${d.player}: ${d.resource} (${d.value} PED)${d.hof ? ' [HOF]' : ''}`;
    case 'GLOBAL_CRAFT':
      return `${d.player}: ${d.item} (${d.value} PED)`;
    // Vehicle
    case 'VEHICLE_DAMAGE':
      return `Vehicle took ${d.damage} dmg`;
    case 'VEHICLE_RETURNED':
      return `${d.vehicle} returned`;
    case 'VEHICLE_REPAIRED':
      return `Vehicle repaired +${d.amount}`;
    // Social
    case 'PLAYER_LOGIN':
      return `${d.player} logged in`;
    case 'PLAYER_LOGOUT':
      return `${d.player} logged out`;
    case 'TRADE_COMPLETE':
      return `Traded with ${d.player}`;
    // Position
    case 'POSITION':
      return `[${d.x}, ${d.y}] ${d.planet}${d.label ? ` - ${d.label}` : ''}`;
    case 'WAYPOINT_ADDED':
      return 'Waypoint added';
    case 'WAYPOINT_REMOVED':
      return 'Waypoint removed';
    // Transaction
    case 'PED_TRANSFER':
      return `Transferred ${d.amount} PED`;
    case 'ITEM_BOUGHT':
      return `Bought ${d.item} for ${d.cost} PED`;
    // System
    case 'SESSION_TIME':
      return `Session: ${d.hours}h ${d.minutes}m ${d.seconds}s`;
    case 'AFK_ON':
      return 'AFK on';
    case 'AFK_OFF':
      return 'AFK off';
    default:
      return event.raw.substring(0, 80);
  }
}

export function formatTime(ts: number): string {
  return new Date(ts).toLocaleTimeString('en-US', {
    hour12: false,
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  });
}

export function formatNumber(n: number): string {
  return n >= 1000 ? `${(n / 1000).toFixed(1)}k` : n.toFixed(1);
}
