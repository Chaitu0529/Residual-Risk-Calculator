import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import Spinner from '../common/Spinner';
import { CATEGORIES, STATUSES } from '../../services/riskService';
import { calcInherentRisk, calcResidualRisk, getRiskLevel, riskLevelBadgeClass } from '../../utils/riskUtils';

const DEFAULT_VALUES = {
  riskTitle: '',
  description: '',
  category: 'CYBERSECURITY',
  likelihood: 5,
  impact: 5,
  controlEffectiveness: 50,
  status: 'OPEN',
};

export default function RiskForm({ initialData, onSubmit, isEdit = false }) {
  const navigate = useNavigate();
  const [saving, setSaving] = useState(false);

  const {
    register,
    handleSubmit,
    watch,
    reset,
    formState: { errors },
  } = useForm({
    defaultValues: initialData
      ? {
          riskTitle: initialData.riskTitle || '',
          description: initialData.description || '',
          category: initialData.category || 'CYBERSECURITY',
          likelihood: initialData.likelihood || 5,
          impact: initialData.impact || 5,
          controlEffectiveness: initialData.controlEffectiveness || 50,
          status: initialData.status || 'OPEN',
        }
      : DEFAULT_VALUES,
  });

  // Reset form when initialData changes (edit mode)
  useEffect(() => {
    if (initialData) {
      reset({
        riskTitle: initialData.riskTitle || '',
        description: initialData.description || '',
        category: initialData.category || 'CYBERSECURITY',
        likelihood: initialData.likelihood || 5,
        impact: initialData.impact || 5,
        controlEffectiveness: initialData.controlEffectiveness || 50,
        status: initialData.status || 'OPEN',
      });
    }
  }, [initialData, reset]);

  const watchedValues = watch(['likelihood', 'impact', 'controlEffectiveness']);
  const likelihood = Number(watchedValues[0]) || 0;
  const impact = Number(watchedValues[1]) || 0;
  const ce = Number(watchedValues[2]) || 0;
  const inherentRisk = calcInherentRisk(likelihood, impact);
  const residualRisk = calcResidualRisk(inherentRisk, ce);
  const riskLevel = getRiskLevel(residualRisk);

  const submitHandler = async (data) => {
    setSaving(true);
    try {
      await onSubmit({
        ...data,
        likelihood: Number(data.likelihood),
        impact: Number(data.impact),
        controlEffectiveness: Number(data.controlEffectiveness),
      });
    } catch (err) {
      const msg = err.response?.data?.message || 'Failed to save risk record';
      toast.error(msg);
    } finally {
      setSaving(false);
    }
  };

  return (
    <form onSubmit={handleSubmit(submitHandler)} noValidate>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left: Main Fields */}
        <div className="lg:col-span-2 space-y-5">
          <div className="form-section">
            <h2 className="text-base font-semibold text-white mb-4">Risk Information</h2>

            {/* Title */}
            <div>
              <label className="label" htmlFor="riskTitle">Risk Title *</label>
              <input
                id="riskTitle"
                className={`input ${errors.riskTitle ? 'border-red-500' : ''}`}
                placeholder="e.g., Phishing Attack on Corporate Email"
                {...register('riskTitle', {
                  required: 'Risk title is required',
                  minLength: { value: 5, message: 'Must be at least 5 characters' },
                  maxLength: { value: 255, message: 'Must be under 255 characters' },
                })}
              />
              {errors.riskTitle && (
                <p className="text-red-400 text-xs mt-1">{errors.riskTitle.message}</p>
              )}
            </div>

            {/* Description */}
            <div>
              <label className="label" htmlFor="description">Description *</label>
              <textarea
                id="description"
                rows={4}
                className={`input resize-none ${errors.description ? 'border-red-500' : ''}`}
                placeholder="Describe the risk scenario, potential causes, and business context…"
                {...register('description', {
                  required: 'Description is required',
                  minLength: { value: 20, message: 'Must be at least 20 characters' },
                })}
              />
              {errors.description && (
                <p className="text-red-400 text-xs mt-1">{errors.description.message}</p>
              )}
            </div>

            {/* Category */}
            <div>
              <label className="label" htmlFor="category">Category *</label>
              <select id="category" className="select" {...register('category', { required: true })}>
                {CATEGORIES.map((c) => (
                  <option key={c} value={c}>
                    {c.replace(/_/g, ' ')}
                  </option>
                ))}
              </select>
            </div>

            {/* Status (edit mode) */}
            {isEdit && (
              <div>
                <label className="label" htmlFor="status">Status</label>
                <select id="status" className="select" {...register('status')}>
                  {STATUSES.map((s) => (
                    <option key={s} value={s}>
                      {s.replace(/_/g, ' ')}
                    </option>
                  ))}
                </select>
              </div>
            )}
          </div>
        </div>

        {/* Right: Scores + Preview */}
        <div className="space-y-5">
          <div className="form-section">
            <h2 className="text-base font-semibold text-white mb-4">Risk Scoring</h2>

            {/* Likelihood */}
            <div>
              <div className="flex justify-between items-center mb-1">
                <label className="label mb-0" htmlFor="likelihood">Likelihood</label>
                <span className="text-primary-400 font-bold text-lg">{likelihood}</span>
              </div>
              <input
                id="likelihood"
                type="range"
                min={1}
                max={10}
                step={1}
                className="w-full accent-primary-500 cursor-pointer"
                {...register('likelihood', { min: 1, max: 10 })}
              />
              <div className="flex justify-between text-xs text-gray-500 mt-0.5">
                <span>Rare (1)</span><span>Certain (10)</span>
              </div>
            </div>

            {/* Impact */}
            <div>
              <div className="flex justify-between items-center mb-1">
                <label className="label mb-0" htmlFor="impact">Impact</label>
                <span className="text-primary-400 font-bold text-lg">{impact}</span>
              </div>
              <input
                id="impact"
                type="range"
                min={1}
                max={10}
                step={1}
                className="w-full accent-primary-500 cursor-pointer"
                {...register('impact', { min: 1, max: 10 })}
              />
              <div className="flex justify-between text-xs text-gray-500 mt-0.5">
                <span>Negligible (1)</span><span>Catastrophic (10)</span>
              </div>
            </div>

            {/* Control Effectiveness */}
            <div>
              <div className="flex justify-between items-center mb-1">
                <label className="label mb-0" htmlFor="controlEffectiveness">Control Effectiveness</label>
                <span className="text-green-400 font-bold text-lg">{ce}%</span>
              </div>
              <input
                id="controlEffectiveness"
                type="range"
                min={0}
                max={100}
                step={5}
                className="w-full accent-green-500 cursor-pointer"
                {...register('controlEffectiveness', { min: 0, max: 100 })}
              />
              <div className="flex justify-between text-xs text-gray-500 mt-0.5">
                <span>None (0%)</span><span>Full (100%)</span>
              </div>
            </div>

            <div className="divider" />

            {/* Calculated Preview */}
            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <span className="text-gray-400 text-sm">Inherent Risk</span>
                <span className="font-mono font-semibold text-white">{inherentRisk.toFixed(1)}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-400 text-sm">Residual Risk</span>
                <span className="font-mono font-bold text-white">{residualRisk.toFixed(1)}</span>
              </div>
              <div className="flex justify-between items-center pt-1">
                <span className="text-gray-400 text-sm">Risk Level</span>
                <span className={riskLevelBadgeClass(riskLevel)}>{riskLevel}</span>
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="flex flex-col gap-3">
            <button type="submit" className="btn-primary w-full justify-center" disabled={saving}>
              {saving ? <><Spinner size="sm" />{isEdit ? 'Updating…' : 'Creating…'}</> : isEdit ? 'Update Risk' : 'Create Risk'}
            </button>
            <button
              type="button"
              onClick={() => navigate(-1)}
              className="btn-secondary w-full justify-center"
            >
              Cancel
            </button>
          </div>
        </div>
      </div>
    </form>
  );
}
