import { useEffect, useState, useCallback } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import {
  PencilIcon,
  TrashIcon,
  ArrowLeftIcon,
  PaperClipIcon,
  CloudArrowUpIcon,
} from '@heroicons/react/24/outline';
import toast from 'react-hot-toast';
import { riskService } from '../services/riskService';
import { useAuth } from '../context/AuthContext';
import { FullPageSpinner } from '../components/common/Spinner';
import ConfirmModal from '../components/common/ConfirmModal';
import AiPanel from '../components/risks/AiPanel';
import { RiskLevelBadge, StatusBadge, CategoryBadge } from '../components/risks/RiskBadges';
import { riskLevelBg, formatCategory, formatStatus } from '../utils/riskUtils';
import { format } from 'date-fns';

function InfoRow({ label, value }) {
  return (
    <div className="flex justify-between items-start gap-4 py-2.5 border-b border-gray-700 last:border-0">
      <span className="text-gray-400 text-sm flex-shrink-0 w-40">{label}</span>
      <span className="text-gray-200 text-sm text-right">{value ?? '—'}</span>
    </div>
  );
}

function ScoreBlock({ label, value, color }) {
  return (
    <div className={`rounded-xl p-4 border ${color} text-center`}>
      <p className="text-xs text-gray-400 mb-1">{label}</p>
      <p className="text-2xl font-bold text-white">{typeof value === 'number' ? value.toFixed(1) : value ?? '—'}</p>
    </div>
  );
}

export default function RiskDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { isAdmin } = useAuth();
  const [risk, setRisk] = useState(null);
  const [loading, setLoading] = useState(true);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [uploading, setUploading] = useState(false);

  const fetchRisk = useCallback(async () => {
    try {
      const res = await riskService.getById(id);
      setRisk(res.data);
    } catch (err) {
      if (err.response?.status === 404) {
        toast.error('Risk record not found');
        navigate('/risks');
      } else {
        toast.error('Failed to load risk record');
      }
    } finally {
      setLoading(false);
    }
  }, [id, navigate]);

  useEffect(() => {
    fetchRisk();
  }, [fetchRisk]);

  const handleDelete = async () => {
    try {
      await riskService.delete(id);
      toast.success('Risk record deleted');
      navigate('/risks');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Delete failed');
    }
  };

  const handleFileUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const allowed = ['application/pdf', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'];
    if (!allowed.includes(file.type)) {
      toast.error('Only PDF and DOCX files are allowed');
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      toast.error('File must be under 5 MB');
      return;
    }
    setUploading(true);
    try {
      await riskService.uploadFile(id, file);
      toast.success('File uploaded successfully');
      fetchRisk();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Upload failed');
    } finally {
      setUploading(false);
      e.target.value = '';
    }
  };

  if (loading) return <FullPageSpinner />;
  if (!risk) return null;

  const levelBg = riskLevelBg(risk.riskLevel);

  return (
    <div className="animate-fade-in space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-start gap-3">
          <button
            onClick={() => navigate('/risks')}
            className="btn-ghost p-2 mt-0.5"
            aria-label="Back to list"
          >
            <ArrowLeftIcon className="w-5 h-5" />
          </button>
          <div>
            <h1 className="text-2xl font-bold text-white">{risk.riskTitle}</h1>
            <div className="flex items-center gap-2 mt-2 flex-wrap">
              <CategoryBadge category={risk.category} />
              <RiskLevelBadge level={risk.riskLevel} />
              <StatusBadge status={risk.status} />
            </div>
          </div>
        </div>
        {isAdmin && (
          <div className="flex gap-2 flex-shrink-0">
            <Link to={`/risks/${id}/edit`} className="btn-secondary">
              <PencilIcon className="w-4 h-4" /> Edit
            </Link>
            <button onClick={() => setDeleteOpen(true)} className="btn-danger">
              <TrashIcon className="w-4 h-4" /> Delete
            </button>
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left: Details */}
        <div className="lg:col-span-2 space-y-5">
          {/* Score Cards */}
          <div className={`card p-5 border ${levelBg}`}>
            <h2 className="text-sm font-semibold text-gray-400 uppercase tracking-wider mb-4">
              Risk Scores
            </h2>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <ScoreBlock label="Likelihood" value={risk.likelihood} color="bg-gray-700/50 border-gray-600" />
              <ScoreBlock label="Impact" value={risk.impact} color="bg-gray-700/50 border-gray-600" />
              <ScoreBlock label="Inherent Risk" value={risk.inherentRisk} color="bg-orange-500/10 border-orange-500/30" />
              <ScoreBlock label="Residual Risk" value={risk.residualRisk} color={`${levelBg}`} />
            </div>
            <div className="mt-4 pt-4 border-t border-gray-700">
              <div className="flex justify-between text-sm">
                <span className="text-gray-400">Control Effectiveness</span>
                <span className="text-green-400 font-semibold">{risk.controlEffectiveness}%</span>
              </div>
              <div className="mt-2 w-full bg-gray-700 rounded-full h-2">
                <div
                  className="bg-green-500 h-2 rounded-full transition-all"
                  style={{ width: `${risk.controlEffectiveness}%` }}
                  role="progressbar"
                  aria-valuenow={risk.controlEffectiveness}
                  aria-valuemin={0}
                  aria-valuemax={100}
                />
              </div>
            </div>
          </div>

          {/* Description */}
          <div className="card p-5">
            <h2 className="text-base font-semibold text-white mb-3">Description</h2>
            <p className="text-gray-300 text-sm leading-relaxed">{risk.description}</p>
          </div>

          {/* Details */}
          <div className="card p-5">
            <h2 className="text-base font-semibold text-white mb-3">Details</h2>
            <div>
              <InfoRow label="Category" value={formatCategory(risk.category)} />
              <InfoRow label="Status" value={formatStatus(risk.status)} />
              <InfoRow label="Risk Level" value={<RiskLevelBadge level={risk.riskLevel} />} />
              <InfoRow label="Created By" value={risk.createdBy} />
              <InfoRow
                label="Created At"
                value={risk.createdAt ? format(new Date(risk.createdAt), 'PPpp') : undefined}
              />
              <InfoRow
                label="Updated At"
                value={risk.updatedAt ? format(new Date(risk.updatedAt), 'PPpp') : undefined}
              />
            </div>
          </div>

          {/* Saved AI Description */}
          {risk.aiDescription && (
            <div className="card p-5 border-primary-500/20">
              <h2 className="text-base font-semibold text-white mb-3">Saved AI Description</h2>
              <p className="text-gray-300 text-sm leading-relaxed whitespace-pre-wrap">{risk.aiDescription}</p>
            </div>
          )}

          {/* Saved AI Recommendations */}
          {risk.aiRecommendations && (
            <div className="card p-5 border-primary-500/20">
              <h2 className="text-base font-semibold text-white mb-3">Saved AI Recommendations</h2>
              {(() => {
                try {
                  const recs = JSON.parse(risk.aiRecommendations);
                  if (Array.isArray(recs)) {
                    return (
                      <ul className="space-y-2">
                        {recs.map((r, i) => (
                          <li key={i} className="flex items-start gap-2 text-gray-300 text-sm">
                            <span className="text-primary-400 mt-0.5 flex-shrink-0">•</span>
                            <span>{r.description || r.title || JSON.stringify(r)}</span>
                          </li>
                        ))}
                      </ul>
                    );
                  }
                } catch {}
                return <p className="text-gray-300 text-sm whitespace-pre-wrap">{risk.aiRecommendations}</p>;
              })()}
            </div>
          )}

          {/* Attachment */}
          {isAdmin && (
            <div className="card p-5">
              <h2 className="text-base font-semibold text-white mb-3">Attachment</h2>
              {risk.attachmentName ? (
                <div className="flex items-center gap-3 p-3 bg-gray-750 rounded-lg">
                  <PaperClipIcon className="w-5 h-5 text-gray-400 flex-shrink-0" />
                  <span className="text-gray-300 text-sm flex-1 truncate">{risk.attachmentName}</span>
                </div>
              ) : (
                <p className="text-gray-500 text-sm mb-3">No attachment uploaded.</p>
              )}
              <label className="mt-3 flex items-center gap-2 cursor-pointer btn-secondary w-fit">
                <CloudArrowUpIcon className="w-4 h-4" />
                {uploading ? 'Uploading…' : 'Upload File (PDF/DOCX, max 5MB)'}
                <input
                  type="file"
                  accept=".pdf,.docx"
                  className="hidden"
                  onChange={handleFileUpload}
                  disabled={uploading}
                />
              </label>
            </div>
          )}
        </div>

        {/* Right: AI Panel */}
        <div>
          <div className="card p-5 sticky top-4">
            <AiPanel riskId={id} onUpdated={fetchRisk} />
          </div>
        </div>
      </div>

      <ConfirmModal
        isOpen={deleteOpen}
        title="Delete Risk Record"
        message={`Permanently delete "${risk.riskTitle}"? This cannot be undone.`}
        onConfirm={handleDelete}
        onCancel={() => setDeleteOpen(false)}
      />
    </div>
  );
}
