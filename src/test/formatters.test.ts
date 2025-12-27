/**
 * Tests for formatters
 */

import { describe, it, expect } from 'vitest';
import { formatEventData, formatTime, formatNumber } from '../core/formatters';
import type { LogEvent } from '../core/types';

function makeEvent(type: string, data: Record<string, unknown> = {}): LogEvent {
  return {
    timestamp: Date.now(),
    raw: `test line for ${type}`,
    category: 'combat',
    type,
    data,
  };
}

describe('formatEventData', () => {
  describe('combat events', () => {
    it('formats HIT', () => {
      expect(formatEventData(makeEvent('HIT', { damage: 50 }))).toBe('50 dmg');
    });

    it('formats CRITICAL_HIT', () => {
      expect(formatEventData(makeEvent('CRITICAL_HIT', { damage: 100, critical: true }))).toBe('100 dmg CRIT!');
    });

    it('formats HIT with resist', () => {
      expect(formatEventData(makeEvent('HIT', { damage: 50, resisted: true }))).toBe('50 dmg (resisted)');
    });

    it('formats MISS', () => {
      expect(formatEventData(makeEvent('MISS'))).toBe('Missed');
    });

    it('formats DAMAGE_TAKEN', () => {
      expect(formatEventData(makeEvent('DAMAGE_TAKEN', { damage: 25 }))).toBe('Took 25 dmg');
    });
  });

  describe('loot events', () => {
    it('formats LOOT with value', () => {
      expect(formatEventData(makeEvent('LOOT', { item: 'Animal Oil', quantity: 5, value: 0.5 }))).toBe('Animal Oil x5 (0.5 PED)');
    });

    it('formats LOOT without value', () => {
      expect(formatEventData(makeEvent('LOOT', { item: 'Shrapnel', quantity: 100 }))).toBe('Shrapnel x100');
    });
  });

  describe('skill events', () => {
    it('formats SKILL_GAIN', () => {
      expect(formatEventData(makeEvent('SKILL_GAIN', { amount: 0.5, skill: 'Laser Weaponry Technology' }))).toBe('+0.5 Laser Weaponry Technology');
    });

    it('formats SKILL_RANK', () => {
      expect(formatEventData(makeEvent('SKILL_RANK', { skill: 'Evade' }))).toBe('New rank: Evade');
    });
  });

  describe('mining events', () => {
    it('formats CLAIM', () => {
      expect(formatEventData(makeEvent('CLAIM', { resource: 'Lysterium' }))).toBe('Claimed: Lysterium');
    });

    it('formats NO_FIND', () => {
      expect(formatEventData(makeEvent('NO_FIND'))).toBe('No find');
    });
  });

  describe('death events', () => {
    it('formats PLAYER_DEATH', () => {
      expect(formatEventData(makeEvent('PLAYER_DEATH', { adjective: 'deadly', creature: 'Atrox' }))).toBe('Killed by deadly Atrox');
    });
  });

  describe('unknown events', () => {
    it('returns truncated raw for unknown type', () => {
      const event = makeEvent('SOME_NEW_EVENT');
      event.raw = 'This is a very long raw message that should be truncated';
      expect(formatEventData(event).length).toBeLessThanOrEqual(80);
      expect(formatEventData(event)).toBe('This is a very long raw message that should be truncated');
    });
  });
});

describe('formatTime', () => {
  it('formats timestamp to HH:MM:SS', () => {
    const ts = new Date('2024-01-15T14:30:45').getTime();
    expect(formatTime(ts)).toBe('14:30:45');
  });
});

describe('formatNumber', () => {
  it('formats small numbers', () => {
    expect(formatNumber(123.456)).toBe('123.5');
  });

  it('formats numbers >= 1000 with k suffix', () => {
    expect(formatNumber(1500)).toBe('1.5k');
  });

  it('formats large numbers', () => {
    expect(formatNumber(25000)).toBe('25.0k');
  });

  it('formats zero', () => {
    expect(formatNumber(0)).toBe('0.0');
  });
});
