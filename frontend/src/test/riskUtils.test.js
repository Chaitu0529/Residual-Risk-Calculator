import { describe, it, expect } from 'vitest';
import {
  calcInherentRisk,
  calcResidualRisk,
  getRiskLevel,
  riskLevelBadgeClass,
  statusBadgeClass,
  formatCategory,
  formatStatus,
} from '../utils/riskUtils';

describe('calcInherentRisk', () => {
  it('multiplies likelihood × impact', () => {
    expect(calcInherentRisk(5, 6)).toBe(30);
  });

  it('returns 0 for zero inputs', () => {
    expect(calcInherentRisk(0, 10)).toBe(0);
  });
});

describe('calcResidualRisk', () => {
  it('applies control effectiveness correctly', () => {
    expect(calcResidualRisk(100, 50)).toBe(50);
  });

  it('returns inherent risk when CE is 0', () => {
    expect(calcResidualRisk(80, 0)).toBe(80);
  });

  it('returns 0 when CE is 100', () => {
    expect(calcResidualRisk(80, 100)).toBe(0);
  });
});

describe('getRiskLevel', () => {
  it('returns LOW for residual ≤ 20', () => {
    expect(getRiskLevel(15)).toBe('LOW');
    expect(getRiskLevel(20)).toBe('LOW');
  });

  it('returns MEDIUM for 21–50', () => {
    expect(getRiskLevel(21)).toBe('MEDIUM');
    expect(getRiskLevel(50)).toBe('MEDIUM');
  });

  it('returns HIGH for 51–80', () => {
    expect(getRiskLevel(51)).toBe('HIGH');
    expect(getRiskLevel(80)).toBe('HIGH');
  });

  it('returns CRITICAL for > 80', () => {
    expect(getRiskLevel(81)).toBe('CRITICAL');
    expect(getRiskLevel(100)).toBe('CRITICAL');
  });
});

describe('riskLevelBadgeClass', () => {
  it('returns badge-low for LOW', () => {
    expect(riskLevelBadgeClass('LOW')).toBe('badge-low');
  });

  it('returns badge-critical for CRITICAL', () => {
    expect(riskLevelBadgeClass('CRITICAL')).toBe('badge-critical');
  });

  it('is case-insensitive', () => {
    expect(riskLevelBadgeClass('high')).toBe('badge-high');
  });
});

describe('statusBadgeClass', () => {
  it('returns badge-open for OPEN', () => {
    expect(statusBadgeClass('OPEN')).toBe('badge-open');
  });

  it('returns badge-mitigated for MITIGATED', () => {
    expect(statusBadgeClass('MITIGATED')).toBe('badge-mitigated');
  });
});

describe('formatCategory', () => {
  it('replaces underscores and capitalises', () => {
    expect(formatCategory('HUMAN_RESOURCES')).toBe('Human Resources');
  });
});

describe('formatStatus', () => {
  it('formats IN_PROGRESS correctly', () => {
    expect(formatStatus('IN_PROGRESS')).toBe('In Progress');
  });
});
