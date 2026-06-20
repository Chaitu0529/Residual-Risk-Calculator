import { Link } from 'react-router-dom';
import { PencilIcon, TrashIcon, EyeIcon } from '@heroicons/react/24/outline';
import { RiskLevelBadge, StatusBadge, CategoryBadge } from './RiskBadges';
import { useAuth } from '../../context/AuthContext';
import { format } from 'date-fns';

export default function RiskTable({ risks, onDelete }) {
  const { isAdmin } = useAuth();

  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-[900px]" role="table">
        <thead>
          <tr className="bg-gray-750">
            <th className="table-header">Title</th>
            <th className="table-header">Category</th>
            <th className="table-header text-center">Likelihood</th>
            <th className="table-header text-center">Impact</th>
            <th className="table-header text-center">Inherent</th>
            <th className="table-header text-center">Residual</th>
            <th className="table-header text-center">Level</th>
            <th className="table-header text-center">Status</th>
            <th className="table-header text-right">Actions</th>
          </tr>
        </thead>
        <tbody>
          {risks.map((risk) => (
            <tr key={risk.id} className="table-row">
              <td className="table-cell max-w-[200px]">
                <div>
                  <p className="font-medium text-white truncate" title={risk.riskTitle}>
                    {risk.riskTitle}
                  </p>
                  {risk.createdAt && (
                    <p className="text-xs text-gray-500 mt-0.5">
                      {format(new Date(risk.createdAt), 'MMM d, yyyy')}
                    </p>
                  )}
                </div>
              </td>
              <td className="table-cell">
                <CategoryBadge category={risk.category} />
              </td>
              <td className="table-cell text-center">
                <span className="font-mono text-gray-300">{risk.likelihood}</span>
              </td>
              <td className="table-cell text-center">
                <span className="font-mono text-gray-300">{risk.impact}</span>
              </td>
              <td className="table-cell text-center">
                <span className="font-mono font-semibold text-gray-200">
                  {risk.inherentRisk?.toFixed(1) ?? '—'}
                </span>
              </td>
              <td className="table-cell text-center">
                <span className="font-mono font-bold text-white">
                  {risk.residualRisk?.toFixed(1) ?? '—'}
                </span>
              </td>
              <td className="table-cell text-center">
                <RiskLevelBadge level={risk.riskLevel} />
              </td>
              <td className="table-cell text-center">
                <StatusBadge status={risk.status} />
              </td>
              <td className="table-cell text-right">
                <div className="flex items-center justify-end gap-2">
                  <Link
                    to={`/risks/${risk.id}`}
                    className="p-1.5 rounded text-gray-400 hover:text-primary-400 hover:bg-gray-700 transition-colors"
                    title="View"
                  >
                    <EyeIcon className="w-4 h-4" />
                  </Link>
                  {isAdmin && (
                    <>
                      <Link
                        to={`/risks/${risk.id}/edit`}
                        className="p-1.5 rounded text-gray-400 hover:text-yellow-400 hover:bg-gray-700 transition-colors"
                        title="Edit"
                      >
                        <PencilIcon className="w-4 h-4" />
                      </Link>
                      <button
                        onClick={() => onDelete(risk)}
                        className="p-1.5 rounded text-gray-400 hover:text-red-400 hover:bg-gray-700 transition-colors"
                        title="Delete"
                      >
                        <TrashIcon className="w-4 h-4" />
                      </button>
                    </>
                  )}
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
