/**
 * Tests for useTotals accumulator function
 */

import { describe, it, expect } from 'vitest';
import { accumulateEvent } from '../hooks/useTotals';
import type { LogEvent, Totals } from '../core/types';
import { INITIAL_TOTALS } from '../core/types';

function makeEvent(type: string, data: Record<string, unknown> = {}, category = 'combat'): LogEvent {
  return {
    timestamp: Date.now(),
    raw: `test line for ${type}`,
    category: category as LogEvent['category'],
    type,
    data,
  };
}

describe('accumulateEvent', () => {
  describe('combat events', () => {
    it('accumulates HIT damage and shot count', () => {
      const totals = accumulateEvent(INITIAL_TOTALS, makeEvent('HIT', { damage: 50 }));
      expect(totals.damageDealt).toBe(50);
      expect(totals.shots).toBe(1);
    });

    it('accumulates CRITICAL_HIT damage and shot count', () => {
      const totals = accumulateEvent(INITIAL_TOTALS, makeEvent('CRITICAL_HIT', { damage: 100 }));
      expect(totals.damageDealt).toBe(100);
      expect(totals.shots).toBe(1);
    });

    it('counts MISS as a shot without damage', () => {
      const totals = accumulateEvent(INITIAL_TOTALS, makeEvent('MISS'));
      expect(totals.damageDealt).toBe(0);
      expect(totals.shots).toBe(1);
    });

    it('counts TARGET_DODGED as a shot', () => {
      const totals = accumulateEvent(INITIAL_TOTALS, makeEvent('TARGET_DODGED'));
      expect(totals.shots).toBe(1);
    });

    it('counts TARGET_EVADED as a shot', () => {
      const totals = accumulateEvent(INITIAL_TOTALS, makeEvent('TARGET_EVADED'));
      expect(totals.shots).toBe(1);
    });

    it('counts TARGET_RESISTED as a shot', () => {
      const totals = accumulateEvent(INITIAL_TOTALS, makeEvent('TARGET_RESISTED'));
      expect(totals.shots).toBe(1);
    });

    it('counts OUT_OF_RANGE as a shot', () => {
      const totals = accumulateEvent(INITIAL_TOTALS, makeEvent('OUT_OF_RANGE'));
      expect(totals.shots).toBe(1);
    });

    it('accumulates DAMAGE_TAKEN', () => {
      const totals = accumulateEvent(INITIAL_TOTALS, makeEvent('DAMAGE_TAKEN', { damage: 25 }));
      expect(totals.damageTaken).toBe(25);
    });

    it('accumulates CRITICAL_DAMAGE_TAKEN', () => {
      const totals = accumulateEvent(INITIAL_TOTALS, makeEvent('CRITICAL_DAMAGE_TAKEN', { damage: 75 }));
      expect(totals.damageTaken).toBe(75);
    });
  });

  describe('healing events', () => {
    it('accumulates SELF_HEAL', () => {
      const totals = accumulateEvent(INITIAL_TOTALS, makeEvent('SELF_HEAL', { amount: 30 }, 'healing'));
      expect(totals.healed).toBe(30);
    });

    it('accumulates HEALED_BY', () => {
      const totals = accumulateEvent(INITIAL_TOTALS, makeEvent('HEALED_BY', { amount: 45 }, 'healing'));
      expect(totals.healed).toBe(45);
    });
  });

  describe('loot events', () => {
    it('accumulates LOOT value', () => {
      const totals = accumulateEvent(INITIAL_TOTALS, makeEvent('LOOT', { value: 12.5 }, 'loot'));
      expect(totals.lootValue).toBe(12.5);
    });

    it('handles LOOT with no value', () => {
      const totals = accumulateEvent(INITIAL_TOTALS, makeEvent('LOOT', { item: 'test' }, 'loot'));
      expect(totals.lootValue).toBe(0);
    });
  });

  describe('skill events', () => {
    it('accumulates SKILL_GAIN', () => {
      const totals = accumulateEvent(INITIAL_TOTALS, makeEvent('SKILL_GAIN', { amount: 0.5 }, 'skill'));
      expect(totals.skillGains).toBe(0.5);
    });
  });

  describe('death events', () => {
    it('counts PLAYER_DEATH', () => {
      const totals = accumulateEvent(INITIAL_TOTALS, makeEvent('PLAYER_DEATH', {}, 'death'));
      expect(totals.deaths).toBe(1);
    });
  });

  describe('multiple events', () => {
    it('accumulates across multiple events', () => {
      let totals: Totals = INITIAL_TOTALS;
      totals = accumulateEvent(totals, makeEvent('HIT', { damage: 50 }));
      totals = accumulateEvent(totals, makeEvent('HIT', { damage: 30 }));
      totals = accumulateEvent(totals, makeEvent('MISS'));
      totals = accumulateEvent(totals, makeEvent('LOOT', { value: 10 }, 'loot'));

      expect(totals.damageDealt).toBe(80);
      expect(totals.shots).toBe(3);
      expect(totals.lootValue).toBe(10);
    });
  });

  describe('unknown events', () => {
    it('ignores unknown event types', () => {
      const totals = accumulateEvent(INITIAL_TOTALS, makeEvent('UNKNOWN_TYPE', { damage: 999 }));
      expect(totals).toEqual(INITIAL_TOTALS);
    });
  });
});
