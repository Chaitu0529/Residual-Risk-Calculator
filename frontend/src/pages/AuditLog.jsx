import { useEffect, useState, useCallback } from 'react';
import { ClipboardDocumentListIcon, MagnifyingGlassIcon } from '@heroicons/react/24/outline';
import { format } from 'date-fns';
import { auditService } from '../services/auditService';
import { FullPageSpinner } from '../components/common/Spinner';
import Pagination from '../components/common/Pagination';
import EmptyState from '../components/common/EmptyState';
import { useDebounce } from '../hooks/useDebounce';
import toast from 'react-hot-toast';

const ACTION_COLORS = {
  CREATE: 'text-green-400 bg-green-400/10',
  UPDATE: 'text-blue-400 bg-blue-400/10',
  DELETE: 'text-red-400 bg-red-400/10',
  LOGIN: 'text-purple-400 bg-purple-400/10',
  LOGOUT: 'text-gray-400 bg-gray-400/10',
  REGISTER: 'text-cyan-400 bg-cyan-400/10',
  UPLOAD: 'text-yellow-400 bg-yellow-400/10',
  EXPORT: 'text-orange-400 bg-orange-400/10',
  AI_GENERATE: 'text-primary-400 bg-primary-400/10',
};

export default function AuditLog() {
  const [logs, setLogs] = useState([]);
  const [totalPages, setTotalPages] = useState(0);
  const [totalElements, setTotalElements] = useState(0);
  const [page, setPage] = useState(0);
  const [loading, setLoading] = useState(true);
  const [usernameFilter, setUsernameFilter] = useState('');
  const debouncedUsername = useDebounce(usernameFilter, 400);

  const fetchLogs = useCallback(async () => {
    setLoading(true);
    try {
      const res = await auditService.getAll({ page, size: 20 });
      setLogs(res.data?.content || []);
      setTotalPages(res.data?.totalPages || 0);
      setTotalElements(res.data?.totalElements || 0);
    } catch {
      toast.error('Failed to load audit logs');
    } finally {
      setLoading(false);
    }
  }, [page]);

  useEffect(() => {
    fetchLogs();
  }, [fetchLogs]);

  const displayedLogs = debouncedUsername
    ? logs.filter((l) =>
        l.username?.toLowerCase().includes(debouncedUsername.toLowerCase())
      )
    : logs;

  return (
    <div className="animate-fade-in space-y-5">
      <div className="page-header">
        <div>
          <h1 className="page-title">Audit Log</h1>
          <p className="text-gray-400 text-sm mt-1">
            {totalElements} total entries — Admin view only
          </p>
        </div>
      </div>

      {/* Search */}
      <div className="card p-4">
        <div className="relative max-w-sm">
          <MagnifyingGlassIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            placeholder="Filter by username…"
            value={usernameFilter}
            onChange={(e) => setUsernameFilter(e.target.value)}
            className="input pl-9"
          />
        </div>
      </div>

      {/* Table */}
      <div className="table-container">
        {loading ? (
          <FullPageSpinner />
        ) : displayedLogs.length === 0 ? (
          <EmptyState
            title="No audit entries"
            icon={ClipboardDocumentListIcon}
          />
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full min-w-[750px]" role="table">
                <thead>
                  <tr className="bg-gray-750">
                    <th className="table-header">Timestamp</th>
                    <th className="table-header">User</th>
                    <th className="table-header">Action</th>
                    <th className="table-header">Entity</th>
                    <th className="table-header">Description</th>
                    <th className="table-header">Status</th>
                    <th className="table-header">IP</th>
                  </tr>
                </thead>
                <tbody>
                  {displayedLogs.map((log) => {
                    const actionColor = ACTION_COLORS[log.action] || 'text-gray-400 bg-gray-400/10';
                    return (
                      <tr key={log.id} className="table-row">
                        <td className="table-cell text-xs text-gray-400 whitespace-nowrap">
                          {log.timestamp
                            ? format(new Date(log.timestamp), 'MMM d, HH:mm:ss')
                            : '—'}
                        </td>
                        <td className="table-cell">
                          <span className="text-white font-medium">{log.username || '—'}</span>
                        </td>
                        <td className="table-cell">
                          <span className={`badge text-xs ${actionColor}`}>
                            {log.action}
                          </span>
                        </td>
                        <td className="table-cell text-gray-400 text-xs">
                          {log.entityType}
                          {log.entityId ? <span className="text-gray-600"> #{log.entityId}</span> : ''}
                        </td>
                        <td className="table-cell max-w-[200px]">
                          <p className="truncate text-gray-300 text-xs" title={log.description}>
                            {log.description || '—'}
                          </p>
                        </td>
                        <td className="table-cell">
                          <span
                            className={`badge text-xs ${
                              log.status === 'SUCCESS'
                                ? 'bg-green-400/10 text-green-400'
                                : 'bg-red-400/10 text-red-400'
                            }`}
                          >
                            {log.status}
                          </span>
                        </td>
                        <td className="table-cell text-xs text-gray-500 font-mono">
                          {log.ipAddress || '—'}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
            <div className="px-4 py-3 border-t border-gray-700">
              <Pagination page={page} totalPages={totalPages} onPageChange={setPage} />
            </div>
          </>
        )}
      </div>
    </div>
  );
}
