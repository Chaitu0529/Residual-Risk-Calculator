import { useState } from 'react';
import { SparklesIcon, ChevronDownIcon, ChevronUpIcon } from '@heroicons/react/24/outline';
import { riskService } from '../../services/riskService';
import Spinner from '../common/Spinner';
import toast from 'react-hot-toast';

function AiSection({ title, icon, children, initialOpen = false }) {
  const [open, setOpen] = useState(initialOpen);
  return (
    <div className="border border-gray-700 rounded-xl overflow-hidden">
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between px-4 py-3 bg-gray-750 hover:bg-gray-700 transition-colors text-left"
        aria-expanded={open}
      >
        <div className="flex items-center gap-2">
          <SparklesIcon className="w-4 h-4 text-primary-400" />
          <span className="text-sm font-semibold text-white">{title}</span>
        </div>
        {open ? (
          <ChevronUpIcon className="w-4 h-4 text-gray-400" />
        ) : (
          <ChevronDownIcon className="w-4 h-4 text-gray-400" />
        )}
      </button>
      {open && <div className="px-4 py-4 bg-gray-800">{children}</div>}
    </div>
  );
}

function RecommendationCard({ rec, index }) {
  const priorityColors = {
    HIGH: 'text-red-400 bg-red-400/10',
    MEDIUM: 'text-yellow-400 bg-yellow-400/10',
    LOW: 'text-green-400 bg-green-400/10',
    CRITICAL: 'text-red-500 bg-red-500/10',
  };
  const typeColors = {
    PREVENTIVE: 'text-blue-400 bg-blue-400/10',
    DETECTIVE: 'text-purple-400 bg-purple-400/10',
    CORRECTIVE: 'text-orange-400 bg-orange-400/10',
    ADMINISTRATIVE: 'text-cyan-400 bg-cyan-400/10',
    TECHNICAL: 'text-emerald-400 bg-emerald-400/10',
  };
  const pColor = priorityColors[rec.priority] || 'text-gray-400 bg-gray-400/10';
  const tColor = typeColors[rec.action_type] || 'text-gray-400 bg-gray-400/10';

  return (
    <div className="border border-gray-700 rounded-lg p-4 space-y-2">
      <div className="flex items-start justify-between gap-2">
        <p className="text-white font-medium text-sm">
          {index + 1}. {rec.title || rec.description?.slice(0, 60) || 'Recommendation'}
        </p>
        <div className="flex gap-1.5 flex-shrink-0">
          {rec.priority && (
            <span className={`badge text-xs ${pColor}`}>{rec.priority}</span>
          )}
          {rec.action_type && (
            <span className={`badge text-xs ${tColor}`}>{rec.action_type}</span>
          )}
        </div>
      </div>
      {rec.description && (
        <p className="text-gray-400 text-sm leading-relaxed">{rec.description}</p>
      )}
    </div>
  );
}

export default function AiPanel({ riskId, onUpdated }) {
  const [loadingDesc, setLoadingDesc] = useState(false);
  const [loadingRec, setLoadingRec] = useState(false);
  const [loadingReport, setLoadingReport] = useState(false);
  const [description, setDescription] = useState(null);
  const [recommendations, setRecommendations] = useState(null);
  const [report, setReport] = useState(null);

  const generateDesc = async () => {
    setLoadingDesc(true);
    try {
      const res = await riskService.generateDescription(riskId);
      setDescription(res.data?.aiDescription || res.data);
      toast.success('AI description generated');
      onUpdated?.();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to generate description');
    } finally {
      setLoadingDesc(false);
    }
  };

  const generateRec = async () => {
    setLoadingRec(true);
    try {
      const res = await riskService.generateRecommendations(riskId);
      const recs = res.data?.aiRecommendations || res.data;
      if (typeof recs === 'string') {
        try {
          setRecommendations(JSON.parse(recs));
        } catch {
          setRecommendations([{ description: recs }]);
        }
      } else if (Array.isArray(recs)) {
        setRecommendations(recs);
      }
      toast.success('AI recommendations generated');
      onUpdated?.();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to generate recommendations');
    } finally {
      setLoadingRec(false);
    }
  };

  const generateReport = async () => {
    setLoadingReport(true);
    try {
      const res = await riskService.generateReport(riskId);
      const reportData = res.data?.aiReport || res.data;
      if (typeof reportData === 'string') {
        try {
          setReport(JSON.parse(reportData));
        } catch {
          setReport({ summary: reportData });
        }
      } else {
        setReport(reportData);
      }
      toast.success('AI report generated');
      onUpdated?.();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to generate report');
    } finally {
      setLoadingReport(false);
    }
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2 mb-2">
        <SparklesIcon className="w-5 h-5 text-primary-400" />
        <h3 className="text-base font-semibold text-white">AI Analysis</h3>
        <span className="badge bg-primary-500/20 text-primary-400">Powered by Llama 3.3</span>
      </div>

      {/* Description */}
      <AiSection title="Risk Description" initialOpen={true}>
        <div className="space-y-3">
          <button
            onClick={generateDesc}
            disabled={loadingDesc}
            className="btn-primary text-xs"
          >
            {loadingDesc ? <><Spinner size="sm" />Generating…</> : <><SparklesIcon className="w-3.5 h-3.5" />Generate Description</>}
          </button>
          {description && (
            <div className="bg-gray-750 rounded-lg p-4">
              <p className="text-gray-300 text-sm leading-relaxed whitespace-pre-wrap">{description}</p>
            </div>
          )}
        </div>
      </AiSection>

      {/* Recommendations */}
      <AiSection title="Mitigation Recommendations">
        <div className="space-y-3">
          <button
            onClick={generateRec}
            disabled={loadingRec}
            className="btn-primary text-xs"
          >
            {loadingRec ? <><Spinner size="sm" />Generating…</> : <><SparklesIcon className="w-3.5 h-3.5" />Generate Recommendations</>}
          </button>
          {Array.isArray(recommendations) && recommendations.length > 0 && (
            <div className="space-y-2">
              {recommendations.map((rec, i) => (
                <RecommendationCard key={i} rec={rec} index={i} />
              ))}
            </div>
          )}
        </div>
      </AiSection>

      {/* Report */}
      <AiSection title="Executive Risk Report">
        <div className="space-y-3">
          <button
            onClick={generateReport}
            disabled={loadingReport}
            className="btn-primary text-xs"
          >
            {loadingReport ? <><Spinner size="sm" />Generating…</> : <><SparklesIcon className="w-3.5 h-3.5" />Generate Report</>}
          </button>
          {report && (
            <div className="space-y-4">
              {report.title && (
                <h4 className="text-white font-semibold">{report.title}</h4>
              )}
              {report.summary && (
                <div>
                  <p className="text-xs font-medium text-gray-400 uppercase tracking-wider mb-1">Summary</p>
                  <p className="text-gray-300 text-sm leading-relaxed">{report.summary}</p>
                </div>
              )}
              {report.overview && (
                <div>
                  <p className="text-xs font-medium text-gray-400 uppercase tracking-wider mb-1">Overview</p>
                  <p className="text-gray-300 text-sm leading-relaxed">{report.overview}</p>
                </div>
              )}
              {Array.isArray(report.key_findings) && report.key_findings.length > 0 && (
                <div>
                  <p className="text-xs font-medium text-gray-400 uppercase tracking-wider mb-2">Key Findings</p>
                  <ul className="space-y-1">
                    {report.key_findings.map((f, i) => (
                      <li key={i} className="flex items-start gap-2 text-gray-300 text-sm">
                        <span className="text-primary-400 mt-0.5">•</span>
                        <span>{typeof f === 'string' ? f : f.finding || JSON.stringify(f)}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
              {Array.isArray(report.recommendations) && report.recommendations.length > 0 && (
                <div>
                  <p className="text-xs font-medium text-gray-400 uppercase tracking-wider mb-2">Recommendations</p>
                  <ul className="space-y-1">
                    {report.recommendations.map((r, i) => (
                      <li key={i} className="flex items-start gap-2 text-gray-300 text-sm">
                        <span className="text-green-400 mt-0.5">→</span>
                        <span>{typeof r === 'string' ? r : r.recommendation || r.description || JSON.stringify(r)}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          )}
        </div>
      </AiSection>
    </div>
  );
}
