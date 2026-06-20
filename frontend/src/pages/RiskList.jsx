import { useEffect, useState, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { PlusIcon, MagnifyingGlassIcon, FunnelIcon, XMarkIcon } from '@heroicons/react/24/outline';
import toast from 'react-hot-toast';
import { riskService, CATEGORIES, STATUSES, RISK_LEVELS } from '../services/riskService';
import { useAuth } from '../context/AuthContext';
import { useDebounce } from '../hooks/useDebounce';
import RiskTable from '../components/risks/RiskTable';
import Pagination from '../components/common/Pagination';
import ConfirmModal from '../components/common/ConfirmModal';
import { FullPageSpinner } from '../components/common/Spinner';
import EmptyState from '../components/common/EmptyState';
import { ShieldExclamationIcon } from '@heroicons/react/24/outline';

const PAGE_SIZE = 10;

export default function RiskList() {
  const { isAdmin } = useAuth();
  const [risks, setRisks] = useState([]);
  const [totalPages, setTotalPages] = useState(0);
  const [totalElements, setTotalElements] = useState(0);
  const [page, setPage] = useState(0);
  const [loading, setLoading] = useState(true);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleting, setDeleting] = useState(false);
  const [showFilters, setShowFilters] = useState(false);

  const [keyword, setKeyword] = useState('');
  const [category, setCategory] = useState('');
  const [status, setStatus] = useState('');
  const [riskLevel, setRiskLevel] = useState('');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');

  const debouncedKeyword = useDebounce(keyword, 400);

  const hasFilters = !!(category || status || riskLevel || dateFrom || dateTo || debouncedKeyword);

  const fetchRisks = useCallback(async () => {
    setLoading(true);
    try {
      const params = {
        page,
        size: PAGE_SIZE,
        ...(debouncedKeyword && { keyword: debouncedKeyword }),
        ...(category && { category }),
        ...(status && { status }),
        ...(riskLevel && { riskLevel }),
        ...(dateFrom && { dateFrom }),
        ...(dateTo && { dateTo }),
      };

      const isSearching = debouncedKeyword || category || status || riskLevel || dateFrom || dateTo;
      const res = isSearching
        ? await riskService.search(params)
        : await riskService.getAll(params);

      setRisks(res.data?.content || []);
      setTotalPages(res.data?.totalPages || 0);
      setTotalElements(res.data?.totalElements || 0);
    } catch {
      toast.error('Failed to load risk records');
    } finally {
      setLoading(false);
    }
  }, [page, debouncedKeyword, category, status, riskLevel, dateFrom, dateTo]);

  useEffect(() => {
    setPage(0);
  }, [debouncedKeyword, category, status, riskLevel, dateFrom, dateTo]);

  useEffect(() => {
    fetchRisks();
  }, [fetchRisks]);

  const clearFilters = () => {
    setKeyword('');
    setCategory('');
    setStatus('');
    setRiskLevel('');
    setDateFrom('');
    setDateTo('');
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      await riskService.delete(deleteTarget.id);
      toast.success(`"${deleteTarget.riskTitle}" deleted`);
      setDeleteTarget(null);
      fetchRisks();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Delete failed');
    } finally {
      setDeleting(false);
    }
  };

  return (
    <div className="animate-fade-in space-y-5">
      {/* Header */}
      <div className="page-header">
        <div>
          <h1 className="page-title">Risk Records</h1>
          <p className="text-gray-400 text-sm mt-1">
            {totalElements} record{totalElements !== 1 ? 's' : ''} total
          </p>
        </div>
        {isAdmin && (
          <Link to="/risks/new" className="btn-primary">
            <PlusIcon className="w-4 h-4" />
            New Risk
          </Link>
        )}
      </div>

      {/* Search Bar */}
      <div className="card p-4 space-y-4">
        <div className="flex gap-3">
          <div className="relative flex-1">
            <MagnifyingGlassIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search by title, description, category…"
              value={keyword}
              onChange={(e) => setKeyword(e.target.value)}
              className="input pl-9"
            />
            {keyword && (
              <button
                onClick={() => setKeyword('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-white"
                aria-label="Clear search"
              >
                <XMarkIcon className="w-4 h-4" />
              </button>
            )}
          </div>
          <button
            onClick={() => setShowFilters(!showFilters)}
            className={`btn ${showFilters || hasFilters ? 'btn-primary' : 'btn-secondary'} relative`}
          >
            <FunnelIcon className="w-4 h-4" />
            Filters
            {hasFilters && (
              <span className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 rounded-full text-xs flex items-center justify-center">
                !
              </span>
            )}
          </button>
          {hasFilters && (
            <button onClick={clearFilters} className="btn-ghost">
              <XMarkIcon className="w-4 h-4" />
              Clear
            </button>
          )}
        </div>

        {/* Filters Panel */}
        {showFilters && (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 pt-2 border-t border-gray-700">
            <div>
              <label className="label">Category</label>
              <select value={category} onChange={(e) => setCategory(e.target.value)} className="select">
                <option value="">All Categories</option>
                {CATEGORIES.map((c) => (
                  <option key={c} value={c}>{c.replace(/_/g, ' ')}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="label">Status</label>
              <select value={status} onChange={(e) => setStatus(e.target.value)} className="select">
                <option value="">All Statuses</option>
                {STATUSES.map((s) => (
                  <option key={s} value={s}>{s.replace(/_/g, ' ')}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="label">Risk Level</label>
              <select value={riskLevel} onChange={(e) => setRiskLevel(e.target.value)} className="select">
                <option value="">All Levels</option>
                {RISK_LEVELS.map((l) => (
                  <option key={l} value={l}>{l}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="label">From Date</label>
              <input type="date" value={dateFrom} onChange={(e) => setDateFrom(e.target.value)} className="input" />
            </div>
            <div>
              <label className="label">To Date</label>
              <input type="date" value={dateTo} onChange={(e) => setDateTo(e.target.value)} className="input" />
            </div>
          </div>
        )}
      </div>

      {/* Table */}
      <div className="table-container">
        {loading ? (
          <FullPageSpinner />
        ) : risks.length === 0 ? (
          <EmptyState
            title="No risk records found"
            message={hasFilters ? 'Try adjusting your filters or search terms.' : 'Start by creating your first risk record.'}
            icon={ShieldExclamationIcon}
            action={
              isAdmin && !hasFilters ? (
                <Link to="/risks/new" className="btn-primary">
                  <PlusIcon className="w-4 h-4" />
                  Create First Risk
                </Link>
              ) : undefined
            }
          />
        ) : (
          <>
            <RiskTable risks={risks} onDelete={setDeleteTarget} />
            <div className="px-4 py-3 border-t border-gray-700">
              <Pagination page={page} totalPages={totalPages} onPageChange={setPage} />
            </div>
          </>
        )}
      </div>

      {/* Delete Confirm */}
      <ConfirmModal
        isOpen={!!deleteTarget}
        title="Delete Risk Record"
        message={`Are you sure you want to delete "${deleteTarget?.riskTitle}"? This action cannot be undone.`}
        onConfirm={handleDelete}
        onCancel={() => setDeleteTarget(null)}
        confirmLabel={deleting ? 'Deleting…' : 'Delete'}
      />
    </div>
  );
}
