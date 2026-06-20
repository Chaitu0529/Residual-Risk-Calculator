import { riskLevelBadgeClass, statusBadgeClass, formatCategory, formatStatus } from '../../utils/riskUtils';

export function RiskLevelBadge({ level }) {
  return (
    <span className={riskLevelBadgeClass(level)}>
      {level}
    </span>
  );
}

export function StatusBadge({ status }) {
  return (
    <span className={statusBadgeClass(status)}>
      {formatStatus(status)}
    </span>
  );
}

export function CategoryBadge({ category }) {
  return (
    <span className="badge bg-gray-700 text-gray-300">
      {formatCategory(category)}
    </span>
  );
}
