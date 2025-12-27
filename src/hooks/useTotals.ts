/**
 * ARTEMIS v3 - Totals Accumulator Hook
 * Tracks running totals for all event types
 */

import { useState, useEffect, useCallback } from 'react';
import type { LogEvent, Totals } from '../core/types';
import { INITIAL_TOTALS } from '../core/types';

/**
 * Accumulate a single event into running totals
 * Uses RAW event types from main process (not normalized)
 */
function accumulateEvent(totals: Totals, event: LogEvent): Totals {
  const next = { ...totals };
  const d = event.data;

  switch (event.type) {
    // ==================== Combat - Offensive (counts as shot + damage) ====================
    case 'HIT':
    case 'CRITICAL_HIT':
      next.damageDealt += (d.damage as number) || 0;
      next.shots += 1;
      break;
    
    // ==================== Combat - Miss types (count as shot, no damage) ====================
    case 'MISS':
    case 'TARGET_DODGED':
    case 'TARGET_EVADED':
    case 'TARGET_RESISTED':
    case 'OUT_OF_RANGE':
      next.shots += 1;
      break;
    
    // ==================== Combat - Defensive ====================
    case 'DAMAGE_TAKEN':
    case 'CRITICAL_DAMAGE_TAKEN':
      next.damageTaken += (d.damage as number) || 0;
      break;
    
    // ==================== Healing ====================
    case 'SELF_HEAL':
    case 'HEALED_BY':
      next.healed += (d.amount as number) || 0;
      break;
    
    // ==================== Loot ====================
    case 'LOOT':
      next.lootValue += (d.value as number) || 0;
      // Infer a kill when we receive loot (creature drop)
      next.kills += 1;
      break;
    
    case 'CLAIM':
      // Mining claim - counts as loot value but not a kill
      next.lootValue += (d.value as number) || 0;
      break;
    
    // ==================== Skills ====================
    case 'SKILL_GAIN':
      next.skillGains += (d.amount as number) || 0;
      break;
    
    case 'ATTRIBUTE_GAIN':
    case 'ATTRIBUTE_IMPROVE':
      next.skillGains += (d.amount as number) || 0;
      break;
    
    // ==================== Death ====================
    case 'PLAYER_DEATH':
      next.deaths += 1;
      break;
  }

  return next;
}

export function useTotals() {
  const [totals, setTotals] = useState<Totals>(INITIAL_TOTALS);

  useEffect(() => {
    if (!window.electron) return;

    const unsubscribe = window.electron.log.onEvent((event: LogEvent) => {
      setTotals((prev) => accumulateEvent(prev, event));
    });

    return () => unsubscribe();
  }, []);

  const reset = useCallback(() => {
    setTotals(INITIAL_TOTALS);
  }, []);

  return { totals, reset };
}

// Export for testing
export { accumulateEvent };
