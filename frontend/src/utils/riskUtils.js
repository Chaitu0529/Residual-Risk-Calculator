/**
 * Utility helpers for risk calculations and display.
 */

export function calcInherentRisk(likelihood, impact) {
  const l = Number(likelihood) || 0;
  const i = Number(impact) || 0;
  return l * i;
}

export function calcResidualRisk(inherentRisk, controlEffectiveness) {
  const ir = Number(inherentRisk) || 0;
  const ce = Number(controlEffectiveness) || 0;
  return ir * (100 - ce) / 100;
}

export function getRiskLevel(residualRisk) {
  const r = Number(residualRisk) || 0;
  if (r <= 20) return 'LOW';
  if (r <= 50) return 'MEDIUM';
  if (r <= 80) return 'HIGH';
  return 'CRITICAL';
}

export function riskLevelColor(level) {
  switch (level?.toUpperCase()) {
    case 'LOW':      return 'text-risk-low';
    case 'MEDIUM':   return 'text-risk-medium';
    case 'HIGH':     return 'text-risk-high';
    case 'CRITICAL': return 'text-risk-critical';
    default:         return 'text-gray-400';
  }
}

export function riskLevelBadgeClass(level) {
  switch (level?.toUpperCase()) {
    case 'LOW':      return 'badge-low';
    case 'MEDIUM':   return 'badge-medium';
    case 'HIGH':     return 'badge-high';
    case 'CRITICAL': return 'badge-critical';
    default:         return 'badge bg-gray-700 text-gray-300';
  }
}

export function statusBadgeClass(status) {
  switch (status?.toUpperCase()) {
    case 'OPEN':        return 'badge-open';
    case 'IN_PROGRESS': return 'badge-in_progress';
    case 'MITIGATED':   return 'badge-mitigated';
    case 'ACCEPTED':    return 'badge-accepted';
    case 'CLOSED':      return 'badge-closed';
    default:            return 'badge bg-gray-700 text-gray-300';
  }
}

export function formatCategory(cat) {
  if (!cat) return '';
  return cat
    .toLowerCase()
    .replace(/_/g, ' ')
    .replace(/\b\w/g, c => c.toUpperCase());
}

export function formatStatus(status) {
  if (!status) return '';
  return status
    .toLowerCase()
    .replace(/_/g, ' ')
    .replace(/\b\w/g, c => c.toUpperCase());
}

export function riskLevelBg(level) {
  switch (level?.toUpperCase()) {
    case 'LOW':      return 'bg-risk-low/10 border-risk-low/30';
    case 'MEDIUM':   return 'bg-risk-medium/10 border-risk-medium/30';
    case 'HIGH':     return 'bg-risk-high/10 border-risk-high/30';
    case 'CRITICAL': return 'bg-risk-critical/10 border-risk-critical/30';
    default:         return 'bg-gray-700/30 border-gray-600';
  }
}

export function riskLevelHex(level) {
  switch (level?.toUpperCase()) {
    case 'LOW':      return '#22c55e';
    case 'MEDIUM':   return '#f59e0b';
    case 'HIGH':     return '#f97316';
    case 'CRITICAL': return '#ef4444';
    default:         return '#6b7280';
  }
}
